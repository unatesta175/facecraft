'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Printer, Download, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_ORDERS, MOCK_COMBOS } from '@/lib/mock-data';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const order = MOCK_ORDERS.find((o) => o.id === params.id) ?? MOCK_ORDERS[0];
  const combo = MOCK_COMBOS[0];
  const [status, setStatus] = useState(order.paymentStatus);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');

  const handleStatusChange = (val: string) => {
    setPendingStatus(val);
    setConfirmOpen(true);
  };

  const confirmStatusUpdate = () => {
    setStatus(pendingStatus);
    setConfirmOpen(false);
    toast({ title: 'Status Updated', description: `Order status changed to ${pendingStatus}` });
  };

  const mockPhotos = Array.from({ length: 4 }, (_, i) => ({
    id: `photo-${i}`, folderLabel: `Photo Folder X ${i + 1}`,
    imageUrl: `https://placehold.co/400x300/f7f6f3/9a9286?text=Photo+${i + 1}`,
  }));

  return (
    <AdminLayout>
      <div className="p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[--color-text-primary]">Order Detail</h1>
            <p className="text-sm text-[--color-text-secondary]">{order.orderCode}</p>
          </div>
          <Button variant="outline" className="text-[--color-chocolate]">
            <Printer className="h-4 w-4 mr-2" /> Print Receipt
          </Button>
        </div>

        {/* Order Summary Card */}
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

        {/* Combo Card */}
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-[--color-surface-muted] border-b border-[--color-border]">
            <h2 className="text-sm font-semibold text-[--color-text-primary]">Combo Package</h2>
          </div>
          <div className="p-6 flex gap-6">
            <div className="w-24 h-24 rounded-lg bg-[--color-gold-tint] flex items-center justify-center flex-shrink-0">
              <Image className="h-10 w-10 text-[--color-gold]" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[--color-text-primary]">{combo.name}</p>
              <p className="text-sm text-[--color-text-secondary]">RM {Number(combo.price).toFixed(2)}</p>
              <p className="text-xs text-[--color-text-secondary]">Combo code: #1782112233117</p>
              <p className="text-xs text-[--color-text-secondary]">{(combo as any).description ?? 'Combo package'}</p>
            </div>
          </div>
        </div>

        {/* Photo Folders */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[--color-text-primary]">Photo Folders</h2>
          {mockPhotos.map((photo) => (
            <div key={photo.id} className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-[--color-surface-muted] border-b border-[--color-border] flex items-center justify-between">
                <span className="text-sm font-medium text-[--color-text-primary]">{photo.folderLabel}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-[--color-chocolate]">
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm" className="text-[--color-chocolate]">
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <img src={photo.imageUrl} alt={photo.folderLabel} className="w-full h-48 object-cover rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Update Order Status"
        description={`Are you sure you want to change the status to "${pendingStatus}"?`}
        confirmLabel="Update"
        confirmVariant="gold"
        onConfirm={confirmStatusUpdate}
      />
    </AdminLayout>
  );
}
