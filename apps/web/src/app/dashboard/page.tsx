'use client';

import { useEffect, useState } from 'react';
import { Camera, ShoppingBag, Users, Package } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalPhotos: 0,
    activeEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const userResponse = await apiRequest('GET', '/api/v1/auth/me');
      setUser(userResponse.data);

      setStats({
        totalOrders: 15,
        totalRevenue: 2450.00,
        totalPhotos: 234,
        activeEvents: 3,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name}
              </p>
            </div>
            <div className="flex gap-4">
              <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {user?.roles?.[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Photos</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPhotos}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Events</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeEvents}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/photos/upload"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors cursor-pointer"
            >
              <Camera className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Upload Photos</h3>
              <p className="text-sm text-gray-600">Add new photos to events</p>
            </a>

            <a
              href="/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-semibold text-gray-900">View Orders</h3>
              <p className="text-sm text-gray-600">Manage customer orders</p>
            </a>

            <a
              href="/events"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors cursor-pointer"
            >
              <Users className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Events</h3>
              <p className="text-sm text-gray-600">Create and edit events</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
