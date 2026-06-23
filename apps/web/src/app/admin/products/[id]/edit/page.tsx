'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_PRODUCTS, MOCK_SIZES } from '@/lib/mock-data';

export default function ProductEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const product = MOCK_PRODUCTS.find((p) => p.id === params.id) ?? MOCK_PRODUCTS[0];
  const [form, setForm] = useState({ name: product.name, price: String(product.price), description: product.description ?? '', productType: product.productType, photoLimit: String(product.photoLimit), sizeId: '', status: product.status });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setConfirmOpen(true); };

  const confirmUpdate = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast({ title: 'Product Updated', description: `"${form.name}" has been successfully updated.` });
    setConfirmOpen(false);
    router.push('/admin/products');
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Product</h1>
            <p className="text-sm text-[--color-text-secondary]">{product.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Price (RM) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Type <span className="text-red-500">*</span></Label>
              <Select value={form.productType} onValueChange={(v) => setForm({ ...form, productType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EMAIL','MAGNET','OTHERS','CERTIFICATE_LEFT_1','CERTIFICATE_LEFT_2','CERTIFICATE_RIGHT_1'].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Photo Limit <span className="text-red-500">*</span></Label>
              <Input type="number" min="1" value={form.photoLimit} onChange={(e) => setForm({ ...form, photoLimit: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={form.sizeId} onValueChange={(v) => setForm({ ...form, sizeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select size…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {MOCK_SIZES.map((s) => <SelectItem key={s.id} value={s.id}>{s.height} × {s.width}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Product</Button>
          </div>
        </form>
      </div>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Product" description={`Save changes to "${form.name}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
