'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, X, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { getApiErrorMessage } from '@/lib/api-error';

export default function ComboNewPage() {
  const router = useRouter();
  const { data: products } = useAdminData(() => adminApi.getProducts(), []);
  const [form, setForm] = useState({ name: '', price: '', description: '', status: 'ACTIVE' });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const productList = products ?? [];

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createCombo({
        name: form.name,
        price: Number(form.price),
        description: form.description || null,
        status: form.status,
        items: selectedProducts.map(productId => ({ productId, quantity: 1 })),
      });
      toast({ title: 'Combo Product Created', description: `"${form.name}" has been successfully created.` });
      router.push('/admin/products/combo');
    } catch (err) {
      toast({ title: 'Create Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-xl font-semibold text-[--color-text-primary]">Add Combo Product</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Combo Name <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Heritage Premium" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Price (RM) <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product picker */}
          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[--color-text-primary]">Add Products</h2>

            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((pid) => {
                  const p = productList.find((x) => x.id === pid);
                  return (
                    <span key={pid} className="inline-flex items-center gap-1.5 bg-[--color-gold-tint] text-[--color-gold-tint-text] text-xs font-medium px-2.5 py-1 rounded-full">
                      {p?.name ?? pid}
                      <button type="button" onClick={() => toggleProduct(pid)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-[--color-border] rounded-lg p-3">
              {productList.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProduct(p.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors border ${selectedProducts.includes(p.id) ? 'border-[--color-gold] bg-[--color-gold-tint] text-[--color-gold-tint-text]' : 'border-[--color-border] hover:bg-[--color-surface-muted] text-[--color-text-primary]'}`}
                >
                  <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${i % 2 === 0 ? 'bg-[--color-gold-tint]' : 'bg-[--color-chocolate-tint]'}`}>
                    <Package className={`h-3.5 w-3.5 ${i % 2 === 0 ? 'text-[--color-gold]' : 'text-[--color-chocolate]'}`} />
                  </div>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">
              {saving ? 'Creating…' : 'Create Combo'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
