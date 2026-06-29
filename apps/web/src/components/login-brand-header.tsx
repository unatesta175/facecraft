'use client';

import { BrandLogo } from '@/components/brand-logo';

export function LoginBrandHeader() {
  return (
    <div className="mb-8 flex flex-col items-center">
      <BrandLogo
        centered
        className="justify-center w-full"
        imageClassName="h-44 w-auto max-w-[min(100%,420px)] object-contain mx-auto md:h-48 md:max-w-[460px]"
      />
    </div>
  );
}
