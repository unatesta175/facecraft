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
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_ULTRA_OBJECTS, MOCK_OBJECTS } from '@/lib/mock-data';

export default function UltraObjectEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const uo = MOCK_ULTRA_OBJECTS.find((o) => o.id === params.id) ?? MOCK_ULTRA_OBJECTS[0];
  const [form, setForm] = useState({ title: uo.title, description: uo.description ?? '', status: uo.status });
  const [selectedObjects, setSelectedObjects] = useState<string[]>(uo.objectIds);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleObject = (id: string) => setSelectedObjects((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);

  const confirmUpdate = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: 'Ultra Object Updated', description: `"${form.title}" updated successfully.` });
    setConfirmOpen(false);
    router.push('/admin/ultra-objects');
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Ultra Object</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-5">
          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
            <div className="space-y-2"><Label>Title <span className="text-red-500">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Change Image</Label>
              <div className="border-2 border-dashed border-[--color-border] rounded-lg p-6 text-center hover:border-[--color-gold] transition-colors cursor-pointer">
                <Upload className="h-6 w-6 text-[--color-text-secondary] mx-auto mb-1" />
                <p className="text-sm text-[--color-text-secondary]">Click to change image</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[--color-text-primary]">Object Masters</h2>
            {selectedObjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedObjects.map((oid) => {
                  const obj = MOCK_OBJECTS.find((o) => o.id === oid);
                  return (
                    <span key={oid} className="inline-flex items-center gap-1.5 bg-[--color-gold-tint] text-[--color-gold-tint-text] text-xs font-medium px-2.5 py-1 rounded-full">
                      {obj?.title}<button type="button" onClick={() => toggleObject(oid)}><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-[--color-border] rounded-lg p-3">
              {MOCK_OBJECTS.map((o) => (
                <button key={o.id} type="button" onClick={() => toggleObject(o.id)}
                  className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${selectedObjects.includes(o.id) ? 'border-[--color-gold] bg-[--color-gold-tint] text-[--color-gold-tint-text]' : 'border-[--color-border] hover:bg-[--color-surface-muted] text-[--color-text-primary]'}`}>
                  {o.title}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Ultra Object</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Ultra Object" description={`Save changes to "${form.title}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
