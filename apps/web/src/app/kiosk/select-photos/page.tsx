'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { PreviewModal } from '@/components/kiosk/preview-modal';
import { useRouter } from 'next/navigation';

// Mock data for frames
const FRAMES = [
  { id: 'rainbow', name: 'Rainbow Stairs', image: '/frames/rainbow.png', color: '#c9982f' },
  { id: 'classic', name: 'Classic Border', image: '/frames/classic.png', color: '#5c3a21' },
  { id: 'modern', name: 'Modern Minimal', image: '/frames/modern.png', color: '#1f1b16' },
  { id: 'vintage', name: 'Vintage Gold', image: '/frames/vintage.png', color: '#c9982f' },
  { id: 'nature', name: 'Nature Frame', image: '/frames/nature.png', color: '#436b35' },
];

// Mock photo data
const generateMockPhotos = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${i + 1}`,
    url: `https://picsum.photos/seed/${i + 100}/600/800`,
    date: new Date(2026, 5, Math.floor(Math.random() * 23) + 1),
    time: `${Math.floor(Math.random() * 12) + 9}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
  }));
};

export default function SelectPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState(generateMockPhotos(20));
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Infinite scroll
  const loadMore = useCallback(() => {
    const newPhotos = generateMockPhotos(10);
    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (selectedPhotos.size === 0) {
      alert('Please select at least one photo');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleApplyPreview = () => {
    setShowPreviewModal(false);
    setIsLoading(true);
    setTimeout(() => {
      router.push('/kiosk/shop');
    }, 800);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredPhotos = photos.filter(photo => {
    if (dateFilter && !photo.date.toLocaleDateString().includes(dateFilter)) {
      return false;
    }
    if (timeFilter && !photo.time.toLowerCase().includes(timeFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f9f9f7] pb-24">
      {/* Back Button */}
      <div className="bg-[#fafafa] border-b border-[#f0f0f0] px-4 md:px-8 py-4">
          <Button
            onClick={() => router.push('/kiosk/capture')}
            variant="ghost"
            className="text-[#6b6b6b] hover:text-[#1f1b16] hover:bg-[#f5f5f5] rounded-xl transition-colors"
          >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Capture
        </Button>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#fafafa] border-b border-[#f0f0f0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-jakarta text-2xl md:text-3xl font-bold text-[#1f1b16] mb-6">
              Select Your Photos
            </h2>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9a9286]" />
                <Input
                  type="text"
                  placeholder="Filter by date..."
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 bg-[#fafafa] border-[#f0f0f0] font-nunito h-12 rounded-xl focus:border-[#c9982f] focus:ring-[#c9982f]/20"
                />
              </div>
              <div className="flex-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9a9286]" />
                <Input
                  type="text"
                  placeholder="Filter by time..."
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="pl-10 bg-[#fafafa] border-[#f0f0f0] font-nunito h-12 rounded-xl focus:border-[#c9982f] focus:ring-[#c9982f]/20"
                />
              </div>
            </div>

            {/* Frame Selector */}
            <div className="relative">
              <p className="font-nunito text-sm text-[#6b6b6b] mb-3">
                Choose a frame style:
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {FRAMES.map((frame) => (
                  <motion.button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 px-6 py-3 rounded-xl font-jakarta font-medium transition-all shadow-sm ${
                      selectedFrame.id === frame.id
                        ? 'bg-gradient-to-r from-[#c9982f] to-[#b8872a] text-white shadow-md'
                        : 'bg-white text-[#1f1b16] border-2 border-[#f0f0f0] hover:border-[#e0e0e0]'
                    }`}
                  >
                    {frame.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div
                  onClick={() => togglePhotoSelection(photo.id)}
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all shadow-md hover:shadow-xl ${
                    selectedPhotos.has(photo.id)
                      ? 'ring-4 ring-[#c9982f] shadow-2xl scale-[1.02]'
                      : 'ring-1 ring-[#f0f0f0] hover:ring-2 hover:ring-[#e0e0e0]'
                  }`}
                >
                  {/* Photo */}
                  <img
                    src={photo.url}
                    alt={`Photo ${photo.id}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Selection Checkbox */}
                  <div className="absolute top-4 right-4 z-20">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        selectedPhotos.has(photo.id)
                          ? 'bg-gradient-to-br from-[#c9982f] to-[#b8872a] scale-110'
                          : 'bg-white/95 backdrop-blur-sm'
                      }`}
                    >
                      {selectedPhotos.has(photo.id) && (
                        <Check className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                    <p className="font-nunito text-white text-sm">
                      {photo.date.toLocaleDateString()} • {photo.time}
                    </p>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading More Indicator */}
        {filteredPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="font-nunito text-[#b0b0b0]">Scroll for more photos...</p>
          </motion.div>
        )}
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedPhotos.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#fafafa] border-t border-[#f0f0f0] shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
              <div>
                <p className="font-jakarta font-bold text-lg text-[#1f1b16]">
                  {selectedPhotos.size} {selectedPhotos.size === 1 ? 'photo' : 'photos'} selected
                </p>
                <p className="font-nunito text-sm text-[#6b6b6b]">
                  Frame: {selectedFrame.name}
                </p>
              </div>
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-gradient-to-r from-[#c9982f] to-[#b8872a] hover:from-[#b8872a] hover:to-[#a77824] text-white font-jakarta text-lg px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl"
              >
                Next
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <PreviewModal
        photos={Array.from(selectedPhotos)
          .map(id => {
            const photo = filteredPhotos.find(p => p.id === id);
            return photo ? { id, url: photo.url } : null;
          })
          .filter((photo): photo is { id: string; url: string } => photo !== null)}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onApply={handleApplyPreview}
      />
    </div>
  );
}
