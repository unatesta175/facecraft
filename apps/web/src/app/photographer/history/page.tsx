'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Image as ImageIcon, Search, Filter, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { photographerApi, PhotographerHistoryDay } from '@/lib/photographer-api';
import { useToast } from '@/hooks/use-toast';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function UploadHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>('all');
  const [history, setHistory] = useState<PhotographerHistoryDay[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const loadHistory = useCallback(async (filter: DateFilter) => {
    setIsLoading(true);
    try {
      const response = await photographerApi.getHistory(filter);
      setHistory(response.data?.items ?? []);
      setTotalPhotos(response.data?.totalPhotos ?? 0);
    } catch {
      toast({
        title: 'Could not load history',
        description: 'Please log in again to view your uploads.',
        variant: 'destructive',
      });
      router.push('/photographer/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadHistory(selectedFilter);
  }, [selectedFilter, loadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

  const filteredHistory = history.filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.date.includes(query) ||
      record.photoCount.toString().includes(query) ||
      record.photos.some((photo) => photo.filename.toLowerCase().includes(query))
    );
  });

  const handleDownload = (imageUrl: string | null, filename: string) => {
    if (!imageUrl) {
      toast({
        title: 'Download unavailable',
        description: 'Image URL could not be generated.',
        variant: 'destructive',
      });
      return;
    }
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="bg-white border-b border-[#e5e1d7] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/photographer')}
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-[#f7f6f3]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-jakarta text-2xl font-bold text-[#1f1b16]">
                  Upload History
                </h1>
                <p className="font-nunito text-sm text-[#9a9286]">
                  {totalPhotos} photo{totalPhotos === 1 ? '' : 's'} from your S3 uploads
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1d7] mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9a9286]" />
              <Input
                type="text"
                placeholder="Search by date, filename, or photo count..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'today', 'week', 'month'] as const).map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  variant={selectedFilter === filter ? 'default' : 'outline'}
                  className={`font-nunito capitalize ${
                    selectedFilter === filter
                      ? 'bg-gradient-to-r from-[#ff9d7e] to-[#f5826b] text-white'
                      : 'border-[#e5e1d7] hover:bg-[#f7f6f3]'
                  }`}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#ff9d7e]" />
            <p className="font-nunito text-[#9a9286]">Loading upload history...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e5e1d7] hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#ff9d7e] to-[#f5826b] rounded-xl flex items-center justify-center">
                        <Calendar className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-jakarta text-xl font-bold text-[#1f1b16] mb-1">
                          {formatDate(record.date)}
                        </h3>
                        <p className="font-nunito text-sm text-[#9a9286]">
                          {formatTime(record.firstUploadAt)}
                          {record.photoCount > 1 && ` – ${formatTime(record.lastUploadAt)}`}
                          {' · '}
                          Session: {record.sessionDuration}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#ff9d7e] text-white font-nunito text-base px-4 py-2">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {record.photoCount} photo{record.photoCount === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className="flex gap-3 mb-4 flex-wrap">
                    {record.thumbnails.map((thumbnail) => (
                      <div
                        key={thumbnail.id}
                        className="relative w-24 h-32 rounded-lg overflow-hidden border-2 border-[#e5e1d7] hover:border-[#ff9d7e] transition-colors bg-[#f7f6f3]"
                      >
                        {thumbnail.imageUrl ? (
                          <img
                            src={thumbnail.imageUrl}
                            alt={thumbnail.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-[#e8e3d8]" />
                          </div>
                        )}
                      </div>
                    ))}
                    {record.photoCount > 3 && (
                      <div className="w-24 h-32 rounded-lg bg-[#f7f6f3] border-2 border-dashed border-[#e5e1d7] flex items-center justify-center">
                        <div className="text-center">
                          <p className="font-jakarta text-2xl font-bold text-[#1f1b16]">
                            +{record.photoCount - 3}
                          </p>
                          <p className="font-nunito text-xs text-[#9a9286]">more</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {expandedDayId === record.id && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                      {record.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="rounded-lg overflow-hidden border border-[#e5e1d7] bg-[#f7f6f3]"
                        >
                          {photo.imageUrl ? (
                            <img
                              src={photo.imageUrl}
                              alt={photo.filename}
                              className="w-full aspect-[3/4] object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-[3/4] flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-[#e8e3d8]" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="font-nunito text-[10px] text-[#9a9286] truncate">
                              {photo.filename}
                            </p>
                            <p className="font-nunito text-[10px] text-[#9a9286]">
                              {formatTime(photo.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-[#e5e1d7]">
                    <Button
                      variant="outline"
                      className="flex-1 font-nunito border-[#e5e1d7] hover:bg-[#f7f6f3]"
                      onClick={() =>
                        setExpandedDayId(expandedDayId === record.id ? null : record.id)
                      }
                    >
                      {expandedDayId === record.id ? 'Hide Photos' : 'View All Photos'}
                    </Button>
                    {record.photos[0]?.imageUrl && (
                      <Button
                        variant="outline"
                        className="font-nunito border-[#e5e1d7] hover:bg-[#f7f6f3]"
                        onClick={() =>
                          handleDownload(record.photos[0].imageUrl, record.photos[0].filename)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-16 text-center shadow-sm border border-[#e5e1d7]"
          >
            <ImageIcon className="h-24 w-24 text-[#e8e3d8] mx-auto mb-6" />
            <h3 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-2">
              No upload history found
            </h3>
            <p className="font-nunito text-[#9a9286] mb-6">
              {history.length === 0
                ? 'Upload photos from the studio page to see them here.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {history.length === 0 && (
              <Button
                onClick={() => router.push('/photographer')}
                className="bg-gradient-to-r from-[#ff9d7e] to-[#f5826b] text-white"
              >
                Go to Upload Studio
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
