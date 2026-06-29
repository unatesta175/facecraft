'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Catalog frame assets are 2400×1800 (4:3). Keep display ratio in sync to avoid distortion. */
export const KIOSK_FRAME_ASPECT_CLASS = 'aspect-[4/3]';

export type PhotoTransform = {
  scale: number;
  rotation: number;
  /** Pan offset as a fraction of viewport width (stable across container sizes). */
  offsetXRatio: number;
  /** Pan offset as a fraction of viewport height (stable across container sizes). */
  offsetYRatio: number;
};

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  scale: 1,
  rotation: 0,
  offsetXRatio: 0,
  offsetYRatio: 0,
};

type LegacyPhotoTransform = Partial<PhotoTransform> & {
  offsetX?: number;
  offsetY?: number;
};

export function normalizePhotoTransform(value?: LegacyPhotoTransform | null): PhotoTransform {
  if (!value) {
    return { ...DEFAULT_PHOTO_TRANSFORM };
  }

  if (typeof value.offsetXRatio === 'number' && typeof value.offsetYRatio === 'number') {
    return {
      scale: value.scale ?? 1,
      rotation: value.rotation ?? 0,
      offsetXRatio: value.offsetXRatio,
      offsetYRatio: value.offsetYRatio,
    };
  }

  return {
    scale: value.scale ?? 1,
    rotation: value.rotation ?? 0,
    offsetXRatio: 0,
    offsetYRatio: 0,
  };
}

export function pixelTransformToNormalized(
  transform: { scale: number; rotation: number; offsetX: number; offsetY: number },
  viewportWidth: number,
  viewportHeight: number
): PhotoTransform {
  const width = Math.max(viewportWidth, 1);
  const height = Math.max(viewportHeight, 1);

  return {
    scale: transform.scale,
    rotation: transform.rotation,
    offsetXRatio: transform.offsetX / width,
    offsetYRatio: transform.offsetY / height,
  };
}

type KioskFramedImageProps = {
  photoUrl: string;
  frameUrl: string | null;
  alt: string;
  className?: string;
  photoTransform?: PhotoTransform | LegacyPhotoTransform | null;
  /** cover fills the frame window (may crop); contain shows the full photo. */
  photoFit?: 'cover' | 'contain';
};

export const KioskFramedImage = memo(function KioskFramedImage({
  photoUrl,
  frameUrl,
  alt,
  className,
  photoTransform,
  photoFit = 'cover',
}: KioskFramedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const transform = normalizePhotoTransform(photoTransform);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const offsetX = transform.offsetXRatio * viewport.width;
  const offsetY = transform.offsetYRatio * viewport.height;
  const transformStyle = {
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
    transformOrigin: 'center center',
  } as const;

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full overflow-hidden bg-[#f5f5f5]', className)}
    >
      {photoFit === 'contain' ? (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <img
            src={photoUrl}
            alt={alt}
            draggable={false}
            className="max-h-full max-w-full will-change-transform"
            style={transformStyle}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <img
          src={photoUrl}
          alt={alt}
          draggable={false}
          className="absolute inset-0 z-0 h-full w-full object-cover will-change-transform"
          style={transformStyle}
          loading="lazy"
          decoding="async"
        />
      )}
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
