'use client';

import { motion } from 'framer-motion';
import { X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  KioskFramedImage,
  KIOSK_FRAME_ASPECT_CLASS,
  DEFAULT_PHOTO_TRANSFORM,
  type PhotoTransform,
} from '@/components/kiosk/kiosk-framed-image';

interface PhotoFrameModalProps {
  imageUrl: string;
  frameUrl?: string | null;
  photoTransform?: PhotoTransform;
  productName: string;
  frameName?: string;
  photoCount?: number;
  onSave: () => void;
  onClose: () => void;
}

export function PhotoFrameModal({
  imageUrl,
  frameUrl = null,
  photoTransform = DEFAULT_PHOTO_TRANSFORM,
  productName,
  frameName = 'Standard Frame',
  photoCount = 1,
  onSave,
  onClose,
}: PhotoFrameModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] px-6 md:px-8 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-jakarta text-xl md:text-2xl font-bold">
                Preview - {productName}
              </h3>
              <p className="font-nunito text-sm text-white/90 mt-1 flex items-center gap-2">
                <Image className="h-4 w-4" />
                {photoCount} {photoCount === 1 ? 'photo' : 'photos'} • {frameName}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-[#f9f9f7]">
          <div className="relative max-w-md mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#c9982f] to-[#b8872a] rounded-2xl opacity-20" />
            <div className="absolute -inset-2 bg-gradient-to-br from-[#c9982f] to-[#b8872a] rounded-2xl opacity-30" />

            <div className={`relative ${KIOSK_FRAME_ASPECT_CLASS} bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-white`}>
              <KioskFramedImage
                photoUrl={imageUrl}
                frameUrl={frameUrl}
                alt="Preview"
                photoTransform={photoTransform}
                photoFit="contain"
              />

              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] text-white px-4 py-2 rounded-lg shadow-lg">
                  <p className="font-jakarta text-sm font-semibold text-center">
                    {frameName} Frame
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="font-nunito text-sm text-[#6b6b6b]">
              This is how your {photoCount === 1 ? 'photo' : 'photos'} will appear in the final product
            </p>
            {photoCount > 1 && (
              <p className="font-nunito text-xs text-[#9a9286]">
                All {photoCount} photos will use this frame style
              </p>
            )}
          </div>
        </div>

        <div className="px-6 md:px-8 pb-6 md:pb-8 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="flex-1 font-jakarta border-2 border-[#e0e0e0] text-[#1f1b16] hover:bg-[#f9f9f7] hover:border-[#c9982f] py-6 rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            size="lg"
            className="flex-1 bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta py-6 rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            Save & Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
