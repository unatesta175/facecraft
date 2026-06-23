'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_OBJECTS } from '@/lib/mock-data';

export default function UltraObjectNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', status: 'ACTIVE' });
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleObject = (id: string) => setSelectedObjects((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: 'Ultra Object Created', description: `"${form.title}" created successfully.` });
    router.push('/admin/ultra-objects');
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Add Ultra Object</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
            <div className="space-y-2"><Label>Title <span className="text-red-500">*</span></Label><Input placeholder="e.g. Wedding Decoration Set" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Ultra Object Image</Label>
              <div className="border-2 border-dashed border-[--color-border] rounded-lg p-6 text-center hover:border-[--color-gold] transition-colors cursor-pointer">
                <Upload className="h-6 w-6 text-[--color-text-secondary] mx-auto mb-1" />
                <p className="text-sm text-[--color-text-secondary]">Click to upload</p>
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
            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">{saving ? 'Creating…' : 'Create Ultra Object'}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
