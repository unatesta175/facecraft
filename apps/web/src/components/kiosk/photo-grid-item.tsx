'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { format } from 'date-fns';
import { KioskFramedImage, KIOSK_FRAME_ASPECT_CLASS } from '@/components/kiosk/kiosk-framed-image';

type PhotoGridItemProps = {
  id: string;
  url: string;
  capturedAt: Date;
  frameUrl: string | null;
  isSelected: boolean;
  index: number;
  onToggle: (id: string) => void;
};

function formatPhotoTime(date: Date) {
  return format(date, 'h:mm a');
}

export const PhotoGridItem = memo(function PhotoGridItem({
  id,
  url,
  capturedAt,
  frameUrl,
  isSelected,
  index,
  onToggle,
}: PhotoGridItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="group relative"
    >
      <div
        onClick={() => onToggle(id)}
        className={`relative ${KIOSK_FRAME_ASPECT_CLASS} cursor-pointer overflow-hidden rounded-2xl transition-all shadow-md hover:shadow-xl ${
          isSelected
            ? 'scale-[1.02] shadow-2xl ring-4 ring-[#c9982f]'
            : 'ring-1 ring-[#f0f0f0] hover:ring-2 hover:ring-[#e0e0e0]'
        }`}
      >
        <KioskFramedImage photoUrl={url} frameUrl={frameUrl} alt={`Photo ${id}`} />

        <div className="absolute right-4 top-4 z-20">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all ${
              isSelected
                ? 'scale-110 bg-gradient-to-br from-[#c9982f] to-[#b8872a]'
                : 'bg-white/95 backdrop-blur-sm'
            }`}
          >
            {isSelected ? <Check className="h-6 w-6 text-white" /> : null}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          <p className="font-nunito text-sm text-white">
            {format(capturedAt, 'MMM d, yyyy')} • {formatPhotoTime(capturedAt)}
          </p>
        </div>

        <div className="absolute inset-0 z-[1] bg-black/0 transition-colors group-hover:bg-black/5" />
      </div>
    </motion.div>
  );
});
