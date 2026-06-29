'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KioskHeader } from '@/components/kiosk/kiosk-header';
import { KioskPageBody, KioskShell } from '@/components/kiosk/kiosk-shell';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { kioskApi } from '@/lib/kiosk-api';
import { saveFaceMatchPhotos, clearFaceMatchPhotos } from '@/lib/kiosk-photo-session';
import { kioskBtnPrimary, kioskBtnOutline, kioskCard } from '@/lib/kiosk-ui';

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

  const handleRetry = () => setCapturedImage(null);

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
    <KioskShell fixed className="bg-white">
      <KioskHeader
        title="Capture Selfie"
        subtitle="Position yourself in the frame"
        onBack={() => router.push('/kiosk/home')}
      />

      <KioskPageBody className="px-4 py-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${kioskCard} flex min-h-0 flex-1 flex-col overflow-hidden shadow-md`}
        >
          <div className="relative min-h-0 flex-1 bg-black">
            {!capturedImage ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="absolute inset-0 h-full w-full object-cover"
                videoConstraints={{
                  width: 1080,
                  height: 1920,
                  facingMode: 'user',
                }}
              />
            ) : (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={capturedImage}
                alt="Captured selfie"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            <AnimatePresence>
              {!capturedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div className="h-48 w-48 rounded-full border-4 border-[--color-gold]/40 opacity-60" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="shrink-0 space-y-2 border-t border-[--color-border] p-4">
            <AnimatePresence mode="wait">
              {!capturedImage ? (
                <motion.div
                  key="capture"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={capture}
                    size="lg"
                    className={`h-14 w-full rounded-2xl text-base ${kioskBtnPrimary}`}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Capture Photo
                  </Button>
                  <Button
                    onClick={handleManualSearch}
                    size="lg"
                    variant="outline"
                    className={`h-12 w-full rounded-2xl ${kioskBtnOutline}`}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Manual Search
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <p className="text-center font-nunito text-sm text-[--color-text-secondary]">
                    Great shot! Continue or try again?
                  </p>
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className={`h-14 w-full rounded-2xl text-base ${kioskBtnPrimary}`}
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleRetry}
                    size="lg"
                    variant="outline"
                    className={`h-12 w-full rounded-2xl ${kioskBtnOutline}`}
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Retry
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </KioskPageBody>
    </KioskShell>
  );
}
