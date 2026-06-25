'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, RotateCcw, X, Check, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_PHOTO_TRANSFORM,
  KioskFramedImage,
  type PhotoTransform,
} from '@/components/kiosk/kiosk-framed-image';

interface PreviewModalProps {
  photos: Array<{ id: string; url: string }>;
  frameUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

function getPhotoTransform(map: Record<string, PhotoTransform>, photoId: string): PhotoTransform {
  return map[photoId] ?? DEFAULT_PHOTO_TRANSFORM;
}

export function PreviewModal({ photos, frameUrl = null, isOpen, onClose, onApply }: PreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transforms, setTransforms] = useState<Record<string, PhotoTransform>>({});
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentIndex];
  const currentTransform = currentPhoto
    ? getPhotoTransform(transforms, currentPhoto.id)
    : DEFAULT_PHOTO_TRANSFORM;

  const updateCurrentTransform = useCallback(
    (patch: Partial<PhotoTransform>) => {
      if (!currentPhoto) return;
      setTransforms((prev) => ({
        ...prev,
        [currentPhoto.id]: {
          ...getPhotoTransform(prev, currentPhoto.id),
          ...patch,
        },
      }));
    },
    [currentPhoto]
  );

  if (!isOpen || !photos?.length || !currentPhoto) {
    return null;
  }

  const resetCurrentTransform = () => {
    setTransforms((prev) => ({
      ...prev,
      [currentPhoto.id]: { ...DEFAULT_PHOTO_TRANSFORM },
    }));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleZoomIn = () => {
    updateCurrentTransform({ scale: Math.min(currentTransform.scale + 0.2, 3) });
  };

  const handleZoomOut = () => {
    updateCurrentTransform({ scale: Math.max(currentTransform.scale - 0.2, 1) });
  };

  const handleRotate = () => {
    updateCurrentTransform({ rotation: (currentTransform.rotation + 90) % 360 });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: currentTransform.offsetX,
      originY: currentTransform.offsetY,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    updateCurrentTransform({
      offsetX: drag.originX + (event.clientX - drag.startX),
      offsetY: drag.originY + (event.clientY - drag.startY),
    });
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const canPan =
    currentTransform.scale > 1 ||
    currentTransform.offsetX !== 0 ||
    currentTransform.offsetY !== 0 ||
    currentTransform.rotation !== 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-6 py-5 md:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-jakarta text-xl font-bold text-[#1f1b16] md:text-2xl">
                  Preview Your Photos
                </h3>
                <p className="mt-1 font-nunito text-sm text-[#6b6b6b]">
                  Photo {currentIndex + 1} of {photos.length}
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="rounded-xl text-[#6b6b6b] hover:bg-white hover:text-[#1f1b16]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative bg-[#f9f9f7] p-6 md:p-8">
            <div
              ref={viewportRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={`relative aspect-[4/3] touch-none overflow-hidden rounded-2xl border border-[#f0f0f0] bg-white shadow-lg select-none ${
                isDragging ? 'cursor-grabbing' : canPan ? 'cursor-grab' : 'cursor-default'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhoto.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full w-full"
                >
                  <KioskFramedImage
                    photoUrl={currentPhoto.url}
                    frameUrl={frameUrl}
                    alt={`Photo ${currentIndex + 1}`}
                    photoTransform={currentTransform}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="mt-3 flex items-center justify-center gap-2 font-nunito text-xs text-[#9a9286] md:text-sm">
              <Move className="h-4 w-4 shrink-0" />
              Drag the photo to reposition. Use zoom and rotate, then apply when ready.
            </p>
          </div>

          <div className="bg-white px-6 py-6 md:px-8 md:py-8">
            <div className="mb-6 flex items-center justify-center gap-3 md:gap-4">
              <Button
                onClick={handlePrevious}
                disabled={photos.length === 1}
                size="lg"
                className="h-12 w-12 rounded-full bg-gradient-to-r from-[#c9982f] to-[#b8872a] p-0 text-white shadow-md hover:from-[#b8872a] hover:to-[#a77824] disabled:opacity-50 md:h-14 md:w-14"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <div className="flex items-center gap-2 rounded-2xl border border-[#f0f0f0] bg-[#fafafa] px-4 py-3 shadow-sm md:gap-3 md:px-6">
                <Button
                  onClick={handleZoomOut}
                  size="icon"
                  variant="ghost"
                  disabled={currentTransform.scale <= 1}
                  className="h-9 w-9 text-[#6b6b6b] hover:bg-white hover:text-[#1f1b16]"
                >
                  <ZoomOut className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                <span className="min-w-[50px] text-center font-jakarta text-sm font-semibold text-[#1f1b16] md:min-w-[60px] md:text-base">
                  {Math.round(currentTransform.scale * 100)}%
                </span>

                <Button
                  onClick={handleZoomIn}
                  size="icon"
                  variant="ghost"
                  disabled={currentTransform.scale >= 3}
                  className="h-9 w-9 text-[#6b6b6b] hover:bg-white hover:text-[#1f1b16]"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                <div className="mx-1 h-6 w-px bg-[#e0e0e0] md:mx-2 md:h-8" />

                <Button
                  onClick={handleRotate}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-[#6b6b6b] hover:bg-white hover:text-[#1f1b16]"
                >
                  <RotateCw className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                <Button
                  onClick={resetCurrentTransform}
                  size="icon"
                  variant="ghost"
                  title="Reset adjustments"
                  className="h-9 w-9 text-[#6b6b6b] hover:bg-white hover:text-[#1f1b16]"
                >
                  <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={photos.length === 1}
                size="lg"
                className="h-12 w-12 rounded-full bg-gradient-to-r from-[#c9982f] to-[#b8872a] p-0 text-white shadow-md hover:from-[#b8872a] hover:to-[#a77824] disabled:opacity-50 md:h-14 md:w-14"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </div>

            {photos.length > 1 ? (
              <div className="mb-6 flex items-center justify-center gap-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-gradient-to-r from-[#c9982f] to-[#b8872a]'
                        : 'w-2 bg-[#e0e0e0] hover:bg-[#c9982f]/50'
                    }`}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={onClose}
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-2 border-[#e0e0e0] px-8 py-6 font-jakarta text-base text-[#1f1b16] transition-all hover:border-[#c9982f] hover:bg-[#f9f9f7] md:text-lg sm:w-auto"
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </Button>

              <Button
                onClick={onApply}
                size="lg"
                className="w-full transform rounded-2xl bg-gradient-to-r from-[#c9982f] to-[#b8872a] px-12 py-6 font-jakarta text-base text-white shadow-lg transition-all hover:scale-105 hover:from-[#b8872a] hover:to-[#a77824] hover:shadow-xl md:text-lg sm:w-auto"
              >
                <Check className="mr-2 h-5 w-5" />
                Apply Photos
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
