'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Check, X, Image as ImageIcon, LogOut, History, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
  uploaded: boolean;
  file?: File;
}

export default function PhotographerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  
  // Mock statistics - in production, fetch from API
  const [stats] = useState({
    totalLifetimeUploads: 1247,
    todayUploads: 23,
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: CapturedPhoto = {
            id: Date.now().toString() + Math.random(),
            dataUrl: event.target?.result as string,
            timestamp: new Date(),
            uploaded: false,
            file,
          };
          setPhotos(prev => [newPhoto, ...prev]);
        };
        reader.readAsDataURL(file);
      }
    });

    toast({
      title: 'Photos added',
      description: `${files.length} photo(s) added to gallery`,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  const handleUploadSelected = async () => {
    if (selectedPhotos.size === 0) {
      toast({
        title: 'No photos selected',
        description: 'Please select photos to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload to cloud
    setTimeout(() => {
      setPhotos(prev =>
        prev.map(photo =>
          selectedPhotos.has(photo.id)
            ? { ...photo, uploaded: true }
            : photo
        )
      );

      toast({
        title: 'Upload successful',
        description: `${selectedPhotos.size} photo(s) uploaded to cloud`,
      });

      setSelectedPhotos(new Set());
      setIsUploading(false);
    }, 2000);
  };

  const handleUploadAll = () => {
    const unuploadedIds = photos
      .filter(p => !p.uploaded)
      .map(p => p.id);
    setSelectedPhotos(new Set(unuploadedIds));
    
    // Trigger upload after selection
    setTimeout(() => {
      handleUploadSelected();
    }, 100);
  };

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

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
    toast({
      title: 'Photo deleted',
      description: 'Photo removed from gallery',
    });
  };

  const handleLogout = () => {
    router.push('/photographer/login');
  };

  if (isUploading) {
    return <LoadingSpinner />;
  }

  const uploadedCount = photos.filter(p => p.uploaded).length;
  const pendingCount = photos.length - uploadedCount;

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e1d7] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff9d7e] to-[#f5826b] rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-jakarta text-2xl font-bold text-[#1f1b16]">
                  Photographer Studio
                </h1>
                <p className="font-nunito text-sm text-[#9a9286]">
                  Upload customer photos from your device
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-nunito text-xs text-[#9a9286]">Session</p>
                  <p className="font-jakarta text-xl font-bold text-[#1f1b16]">
                    {photos.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-nunito text-xs text-[#9a9286]">Uploaded</p>
                  <p className="font-jakarta text-xl font-bold text-[#ff9d7e]">
                    {uploadedCount}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/photographer/history')}
                variant="outline"
                className="font-nunito border-[#e5e1d7] hover:bg-[#f7f6f3]"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-nunito border-[#e5e1d7] hover:bg-[#f7f6f3]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1d7]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#ff9d7e] to-[#f5826b] rounded-xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-nunito text-sm text-[#9a9286] mb-1">
                  Total Lifetime Uploads
                </p>
                <p className="font-jakarta text-3xl font-bold text-[#1f1b16]">
                  {stats.totalLifetimeUploads.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1d7]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#6fcf97] to-[#56b881] rounded-xl flex items-center justify-center">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-nunito text-sm text-[#9a9286] mb-1">
                  Today's Uploads
                </p>
                <p className="font-jakarta text-3xl font-bold text-[#1f1b16]">
                  {stats.todayUploads}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1d7]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#c9982f] to-[#b8872a] rounded-xl flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-nunito text-sm text-[#9a9286] mb-1">
                  Current Session
                </p>
                <p className="font-jakarta text-3xl font-bold text-[#1f1b16]">
                  {photos.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e5e1d7]"
            >
              <div className="bg-gradient-to-r from-[#ff9d7e] to-[#f5826b] px-6 py-4">
                <h3 className="font-jakarta text-lg font-semibold text-white flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Photos from Device
                </h3>
              </div>

              <div className="p-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-3 border-dashed border-[#e5e1d7] rounded-2xl p-16 text-center cursor-pointer hover:border-[#ff9d7e] hover:bg-[#fff8f5] transition-all group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#ff9d7e] to-[#f5826b] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h4 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-2">
                        Select Photos from Camera Roll
                      </h4>
                      <p className="font-nunito text-[#9a9286] mb-4">
                        Take photos using your phone's camera app, then upload them here
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="bg-gradient-to-r from-[#ff9d7e] to-[#f5826b] hover:from-[#f5826b] hover:to-[#eb6f59] text-white font-jakarta text-lg px-8 py-6 rounded-xl shadow-sm"
                      >
                        <ImageIcon className="mr-3 h-6 w-6" />
                        Choose Photos
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-[#fff8f5] border border-[#ffe5db] rounded-xl p-4">
                  <p className="font-nunito text-sm text-[#9a9286] text-center">
                    <span className="font-semibold text-[#ff9d7e]">Tip:</span> You can select multiple photos at once. 
                    Supported formats: JPG, PNG, HEIC
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <Button
                onClick={handleUploadAll}
                disabled={pendingCount === 0}
                size="lg"
                className="bg-white border-2 border-[#e5e1d7] text-[#1f1b16] hover:bg-[#f7f6f3] hover:border-[#ff9d7e] font-jakarta py-6 rounded-xl disabled:opacity-50 transition-all"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload All ({pendingCount})
              </Button>
              <Button
                onClick={handleUploadSelected}
                disabled={selectedPhotos.size === 0}
                size="lg"
                className="bg-white border-2 border-[#e5e1d7] text-[#1f1b16] hover:bg-[#f7f6f3] hover:border-[#ff9d7e] font-jakarta py-6 rounded-xl disabled:opacity-50 transition-all"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Selected ({selectedPhotos.size})
              </Button>
            </motion.div>
          </div>

          {/* Right - Gallery */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-[#e5e1d7] overflow-hidden sticky top-24"
            >
              <div className="bg-[#f7f6f3] px-6 py-4 border-b border-[#e5e1d7]">
                <div className="flex items-center justify-between">
                  <h3 className="font-jakarta text-lg font-semibold text-[#1f1b16]">
                    Session Gallery
                  </h3>
                  <Badge className="bg-[#ff9d7e] text-white font-nunito">
                    {photos.length}
                  </Badge>
                </div>
              </div>

              <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
                {photos.length === 0 ? (
                  <div className="text-center py-16">
                    <ImageIcon className="h-16 w-16 text-[#e8e3d8] mx-auto mb-4" />
                    <p className="font-nunito text-[#9a9286] mb-2">
                      No photos added yet
                    </p>
                    <p className="font-nunito text-xs text-[#9a9286]">
                      Upload photos from your device
                    </p>
                  </div>
                ) : (
                  photos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                        selectedPhotos.has(photo.id)
                          ? 'border-[#ff9d7e]'
                          : 'border-[#e8e3d8]'
                      }`}
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`Photo ${photo.id}`}
                        className="w-full aspect-[3/4] object-cover"
                      />

                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute top-3 right-3 flex gap-2">
                          {photo.uploaded ? (
                            <div className="w-9 h-9 rounded-full bg-[#ff9d7e] flex items-center justify-center shadow-lg">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <Button
                              onClick={() => togglePhotoSelection(photo.id)}
                              size="icon"
                              className={`w-9 h-9 rounded-full shadow-lg ${
                                selectedPhotos.has(photo.id)
                                  ? 'bg-[#ff9d7e] hover:bg-[#f5826b] text-white'
                                  : 'bg-white/95 hover:bg-white text-[#1f1b16]'
                              }`}
                            >
                              {selectedPhotos.has(photo.id) ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleDeletePhoto(photo.id)}
                            size="icon"
                            className="w-9 h-9 rounded-full bg-[#a32d2d] hover:bg-[#8a2525] text-white shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
                            <p className="font-nunito text-xs text-[#1f1b16]">
                              {photo.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Upload Badge */}
                      {photo.uploaded && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-[#ff9d7e] text-white font-nunito text-xs">
                            Uploaded
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
