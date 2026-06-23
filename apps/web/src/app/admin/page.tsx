'use client';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ShoppingBag, Camera, Monitor } from 'lucide-react';
import { MOCK_ORDERS, MOCK_USERS, MOCK_KIOSKS } from '@/lib/mock-data';

export default function AdminDashboard() {
  const totalOrders = MOCK_ORDERS.length;
  const totalSales = MOCK_ORDERS.filter(o => o.paymentStatus === 'COMPLETED').reduce((s, o) => s + Number(o.price), 0);
  const totalPhotographers = MOCK_USERS.filter(u => u.role === 'STAFF').length;
  const totalKiosks = MOCK_KIOSKS.filter(k => k.status === 'ACTIVE').length;
  const recentOrders = MOCK_ORDERS.slice(0, 8);

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'gold' },
    { label: 'Total Sales (RM)', value: `RM ${totalSales.toFixed(2)}`, icon: Package, color: 'chocolate' },
    { label: 'Total Photographers', value: totalPhotographers, icon: Camera, color: 'gold' },
    { label: 'Total Kiosks', value: totalKiosks, icon: Monitor, color: 'chocolate' },
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[--color-text-primary]">Dashboard</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">Welcome back! Here's an overview of your studio.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-[--color-border] rounded-xl p-5 space-y-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color === 'gold' ? 'bg-[--color-gold-tint]' : 'bg-[--color-chocolate-tint]'}`}>
                <s.icon className={`h-5 w-5 ${s.color === 'gold' ? 'text-[--color-gold]' : 'text-[--color-chocolate]'}`} />
              </div>
              <div>
                <p className="text-xs text-[--color-text-secondary]">{s.label}</p>
                <p className="text-2xl font-semibold text-[--color-text-primary] mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[--color-border]">
            <h2 className="text-base font-semibold text-[--color-text-primary]">Recent Orders</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Kiosk</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs text-[--color-text-primary]">{o.orderCode}</TableCell>
                  <TableCell className="text-sm">{o.kioskName}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{o.date}</TableCell>
                  <TableCell className="text-sm font-medium">RM {Number(o.price).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
