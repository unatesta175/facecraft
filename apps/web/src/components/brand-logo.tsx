'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/brand-assets';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  centered?: boolean;
}

export function BrandLogo({ className, imageClassName, centered = false }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const brandLogoUrl = getBrandLogoUrl();

  if (failed) {
    return (
      <div
        className={cn(
          'flex min-w-0 gap-2.5',
          centered ? 'flex-col items-center text-center' : 'items-center',
          className
        )}
      >
        <div className="w-10 h-10 bg-[--color-gold] rounded-lg flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div className={cn('min-w-0', centered && 'flex flex-col items-center')}>
          <p className="text-sm font-bold text-[--color-text-primary] leading-tight">FACE CRAFT STUDIO</p>
          <p className="text-xs text-[--color-text-secondary] leading-tight">
            WHERE TECHNOLOGY MEETS TRADITION
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={brandLogoUrl}
      alt="Face Craft Studio"
      className={cn('h-14 w-auto max-w-[220px] object-contain object-left', imageClassName)}
      onError={() => setFailed(true)}
    />
  );
}
