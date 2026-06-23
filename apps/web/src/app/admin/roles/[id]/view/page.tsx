'use client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';

export default function RoleViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = MOCK_USERS.find((u) => u.id === params.id) ?? MOCK_USERS[0];
  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">{label}</Label><div className="text-sm font-medium text-[--color-text-primary] bg-[--color-surface-muted] rounded-lg px-3 py-2.5 border border-[--color-border]">{value}</div></div>
  );
  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div className="flex-1"><h1 className="text-xl font-semibold text-[--color-text-primary]">View User</h1></div>
          <Button onClick={() => router.push(`/admin/roles/${user.id}/edit`)} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
        </div>
        <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" value={user.name} />
            <Field label="Staff Code" value={user.staffCode} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" value={user.phone ?? '—'} />
            <Field label="Email" value={user.email} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location Area" value={user.locationArea ?? '—'} />
            <Field label="User Type" value={user.role} />
          </div>
          <Field label="Username" value={user.username} />
          <div className="space-y-1.5"><Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">Status</Label><div className="pt-1"><StatusBadge status={user.status} /></div></div>
        </div>
      </div>
    </AdminLayout>
  );
}
