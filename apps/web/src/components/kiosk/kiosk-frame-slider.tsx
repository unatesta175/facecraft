'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KIOSK_FRAME_ASPECT_CLASS } from '@/components/kiosk/kiosk-framed-image';
import type { KioskFrame } from '@/lib/kiosk-api';
import { cn } from '@/lib/utils';

const FRAMES_PER_VIEW = 3;

type KioskFrameSliderProps = {
  frames: KioskFrame[];
  selectedFrameId: string | null;
  onSelect: (frame: KioskFrame) => void;
};

export function KioskFrameSlider({
  frames,
  selectedFrameId,
  onSelect,
}: KioskFrameSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const pages = useMemo(() => {
    const chunks: KioskFrame[][] = [];
    for (let i = 0; i < frames.length; i += FRAMES_PER_VIEW) {
      chunks.push(frames.slice(i, i + FRAMES_PER_VIEW));
    }
    return chunks;
  }, [frames]);

  const pageCount = pages.length;
  const canGoPrev = page > 0;
  const canGoNext = page < pageCount - 1;

  const syncPageFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const nextPage = Math.round(el.scrollLeft / el.clientWidth);
    setPage(Math.min(Math.max(nextPage, 0), pageCount - 1));
  }, [pageCount]);

  const goToPage = useCallback(
    (targetPage: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = Math.min(Math.max(targetPage, 0), pageCount - 1);
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
      setPage(clamped);
    },
    [pageCount]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => syncPageFromScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [syncPageFromScroll]);

  useEffect(() => {
    if (pageCount === 0) return;
    if (page > pageCount - 1) {
      setPage(pageCount - 1);
    }
  }, [page, pageCount]);

  if (frames.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {pageCount > 1 ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
        </>
      ) : null}

      {pageCount > 1 ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canGoPrev}
          onClick={() => goToPage(page - 1)}
          className="absolute left-0 top-[calc(50%-1rem)] z-20 h-9 w-9 -translate-y-1/2 rounded-full border-[--color-border] bg-white/95 shadow-md backdrop-blur-sm hover:bg-white disabled:opacity-30"
          aria-label="Previous frames"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : null}

      {pageCount > 1 ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canGoNext}
          onClick={() => goToPage(page + 1)}
          className="absolute right-0 top-[calc(50%-1rem)] z-20 h-9 w-9 -translate-y-1/2 rounded-full border-[--color-border] bg-white/95 shadow-md backdrop-blur-sm hover:bg-white disabled:opacity-30"
          aria-label="Next frames"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : null}

      <div
        ref={scrollRef}
        className={cn(
          'flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-hide touch-pan-x',
          pageCount > 1 ? 'px-10' : 'px-0'
        )}
      >
        {pages.map((pageFrames, pageIndex) => (
          <div
            key={`frame-page-${pageIndex}`}
            className="w-full shrink-0 snap-start snap-always"
          >
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: FRAMES_PER_VIEW }).map((_, slotIndex) => {
                const frame = pageFrames[slotIndex];
                if (!frame) {
                  return <div key={`empty-${pageIndex}-${slotIndex}`} className="min-w-0" />;
                }

                const isSelected = selectedFrameId === frame.id;

                return (
                  <motion.button
                    key={frame.id}
                    type="button"
                    aria-label={`Select frame ${frame.name}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(frame)}
                    whileTap={{ scale: 0.98 }}
                    className="min-w-0 text-left"
                  >
                    <div
                      className={cn(
                        `relative ${KIOSK_FRAME_ASPECT_CLASS} w-full overflow-hidden rounded-xl border-2 bg-[--color-surface-muted] shadow-sm transition-all`,
                        isSelected
                          ? 'border-[--color-gold] ring-2 ring-[--color-gold]/25 shadow-md'
                          : 'border-[--color-border] hover:border-[--color-gold]/40'
                      )}
                    >
                      {frame.imageUrl ? (
                        <img
                          src={frame.imageUrl}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageOff className="h-8 w-8 text-[--color-text-secondary]" />
                        </div>
                      )}
                      {isSelected ? (
                        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[--color-gold] shadow-md">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : null}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {pages.map((_, index) => (
            <button
              key={`frame-dot-${index}`}
              type="button"
              aria-label={`Go to frame page ${index + 1}`}
              onClick={() => goToPage(index)}
              className={cn(
                'rounded-full transition-all duration-300',
                index === page
                  ? 'h-2 w-4 bg-[--color-gold]'
                  : 'h-2 w-2 bg-[--color-border] hover:bg-[--color-gold]/50'
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
