'use client';
import { useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Receipt, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/use-admin-data';
import { adminApi } from '@/lib/admin-api';

const PER_PAGE = 10;

export default function PhotographerReportPage() {
  const { data: ordersData, isLoading: ordersLoading, reload: reloadOrders } = useAdminData(() => adminApi.getOrders(), []);
  const { data: photographersData, isLoading: photographersLoading, reload: reloadPhotographers } = useAdminData(() => adminApi.getPhotographers(), [], []);
  const orders = ordersData ?? [];
  const photographers = photographersData ?? [];
  const isLoading = ordersLoading || photographersLoading;
  const reload = () => {
    reloadOrders();
    reloadPhotographers();
  };

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterPhotographer, setFilterPhotographer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const completed = orders.filter((o) => o.paymentStatus === 'COMPLETED');
  const totalSales = completed.reduce((s, o) => s + Number(o.price), 0);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderCode.toLowerCase().includes(q) || o.staffId.toLowerCase().includes(q);
    const matchStatus = !filterStatus || o.paymentStatus === filterStatus;
    const matchPayment = !filterPayment || o.paymentType === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = [
    { label: 'Total Sales', value: `RM ${totalSales.toFixed(2)}`, icon: TrendingUp },
    { label: 'Total Transactions', value: orders.length, icon: Receipt },
    { label: 'Total Amount', value: `RM ${orders.reduce((s, o) => s + Number(o.price), 0).toFixed(2)}`, icon: TrendingUp },
    { label: 'Total Uploads', value: orders.length * 3, icon: Upload },
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[--color-text-primary]">PG Report</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">Photographer performance overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-[--color-border] rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[--color-gold-tint] flex items-center justify-center">
                <s.icon className="h-5 w-5 text-[--color-gold]" />
              </div>
              <div>
                <p className="text-xs text-[--color-text-secondary]">{s.label}</p>
                <p className="text-xl font-semibold text-[--color-text-primary] mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[--color-border] flex flex-wrap gap-3">
            <Select value={filterPhotographer} onValueChange={setFilterPhotographer}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Photographers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Photographers</SelectItem>
                {photographers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Payment Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => { reload(); toast({ title: 'Refreshed' }); }} onExport={() => toast({ title: 'Exporting…' })} searchPlaceholder="Search order or staff ID…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name (Staff)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-[--color-text-secondary] py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-[--color-text-secondary] py-8">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o, i) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                    <TableCell className="font-medium">{o.staffName}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{o.date}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{o.time}</TableCell>
                    <TableCell><StatusBadge status={o.paymentType} /></TableCell>
                    <TableCell className="font-medium">RM {Number(o.price).toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}
