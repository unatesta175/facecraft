'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewModalProps {
  photos: Array<{ id: string; url: string }>;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export function PreviewModal({ photos, isOpen, onClose, onApply }: PreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Validate photos array
  if (!isOpen || !photos || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    resetTransforms();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    resetTransforms();
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-[#fafafa] px-6 md:px-8 py-5 border-b border-[#f0f0f0]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-jakarta text-xl md:text-2xl font-bold text-[#1f1b16]">
                  Preview Your Photos
                </h3>
                <p className="font-nunito text-sm text-[#6b6b6b] mt-1">
                  Photo {currentIndex + 1} of {photos.length}
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-white rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Photo Display Area */}
          <div className="relative bg-[#f9f9f7] p-6 md:p-8">
            <div className="relative aspect-[4/3] bg-white rounded-2xl shadow-lg overflow-hidden border border-[#f0f0f0]">
              {currentPhoto && (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentPhoto.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: zoom,
                      rotate: rotation,
                    }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    src={currentPhoto.url}
                    alt={`Photo ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain w-full h-full"
                  />
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white px-6 md:px-8 py-6 md:py-8">
            {/* Navigation & Transform Controls */}
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-6">
              <Button
                onClick={handlePrevious}
                disabled={photos.length === 1}
                size="lg"
                className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white rounded-full w-12 h-12 md:w-14 md:h-14 p-0 shadow-md disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <div className="flex items-center gap-2 md:gap-3 bg-[#fafafa] rounded-2xl px-4 md:px-6 py-3 shadow-sm border border-[#f0f0f0]">
                <Button
                  onClick={handleZoomOut}
                  size="icon"
                  variant="ghost"
                  className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-white w-9 h-9"
                >
                  <ZoomOut className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                
                <span className="font-jakarta font-semibold text-[#1f1b16] min-w-[50px] md:min-w-[60px] text-center text-sm md:text-base">
                  {Math.round(zoom * 100)}%
                </span>
                
                <Button
                  onClick={handleZoomIn}
                  size="icon"
                  variant="ghost"
                  className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-white w-9 h-9"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                <div className="w-px h-6 md:h-8 bg-[#e0e0e0] mx-1 md:mx-2" />

                <Button
                  onClick={handleRotate}
                  size="icon"
                  variant="ghost"
                  className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-white w-9 h-9"
                >
                  <RotateCw className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={photos.length === 1}
                size="lg"
                className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white rounded-full w-12 h-12 md:w-14 md:h-14 p-0 shadow-md disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </div>

            {/* Page Indicator */}
            {photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      resetTransforms();
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-gradient-to-r from-[#c9982f] to-[#b8872a]'
                        : 'w-2 bg-[#e0e0e0] hover:bg-[#c9982f]/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Instruction Text */}
            <p className="text-center font-nunito text-sm md:text-base text-[#6b6b6b] mb-6 leading-relaxed max-w-2xl mx-auto">
              Review each photo and adjust as needed. Click Apply when you're satisfied with your selections.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={onClose}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-[#e0e0e0] text-[#1f1b16] hover:bg-[#f9f9f7] hover:border-[#c9982f] font-jakarta text-base md:text-lg px-8 py-6 rounded-2xl transition-all"
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </Button>
              
              <Button
                onClick={onApply}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-base md:text-lg px-12 py-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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
