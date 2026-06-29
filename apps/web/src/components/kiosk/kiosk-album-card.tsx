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
  /** Narrow column layout for kiosk shop side panel */
  compact?: boolean;
};

export const KioskAlbumCard = memo(function KioskAlbumCard({
  image,
  frameUrl,
  isSelected,
  quantity,
  onToggleSelect,
  onOpenAiEditor,
  onQuantityChange,
  compact = false,
}: KioskAlbumCardProps) {
  const actionBtnClass = compact ? 'h-8 w-8' : 'h-10 w-10';
  const actionIconClass = compact ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        isSelected ? 'border-[--color-gold] shadow-md' : 'border-[--color-border]'
      }`}
    >
      <div
        className={`relative ${KIOSK_FRAME_ASPECT_CLASS} w-full overflow-hidden rounded-[10px] bg-[--color-surface-muted]`}
      >
        <KioskFramedImage
          photoUrl={image.photoUrl}
          frameUrl={frameUrl}
          alt={image.filename}
          photoTransform={image.photoTransform}
          photoFit="contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className={`pointer-events-auto absolute flex gap-1.5 ${compact ? 'right-2 top-2' : 'right-3 top-3'}`}>
          <Button
            type="button"
            onClick={() => onOpenAiEditor(image.id)}
            size="icon"
            className={`${actionBtnClass} rounded-full bg-[--color-gold] text-white shadow-md hover:bg-[--color-gold-hover]`}
          >
            <Wand2 className={actionIconClass} />
          </Button>

          <Button
            type="button"
            onClick={() => onToggleSelect(image.id)}
            size="icon"
            className={`${actionBtnClass} rounded-full shadow-md ${
              isSelected
                ? 'bg-[--color-gold] text-white'
                : 'bg-white/95 text-[--color-text-primary] hover:bg-white'
            }`}
          >
            {isSelected ? <Check className={actionIconClass} /> : <Plus className={actionIconClass} />}
          </Button>
        </div>

        <AnimatePresence>
          {isSelected ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`pointer-events-auto absolute flex items-center justify-between rounded-lg border border-[--color-border] bg-white/95 shadow-lg backdrop-blur-sm ${
                compact ? 'bottom-2 left-2 right-2 p-2' : 'bottom-3 left-3 right-3 p-3'
              }`}
            >
              <span className={`font-nunito font-medium text-[--color-text-primary] ${compact ? 'text-xs' : 'text-sm'}`}>
                Qty
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={() => onQuantityChange(image.id, Math.max(quantity - 1, 1))}
                  size="icon"
                  variant="outline"
                  className={`border-[--color-border] hover:border-[--color-gold] ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className={`min-w-[24px] text-center font-jakarta font-bold ${compact ? 'text-sm' : 'text-base'}`}>
                  {quantity}
                </span>
                <Button
                  type="button"
                  onClick={() => onQuantityChange(image.id, Math.min(quantity + 1, 10))}
                  size="icon"
                  variant="outline"
                  className={`border-[--color-border] hover:border-[--color-gold] ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
});
