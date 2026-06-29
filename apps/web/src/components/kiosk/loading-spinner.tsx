'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { getBrandSpinnerUrl } from '@/lib/brand-assets';

export function LoadingSpinner({ message }: { message?: string }) {
  const reduceMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const spinnerUrl = getBrandSpinnerUrl();
  const statusMessage = message ?? 'Loading...';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={statusMessage}
    >
      <div className="flex flex-col items-center gap-6 px-6">
        {!imgFailed ? (
          <motion.img
            src={spinnerUrl}
            alt=""
            className="h-24 w-24 object-contain select-none md:h-28 md:w-28"
            onError={() => setImgFailed(true)}
            draggable={false}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 1.4, repeat: Infinity, ease: 'linear' }
            }
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-[--color-gold-tint] border border-[--color-gold]/30 md:h-28 md:w-28" />
        )}

        {message ? (
          <p className="max-w-xs text-center font-nunito text-sm text-[--color-text-secondary]">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
