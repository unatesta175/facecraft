'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { TablePagination } from '@/components/admin/table-pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Minus, Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi, AdminPhotographerPhoto } from '@/lib/admin-api';

const PER_PAGE = 15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function PhotographerPhotosPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.getPhotographerPhotos>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<AdminPhotographerPhoto | null>(null);
  const [zoom, setZoom] = useState(1);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.getPhotographerPhotos(params.id, page, PER_PAGE);
      setData(response);
    } catch {
      setError('Failed to load photos.');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, page]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const openPreview = (photo: AdminPhotographerPhoto) => {
    setSelectedPhoto(photo);
    setZoom(1);
  };

  const closePreview = () => {
    setSelectedPhoto(null);
    setZoom(1);
  };

  const adjustZoom = (delta: number) => {
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))));
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[--color-text-primary]">Photographer Photos</h1>
            <p className="text-sm text-[--color-text-secondary] mt-0.5">
              All uploads by this photographer
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              loadPhotos();
              toast({ title: 'Refreshed' });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-[--color-text-secondary]">Loading photos...</div>
          ) : !data?.items.length ? (
            <div className="py-16 text-center text-sm text-[--color-text-secondary]">No photos uploaded yet.</div>
          ) : (
            <>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.items.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => openPreview(photo)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-[--color-border] bg-[--color-surface-muted] focus:outline-none focus:ring-2 focus:ring-[--color-gold]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photo.folderLabel ?? photo.orderCode}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1.5 text-left">
                      <p className="text-[10px] text-white font-mono truncate">{photo.orderCode}</p>
                    </div>
                  </button>
                ))}
              </div>
              <TablePagination
                currentPage={data.page}
                totalPages={data.totalPages}
                totalItems={data.total}
                itemsPerPage={PER_PAGE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.orderCode}
              {selectedPhoto?.folderLabel ? ` · ${selectedPhoto.folderLabel}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => adjustZoom(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-[--color-text-secondary] w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={() => adjustZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-lg border border-[--color-border] bg-[--color-surface-muted] p-4">
            {selectedPhoto && (
              <div className="flex min-h-[240px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.folderLabel ?? selectedPhoto.orderCode}
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  className="max-w-full transition-transform duration-150"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
