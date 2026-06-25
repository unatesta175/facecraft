'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, ArrowLeft, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { PreviewModal } from '@/components/kiosk/preview-modal';
import { KioskDateFilter, KioskTimeFilter } from '@/components/kiosk/kiosk-filter-pickers';
import { PhotoGridItem } from '@/components/kiosk/photo-grid-item';
import { KIOSK_FRAME_ASPECT_CLASS } from '@/components/kiosk/kiosk-framed-image';
import { kioskApi, type KioskFrame } from '@/lib/kiosk-api';
import { useRouter } from 'next/navigation';

type KioskPhoto = {
  id: string;
  url: string;
  capturedAt: Date;
};

const generateMockPhotos = (count: number, offset = 0): KioskPhoto[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = offset + i;
    const day = (index % 23) + 1;
    const hour = 9 + (index % 12);
    const minute = (index * 7) % 60;
    const capturedAt = new Date(2026, 5, day, hour, minute);

    return {
      id: `photo-${index + 1}`,
      url: `https://picsum.photos/seed/${index + 100}/600/800`,
      capturedAt,
    };
  });
};

export default function SelectPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<KioskPhoto[]>(() => generateMockPhotos(20));
  const [frames, setFrames] = useState<KioskFrame[]>([]);
  const [framesLoading, setFramesLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<KioskFrame | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const selectedFrameUrl = selectedFrame?.imageUrl ?? null;

  useEffect(() => {
    if (!selectedFrameUrl) return;
    const img = new Image();
    img.src = selectedFrameUrl;
  }, [selectedFrameUrl]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await kioskApi.getActiveFrames();
        if (cancelled) return;
        const activeFrames = response.data ?? [];
        setFrames(activeFrames);
        if (activeFrames.length > 0) {
          setSelectedFrame(activeFrames[0]);
        }
      } catch {
        if (!cancelled) {
          setFrames([]);
        }
      } finally {
        if (!cancelled) {
          setFramesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    setPhotos((prev) => [...prev, ...generateMockPhotos(10, prev.length)]);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleNext = () => {
    if (selectedPhotos.size === 0) {
      alert('Please select at least one photo');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleApplyPreview = () => {
    setShowPreviewModal(false);
    setIsLoading(true);
    setTimeout(() => {
      router.push('/kiosk/shop');
    }, 800);
  };

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (dateFilter) {
        const photoDate = format(photo.capturedAt, 'yyyy-MM-dd');
        if (photoDate !== dateFilter) return false;
      }
      if (timeFilter) {
        const photoTime = format(photo.capturedAt, 'HH:mm');
        if (photoTime !== timeFilter) return false;
      }
      return true;
    });
  }, [photos, dateFilter, timeFilter]);

  const previewPhotos = useMemo(
    () =>
      Array.from(selectedPhotos)
        .map((id) => {
          const photo = filteredPhotos.find((p) => p.id === id);
          return photo ? { id, url: photo.url } : null;
        })
        .filter((photo): photo is { id: string; url: string } => photo !== null),
    [filteredPhotos, selectedPhotos]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] pb-24">
      <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-4 py-4 md:px-8">
        <Button
          onClick={() => router.push('/kiosk/capture')}
          variant="ghost"
          className="rounded-xl text-[#6b6b6b] transition-colors hover:bg-[#f5f5f5] hover:text-[#1f1b16]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Capture
        </Button>
      </div>

      <div className="sticky top-0 z-40 border-b border-[#f0f0f0] bg-[#fafafa] shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="mb-6 font-jakarta text-2xl font-bold text-[#1f1b16] md:text-3xl">
              Select Your Photos
            </h2>

            <div className="mb-6 flex flex-col gap-4 md:flex-row">
              <KioskDateFilter value={dateFilter} onChange={setDateFilter} />
              <KioskTimeFilter value={timeFilter} onChange={setTimeFilter} />
            </div>

            <div className="relative">
              <p className="mb-3 font-nunito text-sm text-[#6b6b6b]">Choose a frame style:</p>
              {framesLoading ? (
                <p className="font-nunito text-sm text-[#9a9286]">Loading frames...</p>
              ) : frames.length === 0 ? (
                <p className="font-nunito text-sm text-[#9a9286]">No active frames available.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {frames.map((frame) => {
                    const isSelected = selectedFrame?.id === frame.id;

                    return (
                      <motion.button
                        key={frame.id}
                        type="button"
                        aria-label={`Select frame ${frame.name}`}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedFrame(frame)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-shrink-0"
                      >
                        <div
                          className={`relative ${KIOSK_FRAME_ASPECT_CLASS} w-28 overflow-hidden rounded-xl border-2 bg-[#f5f5f5] shadow-sm transition-all md:w-32 ${
                            isSelected
                              ? 'border-[#c9982f] ring-2 ring-[#c9982f]/30 shadow-md'
                              : 'border-[#f0f0f0] hover:border-[#e0e0e0]'
                          }`}
                        >
                          {frame.imageUrl ? (
                            <img
                              src={frame.imageUrl}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5]">
                              <ImageOff className="h-5 w-5 text-[#9a9286]" />
                            </div>
                          )}
                          {isSelected ? (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#c9982f] to-[#b8872a] shadow">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          ) : null}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {filteredPhotos.map((photo, index) => (
            <PhotoGridItem
              key={photo.id}
              id={photo.id}
              url={photo.url}
              capturedAt={photo.capturedAt}
              frameUrl={selectedFrameUrl}
              isSelected={selectedPhotos.has(photo.id)}
              index={index}
              onToggle={togglePhotoSelection}
            />
          ))}
        </div>

        {filteredPhotos.length === 0 ? (
          <p className="py-12 text-center font-nunito text-[#9a9286]">
            No photos match the selected date or time.
          </p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <p className="font-nunito text-[#b0b0b0]">Scroll for more photos...</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedPhotos.size > 0 ? (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#f0f0f0] bg-[#fafafa] shadow-2xl"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8">
              <p className="font-jakarta text-lg font-bold text-[#1f1b16]">
                {selectedPhotos.size} {selectedPhotos.size === 1 ? 'photo' : 'photos'} selected
              </p>
              <Button
                onClick={handleNext}
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-[#c9982f] to-[#b8872a] px-10 py-6 font-jakarta text-lg text-white shadow-lg hover:from-[#b8872a] hover:to-[#a77824] hover:shadow-xl"
              >
                Next
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PreviewModal
        photos={previewPhotos}
        frameUrl={selectedFrameUrl}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onApply={handleApplyPreview}
      />
    </div>
  );
}
