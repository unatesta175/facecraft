'use client';

import { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function KioskHomePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTakeSelfie = () => {
    setIsLoading(true);
    // Navigate to selfie capture
    window.location.href = '/kiosk/search';
  };

  const handleManualSearch = () => {
    window.location.href = '/kiosk/search?manual=true';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-7xl font-bold text-gray-900 mb-4"
          >
            Welcome to <span className="text-orange-500">FaceCraft</span> Studio
          </motion.h1>
          <p className="text-2xl text-gray-600 mb-2">
            Purchase your memories by clicking a selfie
          </p>
          <p className="text-xl text-gray-500">
            Please take a selfie to begin
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={handleTakeSelfie}
              disabled={isLoading}
              className="w-full bg-white rounded-3xl shadow-2xl p-12 hover:shadow-3xl transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10">
                <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-orange-200 transition-colors">
                  <Camera className="w-16 h-16 text-orange-500" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Take a Selfie
                </h2>
                <p className="text-lg text-gray-600">
                  Find your photos instantly using facial recognition
                </p>
              </div>
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={handleManualSearch}
              className="w-full bg-white rounded-3xl shadow-2xl p-12 hover:shadow-3xl transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10">
                <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-yellow-200 transition-colors">
                  <Search className="w-16 h-16 text-yellow-600" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Manual Search
                </h2>
                <p className="text-lg text-gray-600">
                  Browse photos by date, time, or event
                </p>
              </div>
            </button>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Your photos are stored securely and will be available for 7 days
          </p>
        </div>
      </motion.div>
    </div>
  );
}
