'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Printer, Download, ImageOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi, type AdminOrderDetail } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { printComboPhotos, downloadComboPhotos } from '@/lib/order-photo-actions';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: order, isLoading, error, reload } = useAdminData(
    () => adminApi.getOrder(params.id),
    [params.id]
  );
  const [status, setStatus] = useState('');
  const [cancellationReason, setCancellationReason] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED' | ''>('');
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [downloadingComboId, setDownloadingComboId] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setStatus(order.paymentStatus);
      setCancellationReason(order.cancellationReason ?? null);
    }
  }, [order]);

  const handleStatusChange = (val: string) => {
    setPendingStatus(val as 'PENDING' | 'COMPLETED' | 'CANCELLED');
    setCancelReasonInput('');
    setConfirmOpen(true);
  };

  const handleConfirmOpenChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) {
      setPendingStatus('');
      setCancelReasonInput('');
    }
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatus) return;

    if (pendingStatus === 'CANCELLED' && !cancelReasonInput.trim()) {
      toast({
        title: 'Cancellation reason required',
        description: 'Please provide a reason before cancelling this order.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updated = await adminApi.updateOrderStatus(params.id, {
        paymentStatus: pendingStatus,
        cancellationReason:
          pendingStatus === 'CANCELLED' ? cancelReasonInput.trim() : undefined,
      });
      setStatus(updated.paymentStatus);
      setCancellationReason(updated.cancellationReason ?? null);
      setConfirmOpen(false);
      setPendingStatus('');
      setCancelReasonInput('');
      await reload();
      toast({
        title: 'Status updated',
        description: `Order status changed to ${pendingStatus}.`,
      });
    } catch {
      toast({
        title: 'Update failed',
        description: 'Unable to update order status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadCombo = async (combo: AdminOrderDetail['orderCombos'][number]) => {
    setDownloadingComboId(combo.id);
    try {
      await downloadComboPhotos(params.id, combo.id, combo.photos);
      toast({
        title: 'Download started',
        description: `${combo.photos.length} photo(s) are downloading.`,
      });
    } catch {
      toast({
        title: 'Download failed',
        description: 'Unable to download combo photos. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingComboId(null);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!order) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[--color-text-primary]">Order Detail</h1>
            <p className="text-sm text-[--color-text-secondary]">{order.orderCode}</p>
          </div>
        </div>

        <div className="bg-white border border-[--color-border] rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Order ID', value: order.orderCode },
            { label: 'Staff ID', value: order.staffId },
            { label: 'Date', value: order.date },
            { label: 'Time', value: order.time },
            { label: 'Payment Type', value: <StatusBadge status={order.paymentType} /> },
            { label: 'Price', value: `RM ${Number(order.price).toFixed(2)}` },
            { label: 'Kiosk', value: order.kioskName },
            {
              label: 'Status',
              value: (
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-[--color-text-secondary] mb-1">{item.label}</p>
              <div className="text-sm font-medium text-[--color-text-primary]">{item.value}</div>
            </div>
          ))}
        </div>

        {status === 'CANCELLED' && cancellationReason ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[--color-danger-text] mb-2">
              Cancellation Reason
            </p>
            <p className="text-sm text-[--color-text-primary] whitespace-pre-wrap">{cancellationReason}</p>
          </div>
        ) : null}

        {order.orderCombos.map((combo) => (
          <div key={combo.id} className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-[--color-surface-muted] border-b border-[--color-border] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[--color-text-primary]">{combo.comboName}</h2>
                <p className="text-xs text-[--color-text-secondary] mt-1">
                  {combo.comboCode} · RM {Number(combo.priceSnapshot).toFixed(2)} · {combo.photos.length} photo(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[--color-chocolate]"
                  disabled={combo.photos.length === 0 || downloadingComboId === combo.id}
                  onClick={() => void handleDownloadCombo(combo)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {downloadingComboId === combo.id ? 'Downloading...' : 'Download All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[--color-chocolate]"
                  disabled={combo.photos.length === 0}
                  onClick={() => printComboPhotos(combo)}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-[--color-gold-tint] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {combo.comboImageUrl ? (
                    <img
                      src={combo.comboImageUrl}
                      alt={combo.comboName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-8 w-8 text-[--color-gold]" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-[--color-text-primary]">{combo.comboName}</p>
                  <p className="text-sm text-[--color-text-secondary]">
                    {combo.descriptionSnapshot ?? 'Combo package'}
                  </p>
                </div>
              </div>

              {combo.photos.length === 0 ? (
                <p className="text-sm text-[--color-text-secondary]">No photos in this combo.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {combo.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-lg border border-[--color-border] overflow-hidden bg-[--color-surface-muted]"
                    >
                      <div className="aspect-[4/3] bg-white">
                        {photo.imageUrl ? (
                          <img
                            src={photo.imageUrl}
                            alt={photo.filename}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageOff className="h-8 w-8 text-[--color-text-secondary]" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-[--color-text-primary] truncate">
                          {photo.productName ?? photo.folderLabel ?? photo.filename}
                        </p>
                        {photo.folderLabel && photo.productName ? (
                          <p className="text-xs text-[--color-text-secondary] truncate">{photo.folderLabel}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              {pendingStatus === 'CANCELLED'
                ? 'This order will be marked as cancelled. Please provide a reason.'
                : `Are you sure you want to change the status to "${pendingStatus}"?`}
            </DialogDescription>
          </DialogHeader>

          {pendingStatus === 'CANCELLED' ? (
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation reason</Label>
              <Textarea
                id="cancellation-reason"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="Explain why this order is being cancelled..."
                rows={4}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleConfirmOpenChange(false)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              onClick={() => void confirmStatusUpdate()}
              disabled={
                isUpdatingStatus ||
                (pendingStatus === 'CANCELLED' && !cancelReasonInput.trim())
              }
              className={
                pendingStatus === 'CANCELLED'
                  ? 'bg-[--color-danger-text] hover:bg-[--color-danger-text]/90 text-white'
                  : 'bg-[--color-gold] hover:bg-[--color-gold]/90 text-white'
              }
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
