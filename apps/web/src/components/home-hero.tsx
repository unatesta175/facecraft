'use client';

import { BrandLogo } from '@/components/brand-logo';

export function HomeHero() {
  return (
    <div className="mb-16 flex justify-center">
      <BrandLogo
        centered
        className="justify-center w-full"
        imageClassName="h-48 w-auto max-w-[min(100%,480px)] object-contain mx-auto md:h-56 md:max-w-[540px]"
      />
    </div>
  );
}
