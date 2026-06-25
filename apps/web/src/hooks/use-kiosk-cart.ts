'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  buildCartPackage,
  clearKioskCart,
  loadKioskCart,
  saveKioskCart,
  type KioskCartAssignment,
  type KioskCartPackage,
  type KioskCartStorage,
} from '@/lib/kiosk-cart';
import type { KioskShopPackage } from '@/lib/kiosk-api';

export function useKioskCart() {
  const [data, setData] = useState<KioskCartStorage>({
    items: [],
    productAssignments: {},
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadKioskCart());
    setHydrated(true);
  }, []);

  const setProductAssignments = useCallback(
    (
      updater:
        | Record<string, Record<string, KioskCartAssignment[]>>
        | ((
            prev: Record<string, Record<string, KioskCartAssignment[]>>
          ) => Record<string, Record<string, KioskCartAssignment[]>>)
    ) => {
      setData((prev) => {
        const nextAssignments =
          typeof updater === 'function' ? updater(prev.productAssignments) : updater;
        const next = { ...prev, productAssignments: nextAssignments };
        saveKioskCart(next);
        return next;
      });
    },
    []
  );

  const addToCart = useCallback(
    (pkg: KioskShopPackage, assignments: Record<string, KioskCartAssignment[]>) => {
      setData((prev) => {
        const cartPackage = buildCartPackage(pkg, assignments);
        const next: KioskCartStorage = {
          ...prev,
          items: [...prev.items.filter((item) => item.id !== pkg.id), cartPackage],
        };
        saveKioskCart(next);
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback((packageId: string) => {
    setData((prev) => {
      const nextAssignments = { ...prev.productAssignments };
      delete nextAssignments[packageId];
      const next: KioskCartStorage = {
        items: prev.items.filter((item) => item.id !== packageId),
        productAssignments: nextAssignments,
      };
      saveKioskCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    clearKioskCart();
    setData({ items: [], productAssignments: {} });
  }, []);

  const cartPackageIds = data.items.map((item) => item.id);

  return {
    hydrated,
    items: data.items as KioskCartPackage[],
    cartPackageIds,
    productAssignments: data.productAssignments,
    setProductAssignments,
    addToCart,
    removeFromCart,
    clearCart,
  };
}
