'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Info, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KioskHeader } from '@/components/kiosk/kiosk-header';
import { KioskPageBody, KioskScrollArea, KioskShell, KioskStickyFooter } from '@/components/kiosk/kiosk-shell';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AIPhotoEditorModal } from '@/components/kiosk/ai-photo-editor-modal';
import { PhotoFrameModal } from '@/components/kiosk/photo-frame-modal';
import { kioskApi, type KioskShopPackage, type KioskShopProduct } from '@/lib/kiosk-api';
import { useKioskCart } from '@/hooks/use-kiosk-cart';
import {
  getAlbumPhotoDisplayUrl,
  loadSelectedAlbum,
  saveSelectedAlbum,
  type KioskBrowsePhoto,
} from '@/lib/kiosk-photo-session';
import { KioskAlbumCard } from '@/components/kiosk/kiosk-album-card';
import { normalizePhotoTransform, type PhotoTransform } from '@/components/kiosk/kiosk-framed-image';
import { kioskBtnPrimary, kioskCard } from '@/lib/kiosk-ui';

type AlbumImage = {
  id: string;
  url: string;
  displayUrl: string;
  s3Key: string;
  filename: string;
  capturedAt: string;
  photoTransform: PhotoTransform;
  editedPhotoUrl?: string | null;
};

