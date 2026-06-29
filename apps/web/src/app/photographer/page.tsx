'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Check, X, Image as ImageIcon, LogOut, History, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { photographerApi } from '@/lib/photographer-api';
import { PhotographerHeader } from '@/components/photographer/photographer-header';
import { PhotographerPageHeading } from '@/components/photographer/photographer-page-heading';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
  uploaded: boolean;
  uploading?: boolean;
  error?: string;
  file?: File;
}

export default function PhotographerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalLifetimeUploads: 0,
    todayUploads: 0,
  });
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    photographerApi
      .getStats()
      .then((response) => {
        if (response.data) setStats(response.data);
      })
      .catch(() => {
        router.push('/photographer/login');
      });
  }, [router]);

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

    const toUpload = photos.filter((photo) => selectedPhotos.has(photo.id) && !photo.uploaded && photo.file);
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ done: 0, total: toUpload.length });

    let successCount = 0;
    let failCount = 0;

    for (const photo of toUpload) {
      setPhotos((prev) =>
        prev.map((item) => (item.id === photo.id ? { ...item, uploading: true, error: undefined } : item))
      );

      try {
        await photographerApi.uploadPhoto(photo.file!);
        successCount += 1;
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === photo.id ? { ...item, uploaded: true, uploading: false } : item
          )
        );
      } catch (error: any) {
        failCount += 1;
        const message = error.response?.data?.error?.message || error.message || 'Upload failed';
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === photo.id ? { ...item, uploading: false, error: message } : item
          )
        );
      }

      setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    if (successCount > 0) {
      const statsResponse = await photographerApi.getStats();
      if (statsResponse.data) setStats(statsResponse.data);

      toast({
        title: 'Upload complete',
        description: `${successCount} photo(s) uploaded successfully${failCount ? `, ${failCount} failed` : ''}`,
        variant: failCount ? 'destructive' : 'default',
      });
    } else {
      toast({
        title: 'Upload failed',
        description:
          failCount === toUpload.length
            ? 'Photos could not be uploaded. Please try again or contact your administrator.'
            : `${failCount} photo(s) failed to upload`,
        variant: 'destructive',
      });
    }

    setSelectedPhotos(new Set());
    setIsUploading(false);
    setUploadProgress({ done: 0, total: 0 });
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

  const handleLogout = async () => {
    try {
      await photographerApi.logout();
    } catch {
      // ignore logout errors
    }
    router.push('/photographer/login');
  };

  if (isUploading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <LoadingSpinner />
        <p className="font-nunito text-[--color-text-secondary]">
          Uploading photos... {uploadProgress.done}/{uploadProgress.total}
        </p>
      </div>
    );
  }

  const uploadedCount = photos.filter(p => p.uploaded).length;
  const pendingCount = photos.length - uploadedCount;

  return (
    <div className="min-h-screen bg-white">
      <PhotographerHeader
        actions={
          <>
            <div className="hidden items-center gap-4 sm:flex">
              <div className="text-right">
                <p className="font-nunito text-xs text-[--color-text-secondary]">Session</p>
                <p className="font-jakarta text-xl font-bold text-[--color-text-primary]">{photos.length}</p>
              </div>
              <div className="text-right">
                <p className="font-nunito text-xs text-[--color-text-secondary]">Uploaded</p>
                <p className="font-jakarta text-xl font-bold text-[--color-gold]">{uploadedCount}</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/photographer/history')}
              variant="outline"
              className="font-nunito border-[--color-border] hover:bg-[--color-surface-muted]"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="font-nunito border-[--color-border] hover:bg-[--color-surface-muted]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto p-6">
        <PhotographerPageHeading
          title="Photographer Studio"
          subtitle="Upload customer photos from your device"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-[--color-border]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[--color-gold-tint] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-[--color-gold]" />
              </div>
              <div>
                <p className="font-nunito text-sm text-[--color-text-secondary] mb-1">
                  Total Lifetime Uploads
                </p>
                <p className="font-jakarta text-3xl font-bold text-[--color-text-primary]">
                  {stats.totalLifetimeUploads.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-[--color-border]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[--color-success-bg] rounded-lg flex items-center justify-center">
                <Calendar className="h-7 w-7 text-[--color-success-text]" />
              </div>
              <div>
                <p className="font-nunito text-sm text-[--color-text-secondary] mb-1">
                  Today's Uploads
                </p>
                <p className="font-jakarta text-3xl font-bold text-[--color-text-primary]">
                  {stats.todayUploads}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-[--color-border]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[--color-chocolate-tint] rounded-lg flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-[--color-chocolate]" />
              </div>
              <div>
                <p className="font-nunito text-sm text-[--color-text-secondary] mb-1">
                  Current Session
                </p>
                <p className="font-jakarta text-3xl font-bold text-[--color-text-primary]">
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
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-[--color-border]"
            >
              <div className="bg-[--color-gold] px-6 py-4">
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
                  className="relative border-2 border-dashed border-[--color-border] rounded-xl p-16 text-center cursor-pointer hover:border-[--color-gold] hover:bg-[--color-gold-tint] transition-all group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-[--color-gold] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h4 className="font-jakarta text-2xl font-bold text-[--color-text-primary] mb-2">
                        Select Photos from Camera Roll
                      </h4>
                      <p className="font-nunito text-[--color-text-secondary] mb-4">
                        Take photos using your phone's camera app, then upload them here
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="bg-[--color-gold] hover:bg-[--color-gold-hover] text-white font-jakarta text-lg px-8 py-6 rounded-xl shadow-sm"
                      >
                        <ImageIcon className="mr-3 h-6 w-6" />
                        Choose Photos
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-[--color-gold-tint] border border-[--color-border] rounded-xl p-4">
                  <p className="font-nunito text-sm text-[--color-text-secondary] text-center">
                    <span className="font-semibold text-[--color-gold]">Tip:</span> You can select multiple photos at once. 
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
                className="bg-white border-2 border-[--color-border] text-[--color-text-primary] hover:bg-[--color-surface-muted] hover:border-[--color-gold] font-jakarta py-6 rounded-xl disabled:opacity-50 transition-all"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload All ({pendingCount})
              </Button>
              <Button
                onClick={handleUploadSelected}
                disabled={selectedPhotos.size === 0}
                size="lg"
                className="bg-white border-2 border-[--color-border] text-[--color-text-primary] hover:bg-[--color-surface-muted] hover:border-[--color-gold] font-jakarta py-6 rounded-xl disabled:opacity-50 transition-all"
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
              className="bg-white rounded-xl shadow-sm border border-[--color-border] overflow-hidden sticky top-24"
            >
              <div className="bg-[--color-surface-muted] px-6 py-4 border-b border-[--color-border]">
                <div className="flex items-center justify-between">
                  <h3 className="font-jakarta text-lg font-semibold text-[--color-text-primary]">
                    Session Gallery
                  </h3>
                  <Badge variant="label" className="bg-[--color-gold] text-white font-nunito hover:bg-[--color-gold-hover] hover:text-white">
                    {photos.length}
                  </Badge>
                </div>
              </div>

              <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
                {photos.length === 0 ? (
                  <div className="text-center py-16">
                    <ImageIcon className="h-16 w-16 text-[--color-border] mx-auto mb-4" />
                    <p className="font-nunito text-[--color-text-secondary] mb-2">
                      No photos added yet
                    </p>
                    <p className="font-nunito text-xs text-[--color-text-secondary]">
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
                          ? 'border-[--color-gold]'
                          : 'border-[--color-border]'
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
                            <div className="w-9 h-9 rounded-full bg-[--color-gold] flex items-center justify-center shadow-lg">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <Button
                              onClick={() => togglePhotoSelection(photo.id)}
                              size="icon"
                              className={`w-9 h-9 rounded-full shadow-lg ${
                                selectedPhotos.has(photo.id)
                                  ? 'bg-[--color-gold] hover:bg-[--color-gold-hover] text-white'
                                  : 'bg-white/95 hover:bg-white text-[--color-text-primary]'
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
                            className="w-9 h-9 rounded-full bg-[--color-danger-text] hover:bg-[#8a2525] text-white shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
                            <p className="font-nunito text-xs text-[--color-text-primary]">
                              {photo.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Upload Badge */}
                      {photo.uploaded && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="label" className="bg-[--color-gold] text-white font-nunito text-xs hover:bg-[--color-gold-hover] hover:text-white">
                            Uploaded
                          </Badge>
                        </div>
                      )}
                      {photo.error && (
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="font-nunito text-xs text-red-700">{photo.error}</p>
                          </div>
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
