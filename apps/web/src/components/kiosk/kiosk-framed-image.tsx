'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

/** Catalog frame assets are 2400×1800 (4:3). Keep display ratio in sync to avoid distortion. */
export const KIOSK_FRAME_ASPECT_CLASS = 'aspect-[4/3]';

export type PhotoTransform = {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

type KioskFramedImageProps = {
  photoUrl: string;
  frameUrl: string | null;
  alt: string;
  className?: string;
  photoTransform?: PhotoTransform;
};

export const KioskFramedImage = memo(function KioskFramedImage({
  photoUrl,
  frameUrl,
  alt,
  className,
  photoTransform = DEFAULT_PHOTO_TRANSFORM,
}: KioskFramedImageProps) {
  const { scale, rotation, offsetX, offsetY } = photoTransform;

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#f5f5f5]', className)}>
      <img
        src={photoUrl}
        alt={alt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
        loading="lazy"
        decoding="async"
      />
      {frameUrl ? (
        <img
          src={frameUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </div>
  );
});
