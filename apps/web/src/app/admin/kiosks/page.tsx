'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { PageHeader } from '@/components/admin/page-header';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { RowActions } from '@/components/admin/row-actions';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Monitor } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/use-admin-data';
import { adminApi } from '@/lib/admin-api';
import { AdminImageThumb } from '@/components/admin/admin-image';
import { getApiErrorMessage } from '@/lib/api-error';

const PER_PAGE = 10;

export default function KiosksPage() {
  const router = useRouter();
  const { data: items, isLoading, reload } = useAdminData(() => adminApi.getKiosks(), [], []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((k) => k.name.toLowerCase().includes(search.toLowerCase()) || k.username.toLowerCase().includes(search.toLowerCase()));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteKiosk(deleteId);
      toast({ title: 'Kiosk Deleted' });
      setDeleteId(null);
      reload();
    } catch (err) {
      toast({ title: 'Delete Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Kiosk Master" subtitle="Manage kiosk devices" onCreate={() => router.push('/admin/kiosks/new')} />
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => { reload(); toast({ title: 'Refreshed' }); }} onExport={() => toast({ title: 'Exporting…' })} searchPlaceholder="Search name or username…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-14">Photo</TableHead>
                <TableHead>Kiosk Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-[--color-text-secondary] py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-[--color-text-secondary] py-8">
                    No kiosks found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((k, i) => (
                  <TableRow key={k.id}>
                    <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                    <TableCell>
                      <AdminImageThumb src={k.profileImageUrl} alt={k.name} fallback={Monitor} />
                    </TableCell>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary] font-mono">{k.username}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{k.description}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={k.status} /></TableCell>
                    <TableCell><RowActions onView={() => router.push(`/admin/kiosks/${k.id}/view`)} onEdit={() => router.push(`/admin/kiosks/${k.id}/edit`)} onDelete={() => setDeleteId(k.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Kiosk" description="Delete this kiosk? All associated orders will remain." confirmLabel="Delete" onConfirm={confirmDelete} />
    </AdminLayout>
  );
}
