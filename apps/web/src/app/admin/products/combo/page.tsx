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
import { Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/use-admin-data';
import { adminApi } from '@/lib/admin-api';
import { AdminImageThumb } from '@/components/admin/admin-image';
import { getApiErrorMessage } from '@/lib/api-error';

const PER_PAGE = 10;

export default function ComboProductsPage() {
  const router = useRouter();
  const { data: items, isLoading, reload } = useAdminData(() => adminApi.getCombos(), [], []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteCombo(deleteId);
      toast({ title: 'Combo Product Deleted', description: 'The combo product has been successfully deleted.' });
      setDeleteId(null);
      reload();
    } catch (err) {
      toast({ title: 'Delete Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Combo Products" subtitle="Manage your combo packages" onCreate={() => router.push('/admin/products/combo/new')} />

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onRefresh={() => { reload(); toast({ title: 'Refreshed' }); }}
            onExport={() => toast({ title: 'Exporting…' })}
            searchPlaceholder="Search Name"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-14">Product</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-[--color-text-secondary] py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-[--color-text-secondary] py-8">
                    No combo products found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                    <TableCell>
                      <AdminImageThumb src={c.thumbnailUrl} alt={c.name} fallback={Layers} />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-medium">RM {Number(c.price).toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                      <RowActions
                        onView={() => router.push(`/admin/products/combo/${c.id}/view`)}
                        onEdit={() => router.push(`/admin/products/combo/${c.id}/edit`)}
                        onDelete={() => setDeleteId(c.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Combo Product" description="Are you sure you want to delete this combo product?" confirmLabel="Delete" onConfirm={confirmDelete} />
    </AdminLayout>
  );
}
