import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FaceCraft Kiosk',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[100dvh] overflow-hidden bg-white">{children}</div>;
}
