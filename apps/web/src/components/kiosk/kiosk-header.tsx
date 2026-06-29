'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { cn } from '@/lib/utils';

type KioskHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  showLogo?: boolean;
  logoImageClassName?: string;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function KioskHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  showLogo = false,
  logoImageClassName,
  rightSlot,
  className,
}: KioskHeaderProps) {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-[--color-border] bg-white px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onBack ? (
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="h-10 shrink-0 rounded-xl px-2 text-[--color-text-secondary] hover:bg-[--color-surface-muted] hover:text-[--color-text-primary]"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel !== '' ? (
              <span className="ml-1 font-nunito text-sm">{backLabel ?? 'Back'}</span>
            ) : null}
          </Button>
        ) : (
          <div className="w-16 shrink-0" />
        )}

        <div className="min-w-0 flex-1 text-center">
          {showLogo ? (
            <BrandLogo
              centered
              className="justify-center"
              imageClassName={
                logoImageClassName ??
                'mx-auto h-9 max-w-[140px] object-contain'
              }
            />
          ) : title ? (
            <>
              <h1 className="truncate font-jakarta text-lg font-bold text-[--color-text-primary]">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate font-nunito text-xs text-[--color-text-secondary]">
                  {subtitle}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex w-16 shrink-0 justify-end">{rightSlot ?? null}</div>
      </div>
    </header>
  );
}
