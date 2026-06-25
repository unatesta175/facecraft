'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Info, Wand2, Check, AlertCircle, ArrowLeft, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AIPhotoEditorModal } from '@/components/kiosk/ai-photo-editor-modal';
import { PhotoFrameModal } from '@/components/kiosk/photo-frame-modal';
import { kioskApi, type KioskShopPackage, type KioskShopProduct } from '@/lib/kiosk-api';
import { useKioskCart } from '@/hooks/use-kiosk-cart';

const SELECTED_IMAGES = [
  { id: 'img-1', url: 'https://picsum.photos/seed/201/400/600', filename: 'photo_001.png' },
  { id: 'img-2', url: 'https://picsum.photos/seed/202/400/600', filename: 'photo_002.png' },
  { id: 'img-3', url: 'https://picsum.photos/seed/203/400/600', filename: 'photo_003.png' },
  { id: 'img-4', url: 'https://picsum.photos/seed/204/400/600', filename: 'photo_004.png' },
  { id: 'img-5', url: 'https://picsum.photos/seed/205/400/600', filename: 'photo_005.png' },
];

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
  const [aiModalImage, setAiModalImage] = useState<string | null>(null);
  const [frameModalData, setFrameModalData] = useState<{
    pkg: KioskShopPackage;
    product: KioskShopProduct;
    images: { id: string; url: string; filename: string }[];
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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
    const imagesToAssign: { id: string; url: string; filename: string }[] = [];
    selectedImageArray.forEach(imgId => {
      const image = SELECTED_IMAGES.find(img => img.id === imgId);
      if (image) {
        const qty = imageQuantities[imgId] || 1;
        for (let i = 0; i < qty; i++) {
          imagesToAssign.push({
            id: image.id,
            url: image.url,
            filename: image.filename,
          });
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
        [product.id]: [...(prev[pkg.id]?.[product.id] || []), ...images.map(img => ({
          imageId: img.id,
          imageUrl: img.url,
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

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <div className="max-w-[1920px] mx-auto p-4 md:p-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <Button
            onClick={() => router.push('/kiosk/select-photos')}
            variant="ghost"
            className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-[#f5f5f5] rounded-xl transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Photos
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="font-jakarta text-3xl md:text-4xl font-bold text-[#1f1b16] mb-2">
            Choose Your Package
          </h2>
          <p className="font-nunito text-lg text-[#6b6b6b]">
            Select products and assign your photos
          </p>
        </motion.div>

        {/* Main Content - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Packages */}
          <div className="lg:col-span-2 space-y-6">
            {packagesLoading ? (
              <div className="rounded-2xl border border-[#f0f0f0] bg-white p-12 text-center shadow-md">
                <p className="font-nunito text-[#6b6b6b]">Loading packages...</p>
              </div>
            ) : packagesError ? (
              <div className="rounded-2xl border border-[#f0f0f0] bg-white p-12 text-center shadow-md">
                <p className="font-nunito text-[#ff6b6b]">{packagesError}</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="rounded-2xl border border-[#f0f0f0] bg-white p-12 text-center shadow-md">
                <p className="font-nunito text-[#6b6b6b]">No active packages available.</p>
              </div>
            ) : (
              <>
                {packages.map((pkg, index) => {
                  const isInCart = cart.includes(pkg.id);
                  const totalRequired = pkg.products.reduce((sum, p) => sum + p.photoCount, 0);
                  const totalAssigned = pkg.products.reduce((sum, p) => {
                    return sum + (productAssignments[pkg.id]?.[p.id]?.length || 0);
                  }, 0);
                  const progressPercent = totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0;

                  return (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-2xl p-6 md:p-8 shadow-md border-2 transition-all ${
                        isInCart
                          ? 'border-[#c9982f] shadow-lg'
                          : 'border-[#f0f0f0]'
                      }`}
                    >
                  <div className="flex items-start gap-6 mb-6">
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#fbf3df] to-[#f7f0d8] shadow-sm md:h-32 md:w-32">
                      {pkg.imageUrl ? (
                        <img
                          src={pkg.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingCart className="h-12 w-12 text-[#c9982f] md:h-16 md:w-16" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-jakarta text-xl md:text-2xl font-bold text-[#1f1b16]">
                            {pkg.name}
                          </h3>
                          {pkg.description ? (
                            <p className="font-nunito text-sm text-[#6b6b6b] mt-1">
                              {pkg.description}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#9a9286] hover:text-[#1f1b16] hover:bg-[#fafafa]"
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="font-jakarta text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#c9982f] to-[#b8872a] bg-clip-text text-transparent">
                          RM {pkg.price.toFixed(2)}
                        </span>
                        <span className="font-nunito text-sm text-[#9a9286]">
                          / package
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6 bg-[#fafafa] rounded-xl p-4 border border-[#f0f0f0]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-nunito text-sm text-[#6b6b6b]">
                        Package Progress
                      </span>
                      <span className="font-jakarta font-semibold text-[#1f1b16]">
                        {totalAssigned} / {totalRequired} photos
                      </span>
                    </div>
                    <div className="w-full bg-[#e0e0e0] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-3 mb-6">
                    {pkg.products.map((product) => {
                      const progress = getProductProgress(pkg.id, product.id, product.photoCount);
                      
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            progress.isComplete
                              ? 'bg-gradient-to-r from-[#eef3e3] to-[#e8f0d9] border-[#436b35]'
                              : 'bg-white border-[#f0f0f0]'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {product.imageUrl ? (
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[#f0f0f0] bg-[#fafafa]">
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[#f0f0f0] bg-[#fafafa]">
                                <ImageOff className="h-4 w-4 text-[#9a9286]" />
                              </div>
                            )}
                            {progress.isComplete && (
                              <div className="w-7 h-7 rounded-full bg-[#436b35] flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-jakarta font-semibold text-[#1f1b16]">
                                {product.name}
                              </p>
                              <p className="font-nunito text-sm text-[#6b6b6b]">
                                {progress.current} / {progress.required} photo(s) assigned
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleAddProduct(pkg, product)}
                            disabled={progress.isComplete}
                            size="sm"
                            className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add to Cart */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#f0f0f0]">
                    <div>
                      <p className="font-nunito text-sm text-[#6b6b6b]">
                        Total: {totalRequired} photos required
                      </p>
                      {!canAddToCart(pkg) && (
                        <p className="font-nunito text-xs text-[#ff6b6b] mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Complete all products to add to cart
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(pkg.id)}
                      disabled={!canAddToCart(pkg) || isInCart}
                      size="lg"
                      className="bg-gradient-to-r from-[#1f1b16] to-[#3a3530] hover:from-[#000000] hover:to-[#1f1b16] text-white font-jakarta px-8 py-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                    >
                      {isInCart ? (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          In Cart
                        </>
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>
                  </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </div>

          {/* Right Column - Album */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-6 shadow-md border border-[#f0f0f0]"
              >
                <h3 className="font-jakarta text-xl font-bold text-[#1f1b16] mb-2">
                  Your Album
                </h3>
                <p className="font-nunito text-sm text-[#6b6b6b] mb-6">
                  {selectedImages.size} image(s) selected • {totalSelectedQuantity} total quantity
                </p>

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {SELECTED_IMAGES.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImages.has(image.id)
                          ? 'border-[#c9982f] shadow-md'
                          : 'border-[#f0f0f0]'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.id}
                        className="w-full aspect-[3/4] object-cover"
                      />

                      {/* Overlay Controls */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                          onClick={() => setAiModalImage(image.url)}
                          size="icon"
                          className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white rounded-full w-10 h-10 shadow-md"
                        >
                          <Wand2 className="h-5 w-5" />
                        </Button>
                        
                        <Button
                          onClick={() => toggleImageSelection(image.id)}
                          size="icon"
                          className={`rounded-full w-10 h-10 shadow-md ${
                            selectedImages.has(image.id)
                              ? 'bg-gradient-to-r from-[#c9982f] to-[#b8872a] text-white'
                              : 'bg-white/95 text-[#1f1b16] hover:bg-white'
                          }`}
                        >
                          {selectedImages.has(image.id) ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {/* Quantity Selector */}
                      <AnimatePresence>
                        {selectedImages.has(image.id) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between shadow-lg border border-[#f0f0f0]"
                          >
                            <span className="font-nunito text-sm font-medium text-[#1f1b16]">
                              Quantity:
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => setImageQuantities(prev => ({
                                  ...prev,
                                  [image.id]: Math.max((prev[image.id] || 1) - 1, 1),
                                }))}
                                size="icon"
                                variant="outline"
                                className="w-8 h-8 border-[#e0e0e0] hover:bg-[#f9f9f7] hover:border-[#c9982f]"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-jakarta font-bold text-[#1f1b16] min-w-[30px] text-center">
                                {imageQuantities[image.id] || 1}
                              </span>
                              <Button
                                onClick={() => setImageQuantities(prev => ({
                                  ...prev,
                                  [image.id]: Math.min((prev[image.id] || 1) + 1, 10),
                                }))}
                                size="icon"
                                variant="outline"
                                className="w-8 h-8 border-[#e0e0e0] hover:bg-[#f9f9f7] hover:border-[#c9982f]"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Floating Checkout Button */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
            >
              <Button
                onClick={handleCheckout}
                size="lg"
                className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
              >
                <ShoppingCart className="mr-3 h-6 w-6" />
                Checkout Cart ({cart.length})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                  className="w-full bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta py-6 rounded-2xl shadow-md"
                >
                  Continue Current Package
                </Button>
                <Button
                  onClick={handleClearPrevious}
                  variant="outline"
                  className="w-full border-2 border-[#ff6b6b] text-[#ff6b6b] hover:text-white hover:bg-[#ff6b6b] hover:border-[#ff6b6b] font-jakarta py-6 rounded-2xl transition-all"
                >
                  Clear & Start New Package
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Photo Editor Modal */}
      {aiModalImage && (
        <AIPhotoEditorModal
          imageUrl={aiModalImage}
          onClose={() => setAiModalImage(null)}
        />
      )}

      {/* Photo Frame Preview Modal */}
      {frameModalData && (
        <PhotoFrameModal
          imageUrl={frameModalData.images[0]?.url || ''}
          productName={frameModalData.product.name}
          frameName={frameModalData.pkg.name}
          photoCount={frameModalData.images.length}
          onSave={handleSaveFrame}
          onClose={() => setFrameModalData(null)}
        />
      )}
    </div>
  );
}
