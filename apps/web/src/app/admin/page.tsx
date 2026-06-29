'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ShoppingBag, Camera, Monitor } from 'lucide-react';
import { adminApi, type AdminDashboard as AdminDashboardData } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError('');

      try {
        const response = await adminApi.getDashboard();
        if (!cancelled && response) {
          setData(response);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      label: 'Total Orders',
      value: data?.stats.totalOrders ?? 0,
      icon: ShoppingBag,
      iconBg: 'bg-[--color-blond]',
      iconColor: 'text-[--color-gold]',
    },
    {
      label: 'Total Sales (RM)',
      value: `RM ${(data?.stats.totalSales ?? 0).toFixed(2)}`,
      icon: Package,
      iconBg: 'bg-[--color-caramel]/50',
      iconColor: 'text-[--color-chocolate]',
    },
    {
      label: 'Total Photographers',
      value: data?.stats.totalPhotographers ?? 0,
      icon: Camera,
      iconBg: 'bg-[--color-blond]',
      iconColor: 'text-[--color-gold]',
    },
    {
      label: 'Total Kiosks',
      value: data?.stats.totalKiosks ?? 0,
      icon: Monitor,
      iconBg: 'bg-[--color-caramel]/50',
      iconColor: 'text-[--color-chocolate]',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[--color-text-primary]">Dashboard</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">
            Welcome back! Here&apos;s an overview of your studio.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-[--color-border] rounded-xl p-5 space-y-3">
              <div
                className={cn(
                  'w-11 h-11 rounded-lg flex items-center justify-center',
                  s.iconBg
                )}
              >
                <s.icon className={cn('h-5 w-5', s.iconColor)} />
              </div>
              <div>
                <p className="text-xs text-[--color-text-secondary]">{s.label}</p>
                <p className="text-2xl font-semibold text-[--color-text-primary] mt-0.5">
                  {isLoading ? '...' : s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[--color-border]">
            <h2 className="text-base font-semibold text-[--color-text-primary]">Recent Orders</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[--color-border-subtle]">
                <TableHead className="text-[--color-text-secondary]">Order ID</TableHead>
                <TableHead className="text-[--color-text-secondary]">Kiosk</TableHead>
                <TableHead className="text-[--color-text-secondary]">Date</TableHead>
                <TableHead className="text-[--color-text-secondary]">Price</TableHead>
                <TableHead className="text-[--color-text-secondary]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-[--color-text-secondary] py-10">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : data?.recentOrders.length ? (
                data.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs text-[--color-text-primary]">{o.orderCode}</TableCell>
                    <TableCell className="text-sm text-[--color-text-primary]">{o.kioskName}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{o.date}</TableCell>
                    <TableCell className="text-sm font-semibold text-[--color-text-primary]">
                      RM {o.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.paymentStatus} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-[--color-text-secondary] py-10">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
