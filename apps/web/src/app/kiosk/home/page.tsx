'use client';

import { motion } from 'framer-motion';
import { Camera, Image, LogOut, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { KioskHeader } from '@/components/kiosk/kiosk-header';
import { KioskShell } from '@/components/kiosk/kiosk-shell';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { useRouter } from 'next/navigation';
import { getKioskHomeVideoUrl } from '@/lib/kiosk-assets';
import { kioskBtnPrimary, kioskCard } from '@/lib/kiosk-ui';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: Camera, title: 'Selfie', description: 'Capture your face' },
  { icon: Image, title: 'Browse', description: 'Find your photos' },
  { icon: ShoppingBag, title: 'Checkout', description: 'Order prints' },
] as const;

/** Matches footer `px-4` + full-width button column */
const CONTENT_WIDTH = 'w-full';

export default function KioskHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoUrl = getKioskHomeVideoUrl();

  const handleTakeSelfie = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = '/kiosk/capture';
    }, 800);
  };

  if (isLoading) {
    return <LoadingSpinner message="Opening camera..." />;
  }

  return (
    <KioskShell fixed className="bg-white">
      <KioskHeader
        showLogo
        logoImageClassName="mx-auto h-16 w-auto max-w-[min(100%,280px)] object-contain"
        className="py-4"
        onBack={() => router.push('/kiosk/login')}
        backLabel=""
        rightSlot={
          <Button
            onClick={() => router.push('/kiosk/login')}
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-[--color-border]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.2fr)_auto_auto]">
        <section className="flex min-h-0 px-4 pb-2 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative h-full ${CONTENT_WIDTH} overflow-hidden rounded-2xl border border-[--color-border] bg-[#1f1b16] shadow-md`}
          >
            {!videoFailed ? (
              <video
                key={videoUrl}
                src={videoUrl}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onError={() => setVideoFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1f1b16] px-6">
                <BrandLogo
                  centered
                  imageClassName="mx-auto h-full max-h-40 w-auto max-w-[260px] object-contain"
                />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-black/35 pointer-events-none" />
            <div className="absolute bottom-3 left-3">
              <Badge
                variant="secondary"
                className="border-0 bg-white/90 px-2.5 py-0.5 text-xs font-semibold shadow-sm"
              >
                Photo Kiosk
              </Badge>
            </div>
          </motion.div>
        </section>

        <section className="min-h-0 space-y-2 px-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`${kioskCard} ${CONTENT_WIDTH} p-4`}
          >
            <div className="space-y-1 text-center">
              <h1 className="font-jakarta text-xl font-bold text-[--color-text-primary]">
                Welcome to Face Craft Studio
              </h1>
              <p className="font-nunito text-sm text-[--color-text-secondary]">
                Purchase your memories in three simple steps
              </p>
            </div>
          </motion.div>
          <div className={`grid ${CONTENT_WIDTH} grid-cols-3 gap-2`}>
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  className={cn(
                    'flex flex-col items-center rounded-lg border border-[--color-border-subtle] bg-[--color-surface-muted] px-1 py-2 text-center',
                    index === 0 && 'border-[--color-gold]/30 bg-[--color-gold-tint]/50'
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 flex h-8 w-8 items-center justify-center rounded-md',
                      index === 0
                        ? 'bg-[--color-gold] text-white'
                        : 'bg-white text-[--color-gold] ring-1 ring-[--color-border]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="font-jakarta text-[11px] font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 font-nunito text-[9px] leading-tight text-[--color-text-secondary]">
                    {description}
                  </p>
                </div>
              ))}
          </div>
        </section>

        <footer className="shrink-0 space-y-2 border-t border-[--color-border] bg-white px-4 py-4 safe-area-bottom">
          <Button
            onClick={handleTakeSelfie}
            size="lg"
            className={`h-14 ${CONTENT_WIDTH} rounded-2xl text-base ${kioskBtnPrimary}`}
          >
            <Camera className="mr-2 h-5 w-5" />
            Take Selfie
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/kiosk/login')}
            className={`h-11 ${CONTENT_WIDTH} rounded-xl border-[--color-border] font-nunito text-xs`}
          >
            <LogOut className="mr-1.5 h-4 w-4 text-[--color-gold]" />
            End session
          </Button>
        </footer>
      </div>
    </KioskShell>
  );
}
