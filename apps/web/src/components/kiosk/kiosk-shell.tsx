'use client';

import { cn } from '@/lib/utils';

type KioskShellProps = {
  children: React.ReactNode;
  /** Lock to one viewport height (login, home). */
  fixed?: boolean;
  className?: string;
};

export function KioskShell({ children, fixed = false, className }: KioskShellProps) {
  return (
    <div
      className={cn(
        'kiosk-shell bg-[--color-surface-muted] text-[--color-text-primary]',
        fixed ? 'kiosk-shell--fixed' : 'kiosk-shell--scrollable',
        className
      )}
    >
      {children}
    </div>
  );
}

type KioskPageProps = {
  children: React.ReactNode;
  className?: string;
};

/** Scrollable content area with header/footer siblings in a fixed shell. */
export function KioskPageBody({ children, className }: KioskPageProps) {
  return (
    <div className={cn('kiosk-page-body flex min-h-0 flex-1 flex-col bg-white', className)}>
      {children}
    </div>
  );
}

/** Internally scrollable region (photo grid, shop list, cart). */
export function KioskScrollArea({
  children,
  className,
  onScroll,
}: KioskPageProps & { onScroll?: React.UIEventHandler<HTMLDivElement> }) {
  return (
    <div
      onScroll={onScroll}
      className={cn('kiosk-scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain', className)}
    >
      {children}
    </div>
  );
}

/** Sticky bottom action bar. */
export function KioskStickyFooter({ children, className }: KioskPageProps) {
  return (
    <footer
      className={cn(
        'shrink-0 border-t border-[--color-border] bg-white px-4 py-4 safe-area-bottom',
        className
      )}
    >
      {children}
    </footer>
  );
}
