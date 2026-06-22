'use client';

import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

export default function KioskShopPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/v1/packages?isActive=true');
      if (response.data) {
        setPackages(response.data);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Package
          </h1>
          <p className="text-xl text-gray-600">
            Select a package and assign your photos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <Package className="w-6 h-6 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{pkg.name}</h2>
              </div>

              <p className="text-gray-600 mb-6">{pkg.description}</p>

              <div className="space-y-3 mb-6">
                {pkg.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm border-b border-gray-200 pb-2"
                  >
                    <span className="text-gray-700">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-gray-500">
                      {item.requiredPhotoCount} photo
                      {item.requiredPhotoCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">
                    Total:
                  </span>
                  <span className="text-3xl font-bold text-orange-500">
                    {formatCurrency(Number(pkg.basePrice))}
                  </span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Select Package
              </Button>
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No packages available</p>
          </div>
        )}
      </div>
    </div>
  );
}
