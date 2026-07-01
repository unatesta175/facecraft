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
  photographer: {
    name: string;
    email: string;
    username: string;
    role: string;
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

export type KioskAiEffectItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export type KioskAiEffectUltraObject = KioskAiEffectItem & {
  objects: KioskAiEffectItem[];
};

export type KioskAiEffectsCatalog = {
  ultraObjects: KioskAiEffectUltraObject[];
  objects: KioskAiEffectItem[];
};

export type KioskBrowsePhoto = {
  id: string;
  s3Key: string;
  imageUrl: string | null;
  filename: string;
  capturedAt: string;
  similarity?: number;
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

  getAiEffects: () => apiRequest<KioskAiEffectsCatalog>('GET', '/api/v1/kiosks/ai-effects'),

  getShopPackages: () => apiRequest<KioskShopPackage[]>('GET', '/api/v1/kiosks/combos'),

  getSelfieUploadUrl: (kioskId: string, captureId?: string) =>
    apiRequest<{
      captureId: string;
      s3Key: string;
      uploadUrl: string;
      expiresIn: number;
    }>('POST', '/api/v1/kiosks/selfie-upload-url', { kioskId, captureId }),

  searchFaces: (selfieS3Key: string, maxResults = 20, minConfidence = 80) =>
    apiRequest<{ matches: KioskBrowsePhoto[]; matchCount: number }>(
      'POST',
      '/api/v1/kiosks/search-faces',
      { selfieS3Key, maxResults, minConfidence }
    ),

  browsePhotos: (params?: { page?: number; limit?: number; date?: string; time?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.date) query.set('date', params.date);
    if (params?.time) query.set('time', params.time);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{
      items: KioskBrowsePhoto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('GET', `/api/v1/kiosks/photos${suffix}`);
  },

  uploadSelfieToS3: async (uploadUrl: string, imageDataUrl: string) => {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload selfie');
    }
  },

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
