'use client';

import { useState } from 'react';
import { ImageOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminImageThumbProps = {
  src?: string | null;
  alt?: string;
  fallback: LucideIcon;
  className?: string;
};

export function AdminImageThumb({ src, alt = '', fallback: FallbackIcon, className }: AdminImageThumbProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        'w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-[--color-surface-muted] border border-[--color-border]',
        className
      )}
    >
      {showImage ? (
        <img src={src!} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <FallbackIcon className="h-4 w-4 text-[--color-text-secondary]" />
      )}
    </div>
  );
}

type AdminImagePreviewProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

export function AdminImagePreview({ src, alt = '', className }: AdminImagePreviewProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div className="flex items-center justify-center h-48 bg-[--color-surface-muted] rounded-lg border border-[--color-border]">
        <ImageOff className="h-8 w-8 text-[--color-text-secondary]" />
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={alt}
      className={cn('max-h-64 w-full rounded-lg border border-[--color-border] object-contain bg-[--color-surface-muted]', className)}
      onError={() => setFailed(true)}
    />
  );
}