export default function ShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    cartPackageIds: cart,
    productAssignments,
    setProductAssignments,
    addToCart,
  } = useKioskCart();
  const [packages, setPackages] = useState<KioskShopPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [imageQuantities, setImageQuantities] = useState<Record<string, number>>({});
  const [aiModalTargetId, setAiModalTargetId] = useState<string | null>(null);
  const [frameModalData, setFrameModalData] = useState<{
    pkg: KioskShopPackage;
    product: KioskShopProduct;
    images: AlbumImage[];
  } | null>(null);
  const [albumImages, setAlbumImages] = useState<AlbumImage[]>([]);
  const [albumFrameUrl, setAlbumFrameUrl] = useState<string | null>(null);
  const [albumMeta, setAlbumMeta] = useState<{
    frameId: string | null;
    source: 'face-search' | 'manual';
  }>({ frameId: null, source: 'manual' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await kioskApi.getShopPackages();
        if (cancelled) return;
        setPackages(response.data ?? []);
        setPackagesError(null);
      } catch {
        if (!cancelled) {
          setPackages([]);
          setPackagesError('Unable to load packages. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setPackagesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const album = loadSelectedAlbum();
    if (!album || album.photos.length === 0) {
      router.replace('/kiosk/select-photos');
      return;
    }

    setAlbumMeta({ frameId: album.frameId, source: album.source });

    const images: AlbumImage[] = album.photos
      .filter((photo): photo is KioskBrowsePhoto & { imageUrl: string } => Boolean(photo.imageUrl))
      .map((photo) => ({
        id: photo.id,
        url: photo.imageUrl,
        displayUrl: getAlbumPhotoDisplayUrl(photo) ?? photo.imageUrl,
        s3Key: photo.s3Key,
        filename: photo.filename,
        capturedAt: photo.capturedAt,
        photoTransform: normalizePhotoTransform(photo.photoTransform),
        editedPhotoUrl: photo.editedPhotoUrl ?? null,
      }));

    setAlbumFrameUrl(album.frameUrl);
    setAlbumImages(images);
  }, [router]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowBackConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleConfirmBack = () => {
    setShowBackConfirm(false);
    router.push('/kiosk/capture');
  };

  const persistAlbum = useCallback(
    (photos: AlbumImage[]) => {
      saveSelectedAlbum({
        photos: photos.map((img) => ({
          id: img.id,
          s3Key: img.s3Key,
          imageUrl: img.url,
          filename: img.filename,
          capturedAt: img.capturedAt,
          photoTransform: img.photoTransform,
          editedPhotoUrl: img.editedPhotoUrl ?? null,
        })),
        frameId: albumMeta.frameId,
        frameUrl: albumFrameUrl,
        source: albumMeta.source,
      });
    },
    [albumMeta, albumFrameUrl]
  );

  const handleAiApply = (editedPhotoUrl: string) => {
    if (!aiModalTargetId) return;

    setAlbumImages((prev) => {
      const next = prev.map((img) =>
        img.id === aiModalTargetId
          ? { ...img, editedPhotoUrl, displayUrl: editedPhotoUrl }
          : img
      );
      persistAlbum(next);
      return next;
    });
    setAiModalTargetId(null);
    toast({
      title: 'AI effect applied',
      description: 'Your photo was updated. The frame is unchanged.',
    });
  };

  const handleAddProduct = (pkg: KioskShopPackage, product: KioskShopProduct) => {
    // Check if there's an active package that's not in cart yet
    const activePackageId = Object.keys(productAssignments).find(pkgId => {
      // Check if this package has any assignments AND is NOT in cart yet
      const hasAssignments = Object.keys(productAssignments[pkgId] || {}).some(
        prodId => (productAssignments[pkgId][prodId]?.length || 0) > 0
      );
      const notInCart = !cart.includes(pkgId);
      return hasAssignments && notInCart;
    });

    // If there's an active package (not in cart) and user is trying to add to a different package
    if (activePackageId && activePackageId !== pkg.id) {
      setPendingPackageId(pkg.id);
      setShowClearConfirm(true);
      return;
    }

    const selectedImageArray = Array.from(selectedImages);
    
    // Calculate total available quantity
    const totalAvailable = selectedImageArray.reduce((sum, imgId) => {
      return sum + (imageQuantities[imgId] || 1);
    }, 0);

    // Check how many photos are already assigned to this product
    const currentAssignments = productAssignments[pkg.id]?.[product.id]?.length || 0;
    const remainingNeeded = product.photoCount - currentAssignments;

    if (totalAvailable < 1) {
      toast({
        title: 'No photos selected',
        description: `Please select at least 1 photo to add to this product.`,
        variant: 'destructive',
      });
      return;
    }

    if (remainingNeeded === 0) {
      toast({
        title: 'Product complete',
        description: `This product already has all ${product.photoCount} photo(s) assigned.`,
        variant: 'destructive',
      });
      return;
    }

    // Prepare images with quantities
    const imagesToAssign: AlbumImage[] = [];
    selectedImageArray.forEach((imgId) => {
      const image = albumImages.find((img) => img.id === imgId);
      if (image) {
        const qty = imageQuantities[imgId] || 1;
        for (let i = 0; i < qty; i++) {
          imagesToAssign.push(image);
        }
      }
    });

    // Take only what's needed for remaining slots
    const imagesToShow = imagesToAssign.slice(0, remainingNeeded);

    // Show frame preview modal
    setFrameModalData({ pkg, product, images: imagesToShow });
  };

  const handleSaveFrame = () => {
    if (!frameModalData) return;

    const { pkg, product, images } = frameModalData;
    
    // Save assignments
    setProductAssignments(prev => ({
      ...prev,
      [pkg.id]: {
        ...prev[pkg.id],
        [product.id]: [...(prev[pkg.id]?.[product.id] || []), ...images.map((img) => ({
          imageId: img.id,
          imageUrl: img.s3Key,
          filename: img.filename,
        }))],
      },
    }));

    // Show success toast with filenames and progress
    const filenames = images.map(img => img.filename).join(', ');
    const newTotal = (productAssignments[pkg.id]?.[product.id]?.length || 0) + images.length;
    const isNowComplete = newTotal >= product.photoCount;
    
    toast({
      title: isNowComplete ? 'Product complete!' : 'Photos added',
      description: isNowComplete 
        ? `${filenames} uploaded. ${product.name} is now complete (${newTotal}/${product.photoCount} photos)`
        : `${filenames} uploaded to ${product.name}. Progress: ${newTotal}/${product.photoCount} photos`,
    });

    // Clear selections after successful assignment
    setSelectedImages(new Set());
    setImageQuantities({});
    setFrameModalData(null);
  };

  const getProductProgress = (pkgId: string, productId: string, requiredCount: number) => {
    const assignments = productAssignments[pkgId]?.[productId] || [];
    return {
      current: assignments.length,
      required: requiredCount,
      isComplete: assignments.length >= requiredCount,
    };
  };

  const canAddToCart = (pkg: KioskShopPackage) => {
    return pkg.products.every(product => {
      const progress = getProductProgress(pkg.id, product.id, product.photoCount);
      return progress.isComplete;
    });
  };

  const handleAddToCart = (pkgId: string) => {
    if (cart.includes(pkgId)) return;

    const pkg = packages.find((item) => item.id === pkgId);
    if (!pkg || !canAddToCart(pkg)) return;

    addToCart(pkg, productAssignments[pkgId] || {});
    toast({
      title: 'Added to cart',
      description: 'Package added successfully!',
    });
  };

  const handleClearPrevious = () => {
    if (pendingPackageId) {
      // Find the active package (has assignments but not in cart)
      const activePackageId = Object.keys(productAssignments).find(pkgId => {
        const hasAssignments = Object.keys(productAssignments[pkgId] || {}).some(
          prodId => (productAssignments[pkgId][prodId]?.length || 0) > 0
        );
        const notInCart = !cart.includes(pkgId);
        return hasAssignments && notInCart;
      });

      if (activePackageId) {
        // Only remove assignments for the active package, keep cart and other packages intact
        setProductAssignments(prev => {
          const newAssignments = { ...prev };
          delete newAssignments[activePackageId];
          return newAssignments;
        });
        
        toast({
          title: 'Selection cleared',
          description: 'Previous package selection has been cleared. You can now work on the new package.',
        });
      }
      
      setShowClearConfirm(false);
      setPendingPackageId(null);
    }
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
    setPendingPackageId(null);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
        const newQuantities = { ...imageQuantities };
        delete newQuantities[imageId];
        setImageQuantities(newQuantities);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleCheckout = () => {
    router.push('/kiosk/cart');
  };

  // Calculate total selected quantity
  const totalSelectedQuantity = Array.from(selectedImages).reduce((sum, imgId) => {
    return sum + (imageQuantities[imgId] || 1);
  }, 0);

  const aiModalTarget = aiModalTargetId
    ? albumImages.find((img) => img.id === aiModalTargetId)
    : null;

  return (
    <KioskShell fixed className="bg-white">
      <KioskHeader
        title="Choose Package"
        subtitle="Assign photos to products"
        onBack={() => setShowBackConfirm(true)}
      />

      <KioskPageBody className="px-0">
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-0">
          {/* Column 1 — Packages */}
          <KioskScrollArea className="border-r border-[--color-border] px-3 py-2">
            <div className="flex flex-col gap-3 pb-2">
              {packagesLoading ? (
                <div className={`${kioskCard} p-6 text-center`}>
                  <p className="font-nunito text-xs text-[--color-text-secondary]">Loading packages...</p>
                </div>
              ) : packagesError ? (
                <div className={`${kioskCard} p-6 text-center`}>
                  <p className="font-nunito text-xs text-[--color-danger-text]">{packagesError}</p>
                </div>
              ) : packages.length === 0 ? (
                <div className={`${kioskCard} p-6 text-center`}>
                  <p className="font-nunito text-xs text-[--color-text-secondary]">No packages available.</p>
                </div>
              ) : (
                packages.map((pkg, index) => {
                const isInCart = cart.includes(pkg.id);
                const totalRequired = pkg.products.reduce((sum, p) => sum + p.photoCount, 0);
                const totalAssigned = pkg.products.reduce((sum, p) => {
                  return sum + (productAssignments[pkg.id]?.[p.id]?.length || 0);
                }, 0);
                const progressPercent = totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0;

                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${kioskCard} border-2 p-3 shadow-sm ${
                      isInCart ? 'border-[--color-gold]' : 'border-[--color-border]'
                    }`}
                  >
                    <div className="mb-3 flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[--color-gold-tint]">
                        {pkg.imageUrl ? (
                          <img src={pkg.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ShoppingCart className="h-8 w-8 text-[--color-gold]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-jakarta text-sm font-bold text-[--color-text-primary]">
                              {pkg.name}
                            </h3>
                            {pkg.description ? (
                              <p className="mt-0.5 font-nunito text-xs text-[--color-text-secondary]">
                                {pkg.description}
                              </p>
                            ) : null}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <Info className="h-4 w-4 text-[--color-text-secondary]" />
                          </Button>
                        </div>
                        <p className="mt-1 font-jakarta text-lg font-bold text-[--color-gold]">
                          RM {pkg.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-[--color-border] bg-[--color-surface-muted] p-3">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-nunito text-[--color-text-secondary]">Progress</span>
                        <span className="font-jakarta font-semibold">
                          {totalAssigned} / {totalRequired}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[--color-border]">
                        <div
                          className="h-2 rounded-full bg-[--color-gold] transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      {pkg.products.map((product) => {
                        const progress = getProductProgress(pkg.id, product.id, product.photoCount);

                        return (
                          <div
                            key={product.id}
                            className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                              progress.isComplete
                                ? 'border-[--color-success-text]/30 bg-[--color-success-bg]'
                                : 'border-[--color-border] bg-white'
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              {progress.isComplete && (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[--color-success-text]">
                                  <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-jakarta text-sm font-semibold">{product.name}</p>
                                <p className="font-nunito text-xs text-[--color-text-secondary]">
                                  {progress.current} / {progress.required} photos
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAddProduct(pkg, product)}
                              disabled={progress.isComplete}
                              size="sm"
                              className={`shrink-0 rounded-lg ${kioskBtnPrimary}`}
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Add
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[--color-border] pt-3">
                      {!canAddToCart(pkg) && (
                        <p className="flex items-center gap-1 font-nunito text-xs text-[--color-danger-text]">
                          <AlertCircle className="h-3 w-3" />
                          Complete all products
                        </p>
                      )}
                      <Button
                        onClick={() => handleAddToCart(pkg.id)}
                        disabled={!canAddToCart(pkg) || isInCart}
                        className={`ml-auto h-11 rounded-xl px-5 ${kioskBtnPrimary}`}
                      >
                        {isInCart ? (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            In Cart
                          </>
                        ) : (
                          'Add to Cart'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })
              )}
            </div>
          </KioskScrollArea>

          {/* Column 2 — Album images */}
          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-[--color-border] px-3 py-2">
              <h3 className="font-jakarta text-sm font-bold text-[--color-text-primary]">Your Album</h3>
              <p className="font-nunito text-[10px] text-[--color-text-secondary]">
                {selectedImages.size} selected · {totalSelectedQuantity} qty
              </p>
            </div>
            <KioskScrollArea className="px-3 py-2">
              {albumImages.length === 0 ? (
                <p className="py-6 text-center font-nunito text-xs text-[--color-text-secondary]">
                  No photos in album
                </p>
              ) : (
                <div className="flex flex-col gap-2 pb-2">
                  {albumImages.map((image) => (
                    <KioskAlbumCard
                      key={image.id}
                      compact
                      image={{
                        id: image.id,
                        filename: image.filename,
                        photoUrl: image.displayUrl,
                        photoTransform: image.photoTransform,
                      }}
                      frameUrl={albumFrameUrl}
                      isSelected={selectedImages.has(image.id)}
                      quantity={imageQuantities[image.id] || 1}
                      onToggleSelect={toggleImageSelection}
                      onOpenAiEditor={setAiModalTargetId}
                      onQuantityChange={(id, quantity) =>
                        setImageQuantities((prev) => ({ ...prev, [id]: quantity }))
                      }
                    />
                  ))}
                </div>
              )}
            </KioskScrollArea>
          </div>
        </div>
      </KioskPageBody>

      <AnimatePresence>
        {cart.length > 0 ? (
          <KioskStickyFooter>
            <Button
              onClick={handleCheckout}
              size="lg"
              className={`h-14 w-full rounded-2xl text-base ${kioskBtnPrimary}`}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Checkout ({cart.length})
            </Button>
          </KioskStickyFooter>
        ) : null}
      </AnimatePresence>

      {/* Back Confirmation Modal */}
      <AnimatePresence>
        {showBackConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3cd]">
                  <AlertCircle className="h-6 w-6 text-[#ff9d00]" />
                </div>
                <h3 className="font-jakarta text-xl font-bold text-[#1f1b16]">Leave this page?</h3>
              </div>

              <p className="mb-8 font-nunito text-base leading-relaxed text-[#6b6b6b]">
                Your package selections on this page will not be saved. Do you want to go back to
                capture a new photo?
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setShowBackConfirm(false)}
                  className={`w-full rounded-2xl py-5 ${kioskBtnPrimary}`}
                >
                  Stay on Shop
                </Button>
                <Button
                  onClick={handleConfirmBack}
                  variant="outline"
                  className="w-full rounded-2xl border-2 border-[--color-danger-text] py-5 font-jakarta text-[--color-danger-text] hover:bg-[--color-danger-text] hover:text-white"
                >
                  Go to Capture
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Previous Selection Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#fff3cd] flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-[#ff9d00]" />
                </div>
                <h3 className="font-jakarta text-xl font-bold text-[#1f1b16]">
                  Finish Current Package First
                </h3>
              </div>
              
              <p className="font-nunito text-base text-[#6b6b6b] mb-2 leading-relaxed">
                You're currently working on another package. To start a new package, you need to either:
              </p>
              <ul className="font-nunito text-base text-[#6b6b6b] mb-8 leading-relaxed list-disc list-inside space-y-1 ml-2">
                <li>Complete all products and add it to cart, or</li>
                <li>Clear the current selection and start fresh</li>
              </ul>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCancelClear}
                  className={`w-full rounded-2xl py-5 ${kioskBtnPrimary}`}
                >
                  Continue Current Package
                </Button>
                <Button
                  onClick={handleClearPrevious}
                  variant="outline"
                  className="w-full rounded-2xl border-2 border-[--color-danger-text] py-5 font-jakarta text-[--color-danger-text] hover:bg-[--color-danger-text] hover:text-white"
                >
                  Clear & Start New Package
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Photo Editor Modal */}
      {aiModalTarget && (
        <AIPhotoEditorModal
          photoUrl={aiModalTarget.url}
          frameUrl={albumFrameUrl}
          photoTransform={aiModalTarget.photoTransform}
          initialEditedPhotoUrl={aiModalTarget.editedPhotoUrl}
          onApply={handleAiApply}
          onClose={() => setAiModalTargetId(null)}
        />
      )}

      {/* Photo Frame Preview Modal */}
      {frameModalData && (
        <PhotoFrameModal
          imageUrl={frameModalData.images[0]?.displayUrl || frameModalData.images[0]?.url || ''}
          frameUrl={albumFrameUrl}
          photoTransform={frameModalData.images[0]?.photoTransform}
          productName={frameModalData.product.name}
          frameName={frameModalData.pkg.name}
          photoCount={frameModalData.images.length}
          onSave={handleSaveFrame}
          onClose={() => setFrameModalData(null)}
        />
      )}
    </KioskShell>
  );
}
