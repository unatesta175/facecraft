'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { KioskFrameSlider } from '@/components/kiosk/kiosk-frame-slider';
import { KioskHeader } from '@/components/kiosk/kiosk-header';
import { KioskPageBody, KioskScrollArea, KioskShell, KioskStickyFooter } from '@/components/kiosk/kiosk-shell';
import { LoadingSpinner } from '@/components/kiosk/loading-spinner';
import { PreviewModal } from '@/components/kiosk/preview-modal';
import { KioskDateFilter, KioskTimeFilter } from '@/components/kiosk/kiosk-filter-pickers';
import { PhotoGridItem } from '@/components/kiosk/photo-grid-item';
import { kioskApi, type KioskBrowsePhoto, type KioskFrame } from '@/lib/kiosk-api';
import {
  loadFaceMatchPhotos,
  saveSelectedAlbum,
} from '@/lib/kiosk-photo-session';
import { normalizePhotoTransform, type PhotoTransform } from '@/components/kiosk/kiosk-framed-image';
import { useRouter, useSearchParams } from 'next/navigation';
import { kioskBtnPrimary, kioskCard } from '@/lib/kiosk-ui';

type KioskPhoto = {
  id: string;
  url: string;
  s3Key: string;
  filename: string;
  capturedAt: Date;
};

function mapBrowsePhoto(photo: KioskBrowsePhoto): KioskPhoto | null {
  if (!photo.imageUrl) return null;
  return {
    id: photo.id,
    url: photo.imageUrl,
    s3Key: photo.s3Key,
    filename: photo.filename,
    capturedAt: new Date(photo.capturedAt),
  };
}

function SelectPhotosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManualMode = searchParams.get('mode') === 'manual';

  const [photos, setPhotos] = useState<KioskPhoto[]>([]);
  const [frames, setFrames] = useState<KioskFrame[]>([]);
  const [framesLoading, setFramesLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<KioskFrame | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'face-search' | 'manual'>('face-search');

  const selectedFrameUrl = selectedFrame?.imageUrl ?? null;

  useEffect(() => {
    if (!selectedFrameUrl) return;
    const img = new Image();
    img.src = selectedFrameUrl;
  }, [selectedFrameUrl]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await kioskApi.getActiveFrames();
        if (cancelled) return;
        const activeFrames = response.data ?? [];
        setFrames(activeFrames);
        if (activeFrames.length > 0) {
          setSelectedFrame(activeFrames[0]);
        }
      } catch {
        if (!cancelled) {
          setFrames([]);
        }
      } finally {
        if (!cancelled) {
          setFramesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadPhotos = useCallback(
    async (nextPage: number, replace = false) => {
      if (isManualMode) {
        if (nextPage > 1 && isLoadingMore) return;
        if (nextPage > 1) setIsLoadingMore(true);
        else setIsLoading(true);

        try {
          const response = await kioskApi.browsePhotos({
            page: nextPage,
            limit: 20,
            date: dateFilter || undefined,
            time: timeFilter || undefined,
          });

          const items = (response.data?.items ?? [])
            .map(mapBrowsePhoto)
            .filter((photo): photo is KioskPhoto => photo !== null);

          setPhotos((prev) => (replace ? items : [...prev, ...items]));
          setPage(nextPage);
          setHasMore(nextPage < (response.data?.totalPages ?? 1));
          setPhotoSource('manual');
          setLoadError(null);
        } catch {
          setLoadError('Unable to load photos. Please try again.');
        } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
        return;
      }

      setIsLoading(true);
      const matches = loadFaceMatchPhotos();
      const mapped = matches
        .map(mapBrowsePhoto)
        .filter((photo): photo is KioskPhoto => photo !== null);

      setPhotos(mapped);
      setPhotoSource('face-search');
      setHasMore(false);
      setLoadError(mapped.length === 0 ? 'No face matches found. Try manual search.' : null);
      setIsLoading(false);
    },
    [dateFilter, isLoadingMore, isManualMode, timeFilter]
  );

  useEffect(() => {
    loadPhotos(1, true);
  }, [isManualMode, dateFilter, timeFilter]);

  const loadMore = useCallback(() => {
    if (!isManualMode || !hasMore || isLoadingMore) return;
    loadPhotos(page + 1);
  }, [hasMore, isLoadingMore, isManualMode, loadPhotos, page]);

  useEffect(() => {
    if (!isManualMode) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.scrollTop + target.clientHeight >= target.scrollHeight - 120
      ) {
        loadMore();
      }
    };

    const scrollEl = document.querySelector('.kiosk-scroll-area');
    scrollEl?.addEventListener('scroll', handleScroll);
    return () => scrollEl?.removeEventListener('scroll', handleScroll);
  }, [isManualMode, loadMore]);

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleNext = () => {
    if (selectedPhotos.size === 0) {
      alert('Please select at least one photo');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleApplyPreview = (transforms: Record<string, PhotoTransform>) => {
    const selected = photos.filter((photo) => selectedPhotos.has(photo.id));

    saveSelectedAlbum({
      photos: selected.map((photo) => ({
        id: photo.id,
        s3Key: photo.s3Key,
        imageUrl: photo.url,
        filename: photo.filename,
        capturedAt: photo.capturedAt.toISOString(),
        photoTransform: normalizePhotoTransform(transforms[photo.id]),
      })),
      frameId: selectedFrame?.id ?? null,
      frameUrl: selectedFrameUrl,
      source: photoSource,
    });

    setShowPreviewModal(false);
    setIsLoading(true);
    router.push('/kiosk/shop');
  };

  const filteredPhotos = useMemo(() => {
    if (isManualMode) {
      return photos;
    }

    return photos.filter((photo) => {
      if (dateFilter) {
        const photoDate = format(photo.capturedAt, 'yyyy-MM-dd');
        if (photoDate !== dateFilter) return false;
      }
      if (timeFilter) {
        const photoTime = format(photo.capturedAt, 'HH:mm');
        if (photoTime !== timeFilter) return false;
      }
      return true;
    });
  }, [photos, dateFilter, timeFilter, isManualMode]);

  const previewPhotos = useMemo(
    () =>
      Array.from(selectedPhotos)
        .map((id) => {
          const photo = filteredPhotos.find((p) => p.id === id);
          return photo ? { id, url: photo.url } : null;
        })
        .filter((photo): photo is { id: string; url: string } => photo !== null),
    [filteredPhotos, selectedPhotos]
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading your photos..." />;
  }

  return (
    <KioskShell fixed className="bg-white">
      <KioskHeader
        title="Select Photos"
        subtitle={
          isManualMode
            ? 'Browse by date and time'
            : photoSource === 'face-search'
              ? 'Matched to your selfie'
              : 'Choose photos to continue'
        }
        onBack={() => router.push('/kiosk/capture')}
      />

      <KioskPageBody>
        <div className={`mx-4 mb-3 mt-3 shrink-0 ${kioskCard} p-4`}>
          <div className="mb-3 flex flex-col gap-2">
            <KioskDateFilter value={dateFilter} onChange={setDateFilter} />
            <KioskTimeFilter value={timeFilter} onChange={setTimeFilter} />
          </div>

          <div>
            <p className="mb-2 font-nunito text-xs text-[--color-text-secondary]">Frame style</p>
            {framesLoading ? (
              <p className="font-nunito text-xs text-[--color-text-secondary]">Loading frames...</p>
            ) : frames.length === 0 ? (
              <p className="font-nunito text-xs text-[--color-text-secondary]">No active frames.</p>
            ) : (
              <KioskFrameSlider
                frames={frames}
                selectedFrameId={selectedFrame?.id ?? null}
                onSelect={setSelectedFrame}
              />
            )}
          </div>
        </div>

        <KioskScrollArea className="px-4 pb-4">
          {loadError ? (
            <p className="py-8 text-center font-nunito text-sm text-[--color-danger-text]">{loadError}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {filteredPhotos.map((photo, index) => (
              <PhotoGridItem
                key={photo.id}
                id={photo.id}
                url={photo.url}
                frameUrl={selectedFrameUrl}
                isSelected={selectedPhotos.has(photo.id)}
                index={index}
                onToggle={togglePhotoSelection}
              />
            ))}
          </div>

          {filteredPhotos.length === 0 && !loadError ? (
            <p className="py-8 text-center font-nunito text-sm text-[--color-text-secondary]">
              No photos match the selected date or time.
            </p>
          ) : isManualMode && hasMore ? (
            <p className="py-6 text-center font-nunito text-xs text-[--color-text-secondary]">
              {isLoadingMore ? 'Loading more photos...' : 'Scroll for more photos...'}
            </p>
          ) : null}
        </KioskScrollArea>
      </KioskPageBody>

      <AnimatePresence>
        {selectedPhotos.size > 0 ? (
          <KioskStickyFooter>
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 font-jakarta text-sm font-bold text-[--color-text-primary]">
                {selectedPhotos.size} selected
              </p>
              <Button
                onClick={handleNext}
                size="lg"
                className={`h-12 shrink-0 rounded-2xl px-6 ${kioskBtnPrimary}`}
              >
                Next
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </KioskStickyFooter>
        ) : null}
      </AnimatePresence>

      <PreviewModal
        photos={previewPhotos}
        frameUrl={selectedFrameUrl}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onApply={handleApplyPreview}
      />
    </KioskShell>
  );
}

export default function SelectPhotosPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading your photos..." />}>
      <SelectPhotosContent />
    </Suspense>
  );
}
