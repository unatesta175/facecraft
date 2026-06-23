'use client';

import { motion } from 'framer-motion';
import { Camera, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { useRouter } from 'next/navigation';

export default function KioskHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTakeSelfie = () => {
    setIsLoading(true);
    // Simulate loading, then navigate to webcam modal
    setTimeout(() => {
      window.location.href = '/kiosk/capture';
    }, 1000);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => router.push('/kiosk/login')}
            variant="ghost"
            className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-[#f5f5f5] rounded-xl transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </motion.div>
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-block mb-8">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              <circle
                cx="60"
                cy="60"
                r="55"
                stroke="#c9982f"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8 4"
              />
              <circle cx="40" cy="45" r="6" fill="#5c3a21" opacity="0.6" />
              <circle cx="80" cy="45" r="6" fill="#5c3a21" opacity="0.6" />
              <circle cx="60" cy="60" r="35" stroke="#1f1b16" strokeWidth="2.5" fill="none" />
              <path
                d="M 45 55 Q 50 50 55 55"
                stroke="#1f1b16"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 65 55 Q 70 50 75 55"
                stroke="#1f1b16"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 48 72 Q 60 80 72 72"
                stroke="#c9982f"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="font-jakarta text-4xl md:text-5xl lg:text-6xl font-bold text-[#1f1b16] tracking-tight mb-3">
              Face Craft Studio
            </h1>
            <p className="font-nunito text-base md:text-lg text-[#9a9286] tracking-wide uppercase">
              Where Technology Meets Tradition
            </p>
          </motion.div>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 md:p-12 lg:p-16 shadow-lg border border-[#f0f0f0]"
        >
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="font-jakarta text-3xl md:text-4xl lg:text-5xl font-bold text-[#1f1b16] leading-tight">
                Purchase Your Memories<br />
                <span className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] bg-clip-text text-transparent">
                  By Taking a Selfie
                </span>
              </h2>
              
              <p className="font-nunito text-lg md:text-xl text-[#6b6b6b] max-w-2xl mx-auto leading-relaxed">
                Start your photo journey in seconds. Simply take a selfie and browse your beautiful moments.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="pt-6"
            >
              <Button
                onClick={handleTakeSelfie}
                size="lg"
                className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-lg md:text-xl px-10 md:px-14 py-7 md:py-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Camera className="mr-3 h-6 w-6 md:h-7 md:w-7" />
                Take a Selfie
              </Button>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#f0f0f0]"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-[#fbf3df] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Camera className="h-6 w-6 text-[#c9982f]" />
                </div>
                <h3 className="font-jakarta font-semibold text-[#1f1b16] mb-1">Quick Capture</h3>
                <p className="font-nunito text-sm text-[#9a9286]">Instant photo recognition</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#eef3e3] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-[#436b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-jakarta font-semibold text-[#1f1b16] mb-1">Browse Photos</h3>
                <p className="font-nunito text-sm text-[#9a9286]">Find your moments</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#f3e8f7] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-[#9b87f5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-jakarta font-semibold text-[#1f1b16] mb-1">Easy Purchase</h3>
                <p className="font-nunito text-sm text-[#9a9286]">Multiple payment options</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="font-nunito text-sm text-[#b0b0b0]">
            Tap the button above to begin
          </p>
        </motion.div>
      </div>
    </div>
  );
}
