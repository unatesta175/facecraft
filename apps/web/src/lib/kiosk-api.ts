import { apiRequest } from './api-client';

export type DemoAccounts = {
  admin: {
    name: string;
    email: string;
    username: string;
    role: string;
  } | null;
  kiosk: {
    name: string;
    username: string;
    description: string | null;
  } | null;
  passwordHint?: string;
};

export type KioskSession = {
  id: string;
  name: string;
  username: string;
  description: string | null;
  status: string;
};

const KIOSK_SESSION_KEY = 'facecraft_kiosk_session';

export type KioskFrame = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type KioskShopProduct = {
  id: string;
  name: string;
  photoCount: number;
  quantity: number;
  imageUrl: string | null;
};

export type KioskShopPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  products: KioskShopProduct[];
};

export type KioskCheckoutPayload = {
  kioskId: string;
  discountCode?: string;
  items: Array<{
    packageId: string;
    name: string;
    description: string | null;
    price: number;
    products: Array<{
      productId: string;
      name: string;
      photoCount: number;
      quantity: number;
      assignments: Array<{
        imageId: string;
        imageUrl: string;
        filename: string;
      }>;
    }>;
  }>;
};

export type KioskOrderResult = {
  id: string;
  orderCode: string;
  kioskName: string;
  staffCode: string;
  date: string;
  time: string;
  paymentType: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  price: number;
  items: Array<{
    name: string;
    description: string | null;
    price: number;
    products: Array<{
      name: string;
      photoCount: number;
      quantity: number;
      assignments: Array<{ filename: string }>;
    }>;
  }>;
};

export const kioskApi = {
  login: (username: string, password: string) =>
    apiRequest<{ kiosk: KioskSession; token: string }>('POST', '/api/v1/auth/kiosk-login', {
      username,
      password,
    }),

  logout: () => apiRequest('POST', '/api/v1/auth/kiosk-logout'),

  getDemoAccounts: () => apiRequest<DemoAccounts>('GET', '/api/v1/auth/demo-accounts'),

  saveSession: (kiosk: KioskSession) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(KIOSK_SESSION_KEY, JSON.stringify(kiosk));
    }
  },

  getSession: (): KioskSession | null => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as KioskSession;
    } catch {
      return null;
    }
  },

  clearSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(KIOSK_SESSION_KEY);
    }
  },

  getActiveFrames: () => apiRequest<KioskFrame[]>('GET', '/api/v1/kiosks/frames'),

  getShopPackages: () => apiRequest<KioskShopPackage[]>('GET', '/api/v1/kiosks/combos'),

  validateDiscount: (code: string) =>
    apiRequest<{ code: string; amount: number; description: string | null }>(
      'POST',
      '/api/v1/kiosks/discounts/validate',
      { code }
    ),

  createOrder: (
    payload: KioskCheckoutPayload & {
      paymentType: 'QR' | 'CARD' | 'CASH';
      staffCode?: string;
    }
  ) => apiRequest<KioskOrderResult>('POST', '/api/v1/kiosks/orders', payload),
};
