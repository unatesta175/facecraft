'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { AdminBrandLogo } from '@/components/admin-brand-logo';
import { cn } from '@/lib/utils';

interface PhotographerHeaderProps {
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function PhotographerHeader({ backHref, actions, className }: PhotographerHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 border-b border-[--color-border-subtle] bg-white shadow-sm',
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'flex-shrink-0 rounded-lg hover:bg-[--color-surface-muted]'
              )}
            >
              <ArrowLeft className="h-5 w-5 text-[--color-text-primary]" />
            </Link>
          ) : null}
          <Link href="/photographer" className="flex-shrink-0">
            <AdminBrandLogo imageClassName="h-10 max-w-[200px]" />
          </Link>
        </div>
        {actions ? <div className="flex flex-shrink-0 items-center gap-3 md:gap-6">{actions}</div> : null}
      </div>
    </header>
  );
}
