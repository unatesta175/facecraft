import Link from 'next/link';
import { Camera, Users, ShoppingBag } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Face<span className="text-orange-500">Craft</span>
          </h1>
          <p className="text-xl text-gray-600">
            Professional Photo Kiosk System
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Link
            href="/kiosk"
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                <Camera className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Customer Kiosk
              </h2>
              <p className="text-gray-600">
                Find your photos and create memorable prints
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-yellow-200 transition-colors">
                <Users className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Management Portal
              </h2>
              <p className="text-gray-600">
                Admin and photographer access
              </p>
            </div>
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Features
              </h2>
              <ul className="text-left text-gray-600 space-y-2">
                <li>✓ Face Recognition Search</li>
                <li>✓ Photo Editing & Frames</li>
                <li>✓ Multiple Print Products</li>
                <li>✓ Package Deals</li>
                <li>✓ Secure Payments</li>
                <li>✓ Digital Gallery Access</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 text-gray-500">
          <p>Powered by AWS Rekognition & Next.js</p>
        </div>
      </div>
    </div>
  );
}
