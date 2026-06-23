import Link from 'next/link';
import { Camera, Users, Aperture } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-16">
          <div className="mb-6">
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto"
            >
              <circle cx="50" cy="50" r="48" fill="#1f1b16" />
              <circle cx="50" cy="50" r="40" fill="#d4af37" />
              <circle cx="50" cy="50" r="32" fill="#1f1b16" />
              <path
                d="M35 45 Q50 35 65 45"
                stroke="#d4af37"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="42" cy="48" r="3" fill="#d4af37" />
              <circle cx="58" cy="48" r="3" fill="#d4af37" />
              <path
                d="M40 60 Q50 68 60 60"
                stroke="#d4af37"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="font-jakarta text-5xl md:text-6xl font-bold text-[#1f1b16] mb-3">
            Face Craft Studio
          </h1>
          <p className="font-nunito text-xl text-[#9a9286]">
            Where Technology Meets Tradition
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Link
            href="/kiosk/login"
            className="group bg-white rounded-2xl shadow-lg p-10 hover:shadow-2xl transition-all border border-[#e5e1d7] hover:border-[#d4af37]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#d4af37] to-[#c49d2f] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-3">
                Customer Kiosk
              </h2>
              <p className="font-nunito text-[#9a9286] leading-relaxed">
                Find your photos and create memorable prints
              </p>
            </div>
          </Link>

          <Link
            href="/photographer/login"
            className="group bg-white rounded-2xl shadow-lg p-10 hover:shadow-2xl transition-all border border-[#e5e1d7] hover:border-[#ff9d7e]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#ff9d7e] to-[#f5826b] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Aperture className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-3">
                Photographer
              </h2>
              <p className="font-nunito text-[#9a9286] leading-relaxed">
                Capture and upload customer photos to cloud
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="group bg-white rounded-2xl shadow-lg p-10 hover:shadow-2xl transition-all border border-[#e5e1d7] hover:border-[#6fcf97]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#6fcf97] to-[#56b881] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-3">
                Admin Dashboard
              </h2>
              <p className="font-nunito text-[#9a9286] leading-relaxed">
                Manage orders, products, and kiosk operations
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="font-nunito text-sm text-[#9a9286]">
            Professional Photo Kiosk System • Powered by Face Recognition
          </p>
        </div>
      </div>
    </div>
  );
}
