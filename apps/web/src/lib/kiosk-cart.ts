import type { KioskShopPackage } from './kiosk-api';

export type KioskCartAssignment = {
  imageId: string;
  imageUrl: string;
  filename: string;
};

export type KioskCartProduct = {
  id: string;
  name: string;
  photoCount: number;
  quantity: number;
  imageUrl: string | null;
  assignments: KioskCartAssignment[];
};

export type KioskCartPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  products: KioskCartProduct[];
};

export type KioskCartStorage = {
  items: KioskCartPackage[];
  productAssignments: Record<string, Record<string, KioskCartAssignment[]>>;
};

const KIOSK_CART_KEY = 'facecraft_kiosk_cart';

const EMPTY_CART: KioskCartStorage = {
  items: [],
  productAssignments: {},
};

export function loadKioskCart(): KioskCartStorage {
  if (typeof window === 'undefined') return EMPTY_CART;
  const raw = sessionStorage.getItem(KIOSK_CART_KEY);
  if (!raw) return EMPTY_CART;
  try {
    const parsed = JSON.parse(raw) as KioskCartStorage;
    return {
      items: parsed.items ?? [],
      productAssignments: parsed.productAssignments ?? {},
    };
  } catch {
    return EMPTY_CART;
  }
}

export function saveKioskCart(data: KioskCartStorage): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KIOSK_CART_KEY, JSON.stringify(data));
}

export function clearKioskCart(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KIOSK_CART_KEY);
}

export function buildCartPackage(
  pkg: KioskShopPackage,
  assignments: Record<string, KioskCartAssignment[]>
): KioskCartPackage {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    imageUrl: pkg.imageUrl,
    products: pkg.products.map((product) => ({
      id: product.id,
      name: product.name,
      photoCount: product.photoCount,
      quantity: product.quantity,
      imageUrl: product.imageUrl,
      assignments: assignments[product.id] ?? [],
    })),
  };
}
