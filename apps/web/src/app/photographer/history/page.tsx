'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Image as ImageIcon, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface UploadRecord {
  id: string;
  date: string;
  photoCount: number;
  sessionDuration: string;
  thumbnails: string[];
}

// Mock data - in production, fetch from API
const UPLOAD_HISTORY: UploadRecord[] = [
  {
    id: '1',
    date: '2026-06-23',
    photoCount: 23,
    sessionDuration: '45 min',
    thumbnails: [
      'https://picsum.photos/seed/h1/400/600',
      'https://picsum.photos/seed/h2/400/600',
      'https://picsum.photos/seed/h3/400/600',
    ],
  },
  {
    id: '2',
    date: '2026-06-22',
    photoCount: 31,
    sessionDuration: '1h 15min',
    thumbnails: [
      'https://picsum.photos/seed/h4/400/600',
      'https://picsum.photos/seed/h5/400/600',
      'https://picsum.photos/seed/h6/400/600',
    ],
  },
  {
    id: '3',
    date: '2026-06-21',
    photoCount: 18,
    sessionDuration: '30 min',
    thumbnails: [
      'https://picsum.photos/seed/h7/400/600',
      'https://picsum.photos/seed/h8/400/600',
      'https://picsum.photos/seed/h9/400/600',
    ],
  },
  {
    id: '4',
    date: '2026-06-20',
    photoCount: 42,
    sessionDuration: '1h 45min',
    thumbnails: [
      'https://picsum.photos/seed/h10/400/600',
      'https://picsum.photos/seed/h11/400/600',
      'https://picsum.photos/seed/h12/400/600',
    ],
  },
  {
    id: '5',
    date: '2026-06-19',
    photoCount: 27,
    sessionDuration: '55 min',
    thumbnails: [
      'https://picsum.photos/seed/h13/400/600',
      'https://picsum.photos/seed/h14/400/600',
      'https://picsum.photos/seed/h15/400/600',
    ],
  },
];

export default function UploadHistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const filteredHistory = UPLOAD_HISTORY.filter(record => {
    if (searchQuery) {
      return record.date.includes(searchQuery) || 
             record.photoCount.toString().includes(searchQuery);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e1d7] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
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
                  View all your photo upload sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
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
                placeholder="Search by date or number of photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7]"
              />
            </div>
            <div className="flex gap-2">
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

        {/* Upload Records */}
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
                        Session Duration: {record.sessionDuration}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[#ff9d7e] text-white font-nunito text-base px-4 py-2">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {record.photoCount} photos
                  </Badge>
                </div>

                {/* Thumbnail Preview */}
                <div className="flex gap-3 mb-4">
                  {record.thumbnails.map((thumbnail, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-32 rounded-lg overflow-hidden border-2 border-[#e5e1d7] hover:border-[#ff9d7e] transition-colors"
                    >
                      <img
                        src={thumbnail}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
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

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#e5e1d7]">
                  <Button
                    variant="outline"
                    className="flex-1 font-nunito border-[#e5e1d7] hover:bg-[#f7f6f3]"
                  >
                    View All Photos
                  </Button>
                  <Button
                    variant="outline"
                    className="font-nunito border-[#e5e1d7] hover:bg-[#f7f6f3]"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-16 text-center shadow-sm border border-[#e5e1d7]"
          >
            <ImageIcon className="h-24 w-24 text-[#e8e3d8] mx-auto mb-6" />
            <h3 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-2">
              No upload history found
            </h3>
            <p className="font-nunito text-[#9a9286]">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
