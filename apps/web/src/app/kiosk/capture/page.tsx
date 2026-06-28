'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { kioskApi } from '@/lib/kiosk-api';
import { saveFaceMatchPhotos, clearFaceMatchPhotos } from '@/lib/kiosk-photo-session';

function createCaptureId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function KioskCapturePage() {
  const router = useRouter();
  const { toast } = useToast();
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Searching for your photos...');

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, []);

  const handleRetry = () => {
    setCapturedImage(null);
  };

  const handleContinue = async () => {
    if (!capturedImage) return;

    const session = kioskApi.getSession();
    if (!session) {
      toast({
        title: 'Session expired',
        description: 'Please log in again.',
        variant: 'destructive',
      });
      router.push('/kiosk/login');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Uploading selfie...');

    try {
      const captureId = createCaptureId();
      const uploadResponse = await kioskApi.getSelfieUploadUrl(session.id, captureId);
      const uploadData = uploadResponse.data;

      if (!uploadData?.uploadUrl || !uploadData.s3Key) {
        throw new Error('Unable to prepare selfie upload');
      }

      await kioskApi.uploadSelfieToS3(uploadData.uploadUrl, capturedImage);

      setProcessingMessage('Searching for your photos...');
      clearFaceMatchPhotos();

      const searchResponse = await kioskApi.searchFaces(uploadData.s3Key);
      const matches = searchResponse.data?.matches ?? [];

      saveFaceMatchPhotos(matches);

      if (matches.length === 0) {
        toast({
          title: 'No matches found',
          description: 'Try manual search or capture another selfie with better lighting.',
        });
        router.push('/kiosk/select-photos?mode=manual');
        return;
      }

      router.push('/kiosk/select-photos');
    } catch (error: any) {
      toast({
        title: 'Face search failed',
        description: error.message || 'Please try again or use manual search.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleManualSearch = () => {
    clearFaceMatchPhotos();
    router.push('/kiosk/select-photos?mode=manual');
  };

  if (isProcessing) {
    return <LoadingSpinner message={processingMessage} />;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <Button
            onClick={() => router.push('/kiosk/home')}
            variant="ghost"
            className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-[#f5f5f5] rounded-xl transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-jakarta text-3xl md:text-4xl font-bold text-[#1f1b16] mb-2">
            Capture Your Selfie
          </h2>
          <p className="font-nunito text-base md:text-lg text-[#6b6b6b]">
            Position yourself in the frame and smile!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden border border-[#f0f0f0]"
        >
          <div className="relative aspect-[4/3] bg-[#000000]">
            {!capturedImage ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{
                  width: 1920,
                  height: 1080,
                  facingMode: 'user',
                }}
              />
            ) : (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={capturedImage}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            )}

            <AnimatePresence>
              {!capturedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-64 h-64 md:w-80 md:h-80 border-4 border-[#c9982f] rounded-full opacity-20 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 md:p-8 bg-white">
            <AnimatePresence mode="wait">
              {!capturedImage ? (
                <motion.div
                  key="capture"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Button
                    onClick={capture}
                    size="lg"
                    className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-lg md:text-xl py-7 md:py-8 rounded-2xl shadow-md hover:shadow-lg transition-all"
                  >
                    <Camera className="mr-3 h-6 w-6" />
                    Capture Photo
                  </Button>

                  <Button
                    onClick={handleManualSearch}
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#e0e0e0] text-[#1f1b16] hover:text-[#1f1b16] hover:bg-[#f9f9f9] hover:border-[#c9982f] font-jakarta text-lg md:text-xl py-7 md:py-8 rounded-2xl transition-all"
                  >
                    <Search className="mr-3 h-6 w-6" />
                    Manual Search
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <p className="text-center font-nunito text-lg text-[#6b6b6b] mb-4">
                    Great shot! Continue or try again?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleRetry}
                      size="lg"
                      variant="outline"
                      className="border-2 border-[#e0e0e0] text-[#1f1b16] hover:text-[#1f1b16] hover:bg-[#f9f9f9] hover:border-[#c9982f] font-jakarta text-lg md:text-xl py-7 md:py-8 rounded-2xl transition-all"
                    >
                      <RotateCcw className="mr-3 h-6 w-6" />
                      Retry
                    </Button>

                    <Button
                      onClick={handleContinue}
                      size="lg"
                      className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-lg md:text-xl py-7 md:py-8 rounded-2xl shadow-md hover:shadow-lg transition-all"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
