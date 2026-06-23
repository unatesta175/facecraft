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
import { ArrowLeft, X, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_COMBOS, MOCK_PRODUCTS } from '@/lib/mock-data';

export default function ComboEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const combo = MOCK_COMBOS.find((c) => c.id === params.id) ?? MOCK_COMBOS[0];
  const [form, setForm] = useState({ name: combo.name, price: String(combo.price), description: combo.description ?? '', status: combo.status });
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['prod-01', 'prod-03']);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleProduct = (id: string) => setSelectedProducts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);

  const confirmUpdate = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast({ title: 'Combo Updated', description: `"${form.name}" has been successfully updated.` });
    setConfirmOpen(false);
    router.push('/admin/products/combo');
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Combo Product</h1>
            <p className="text-sm text-[--color-text-secondary]">{combo.name}</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-5">
          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Combo Name <span className="text-red-500">*</span></Label>
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

          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[--color-text-primary]">Products</h2>
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((pid) => {
                  const p = MOCK_PRODUCTS.find((x) => x.id === pid);
                  return (
                    <span key={pid} className="inline-flex items-center gap-1.5 bg-[--color-gold-tint] text-[--color-gold-tint-text] text-xs font-medium px-2.5 py-1 rounded-full">
                      {p?.name}<button type="button" onClick={() => toggleProduct(pid)}><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-[--color-border] rounded-lg p-3">
              {MOCK_PRODUCTS.map((p, i) => (
                <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs border transition-colors ${selectedProducts.includes(p.id) ? 'border-[--color-gold] bg-[--color-gold-tint] text-[--color-gold-tint-text]' : 'border-[--color-border] hover:bg-[--color-surface-muted] text-[--color-text-primary]'}`}>
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
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Combo</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Combo Product" description={`Save changes to "${form.name}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
