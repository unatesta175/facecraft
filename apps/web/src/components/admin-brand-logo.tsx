'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { getBrandAdminLogoUrl } from '@/lib/brand-assets';
import { cn } from '@/lib/utils';

interface AdminBrandLogoProps {
  className?: string;
  imageClassName?: string;
}

/** Horizontal logo for admin sidebar and photographer topbar only. */
export function AdminBrandLogo({ className, imageClassName }: AdminBrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const adminLogoUrl = getBrandAdminLogoUrl();

  if (failed) {
    return (
      <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
        <div className="w-8 h-8 bg-[--color-gold] rounded-lg flex items-center justify-center flex-shrink-0">
          <Camera className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[--color-text-primary] leading-tight">FACE CRAFT STUDIO</p>
          <p className="text-[10px] text-[--color-text-secondary] leading-tight truncate">
            WHERE TECHNOLOGY MEETS TRADITION
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={adminLogoUrl}
      alt="Face Craft Studio"
      className={cn('h-12 w-auto max-w-[220px] object-contain object-left', imageClassName)}
      onError={() => setFailed(true)}
    />
  );
}
