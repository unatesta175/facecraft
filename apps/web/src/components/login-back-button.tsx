import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginBackButtonProps {
  className?: string;
}

export function LoginBackButton({ className }: LoginBackButtonProps) {
  return (
    <Link
      href="/"
      className={cn(
        'fixed top-6 left-6 z-10 inline-flex items-center gap-2 rounded-lg px-3 py-2 font-nunito text-sm text-[#9a9286] hover:text-[#1f1b16] hover:bg-black/5 transition-colors',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Link>
  );
}
