import Link from 'next/link';
import { Camera, Users, Aperture } from 'lucide-react';
import { HomeHero } from '@/components/home-hero';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <HomeHero />

        <div className="grid md:grid-cols-3 gap-8">
          <Link
            href="/kiosk/login"
            className="group bg-white rounded-xl shadow-sm p-10 hover:shadow-md transition-all border border-[--color-border] hover:border-[--color-gold]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[--color-gold] rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold text-[--color-text-primary] mb-3">
                Customer Kiosk
              </h2>
              <p className="font-nunito text-[--color-text-secondary] leading-relaxed">
                Find your photos and create memorable prints
              </p>
            </div>
          </Link>

          <Link
            href="/photographer/login"
            className="group bg-white rounded-xl shadow-sm p-10 hover:shadow-md transition-all border border-[--color-border] hover:border-[--color-gold]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[--color-gold-tint] rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Aperture className="w-10 h-10 text-[--color-gold]" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold text-[--color-text-primary] mb-3">
                Photographer
              </h2>
              <p className="font-nunito text-[--color-text-secondary] leading-relaxed">
                Capture and upload customer photos
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="group bg-white rounded-xl shadow-sm p-10 hover:shadow-md transition-all border border-[--color-border] hover:border-[--color-gold]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[--color-chocolate-tint] rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Users className="w-10 h-10 text-[--color-chocolate]" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold text-[--color-text-primary] mb-3">
                Admin Dashboard
              </h2>
              <p className="font-nunito text-[--color-text-secondary] leading-relaxed">
                Manage orders, products, and kiosk operations
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
