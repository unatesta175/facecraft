'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';
import { motion } from 'framer-motion';

export default function KioskSearchPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    eventId: '',
  });

  useEffect(() => {
    loadPhotos();
  }, [filters]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/v1/photos/search', filters);
      if (response.data) {
        setPhotos(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhoto = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleNext = () => {
    if (selectedPhotos.size > 0) {
      const selectedIds = Array.from(selectedPhotos).join(',');
      window.location.href = `/kiosk/shop?photos=${selectedIds}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Select Your Photos
          </h1>
          <p className="text-xl text-gray-600">
            {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
          </p>
        </div>

        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                From Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                To Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading photos...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => togglePhoto(photo.id)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
                    selectedPhotos.has(photo.id)
                      ? 'ring-4 ring-orange-500 shadow-2xl scale-105'
                      : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="aspect-[4/3] bg-gray-200">
                    {photo.thumbnailUrl && (
                      <img
                        src={photo.thumbnailUrl}
                        alt="Photo"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {selectedPhotos.has(photo.id) && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {photos.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No photos found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}

        {selectedPhotos.size > 0 && (
          <div className="fixed bottom-8 right-8">
            <Button
              size="xl"
              onClick={handleNext}
              className="shadow-2xl hover:shadow-3xl"
            >
              Continue with {selectedPhotos.size} photo
              {selectedPhotos.size !== 1 ? 's' : ''} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
