'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { PageHeader } from '@/components/admin/page-header';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { RowActions } from '@/components/admin/row-actions';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { MOCK_DISCOUNTS } from '@/lib/mock-data';

const PER_PAGE = 10;

export default function DiscountsPage() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_DISCOUNTS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((d) => d.code.toLowerCase().includes(search.toLowerCase()));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Discount Master" subtitle="Manage discount codes" onCreate={() => router.push('/admin/products/discounts/new')} />
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => toast({ title: 'Refreshed' })} onExport={() => toast({ title: 'Exporting…' })} searchPlaceholder="Search code…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Amount (RM)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                  <TableCell className="font-mono font-medium text-[--color-gold-tint-text]">{d.code}</TableCell>
                  <TableCell className="font-medium">RM {Number(d.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{d.description}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell><RowActions onView={() => router.push(`/admin/products/discounts/${d.id}/view`)} onEdit={() => router.push(`/admin/products/discounts/${d.id}/edit`)} onDelete={() => setDeleteId(d.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Discount" description="Delete this discount code?" confirmLabel="Delete" onConfirm={() => { setItems((p) => p.filter((d) => d.id !== deleteId)); toast({ title: 'Discount Deleted' }); setDeleteId(null); }} />
    </AdminLayout>
  );
}
