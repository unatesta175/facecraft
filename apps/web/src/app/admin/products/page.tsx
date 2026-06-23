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
import { Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

const PER_PAGE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const confirmDelete = () => {
    setItems((prev) => prev.filter((p) => p.id !== deleteId));
    toast({ title: 'Product Deleted', description: 'The product has been successfully deleted.' });
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Products" subtitle="Manage your product catalogue" onCreate={() => router.push('/admin/products/new')} />

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onRefresh={() => toast({ title: 'Refreshed' })}
            onExport={() => toast({ title: 'Exporting…' })}
            searchPlaceholder="Search product name…"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-14">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Photo Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                  <TableCell>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${i % 2 === 0 ? 'bg-[--color-gold-tint]' : 'bg-[--color-chocolate-tint]'}`}>
                      <Package className={`h-4 w-4 ${i % 2 === 0 ? 'text-[--color-gold]' : 'text-[--color-chocolate]'}`} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{p.productType}</TableCell>
                  <TableCell className="font-medium">RM {Number(p.price).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{p.photoLimit}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>
                    <RowActions
                      onView={() => router.push(`/admin/products/${p.id}/view`)}
                      onEdit={() => router.push(`/admin/products/${p.id}/edit`)}
                      onDelete={() => setDeleteId(p.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}
