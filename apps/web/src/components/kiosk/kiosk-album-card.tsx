'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  KioskFramedImage,
  KIOSK_FRAME_ASPECT_CLASS,
  type PhotoTransform,
} from '@/components/kiosk/kiosk-framed-image';

export type KioskAlbumCardImage = {
  id: string;
  filename: string;
  photoUrl: string;
  photoTransform: PhotoTransform;
};

type KioskAlbumCardProps = {
  image: KioskAlbumCardImage;
  frameUrl: string | null;
  isSelected: boolean;
  quantity: number;
  onToggleSelect: (id: string) => void;
  onOpenAiEditor: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
};

export const KioskAlbumCard = memo(function KioskAlbumCard({
  image,
  frameUrl,
  isSelected,
  quantity,
  onToggleSelect,
  onOpenAiEditor,
  onQuantityChange,
}: KioskAlbumCardProps) {
  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        isSelected ? 'border-[#c9982f] shadow-md' : 'border-[#f0f0f0]'
      }`}
    >
      <div className={`relative ${KIOSK_FRAME_ASPECT_CLASS} w-full overflow-hidden rounded-[10px]`}>
        <KioskFramedImage
          photoUrl={image.photoUrl}
          frameUrl={frameUrl}
          alt={image.filename}
          photoTransform={image.photoTransform}
          photoFit="contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute right-3 top-3 flex gap-2">
          <Button
            type="button"
            onClick={() => onOpenAiEditor(image.id)}
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-r from-[#c9982f] to-[#b8872a] text-white shadow-lg hover:from-[#b8872a] hover:to-[#a77824]"
          >
            <Wand2 className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            onClick={() => onToggleSelect(image.id)}
            size="icon"
            className={`h-10 w-10 rounded-full shadow-lg ${
              isSelected
                ? 'bg-gradient-to-r from-[#c9982f] to-[#b8872a] text-white'
                : 'bg-white/95 text-[#1f1b16] hover:bg-white'
            }`}
          >
            {isSelected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>

        <AnimatePresence>
          {isSelected ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-auto absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-[#f0f0f0] bg-white/95 p-3 shadow-lg backdrop-blur-sm"
            >
              <span className="font-nunito text-sm font-medium text-[#1f1b16]">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => onQuantityChange(image.id, Math.max(quantity - 1, 1))}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-[#e0e0e0] hover:border-[#c9982f] hover:bg-[#f9f9f7]"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[30px] text-center font-jakarta font-bold text-[#1f1b16]">
                  {quantity}
                </span>
                <Button
                  type="button"
                  onClick={() => onQuantityChange(image.id, Math.min(quantity + 1, 10))}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-[#e0e0e0] hover:border-[#c9982f] hover:bg-[#f9f9f7]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
});
