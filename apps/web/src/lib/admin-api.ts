import apiClient, { apiRequest } from './api-client';

export type AdminSize = {
  id: string;
  height: number;
  width: number;
  createdAt: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  productType: string;
  photoLimit: number;
  sizeId?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  size?: { id: string; height: number; width: number } | null;
};

export type AdminCombo = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: string;
  createdAt: string;
  productIds: string[];
  items: Array<{ productId: string; quantity: number; productName?: string; productImageUrl?: string | null }>;
};

export type AdminFrame = {
  id: string;
  name: string;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
};

export type AdminObject = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
};

export type AdminUltraObject = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  objectIds: string[];
};

export type AdminUser = {
  id: string;
  staffCode: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  locationArea?: string | null;
  role: string;
  isPhotographer?: boolean;
  deletePermission: boolean;
  profileImageUrl?: string | null;
  status: string;
  createdAt: string;
};

export type AdminKiosk = {
  id: string;
  name: string;
  username: string;
  description?: string | null;
  profileImageUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDiscount = {
  id: string;
  code: string;
  amount: number;
  description?: string | null;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  orderCode: string;
  kioskId: string;
  kioskName: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  paymentType: string;
  price: number;
  paymentStatus: string;
  cancellationReason?: string | null;
};

export type AdminDashboard = {
  stats: {
    totalOrders: number;
    totalSales: number;
    totalPhotographers: number;
    totalKiosks: number;
  };
  recentOrders: AdminOrder[];
};

export type AdminPhotographerPhoto = {
  id: string;
  imageUrl: string;
  folderLabel?: string | null;
  createdAt: string;
  orderCode: string;
  comboCode: string;
};

export type AdminPhotographerPhotosPage = {
  items: AdminPhotographerPhoto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminOrderDetail = AdminOrder & {
  orderCombos: Array<{
    id: string;
    comboCode: string;
    priceSnapshot: number;
    descriptionSnapshot?: string | null;
    comboName: string;
    comboImageUrl: string | null;
    photos: Array<{
      id: string;
      folderLabel?: string | null;
      filename: string;
      productName?: string | null;
      imageUrl: string | null;
    }>;
  }>;
};

async function get<T>(url: string): Promise<T> {
  const response = await apiRequest<T>('GET', url);
  return response.data as T;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await apiRequest<T>('POST', url, body);
  return response.data as T;
}

async function patch<T>(url: string, body: unknown): Promise<T> {
  const response = await apiRequest<T>('PATCH', url, body);
  return response.data as T;
}

async function del<T>(url: string): Promise<T> {
  const response = await apiRequest<T>('DELETE', url);
  return response.data as T;
}

export const adminApi = {
  getDashboard: () => get<AdminDashboard>('/api/v1/admin/dashboard'),
  getSizes: () => get<AdminSize[]>('/api/v1/admin/sizes'),
  getSize: (id: string) => get<AdminSize>(`/api/v1/admin/sizes/${id}`),
  getProducts: () => get<AdminProduct[]>('/api/v1/admin/products'),
  getProduct: (id: string) => get<AdminProduct>(`/api/v1/admin/products/${id}`),
  getCombos: () => get<AdminCombo[]>('/api/v1/admin/combos'),
  getCombo: (id: string) => get<AdminCombo>(`/api/v1/admin/combos/${id}`),
  getFrames: () => get<AdminFrame[]>('/api/v1/admin/frames'),
  getFrame: (id: string) => get<AdminFrame>(`/api/v1/admin/frames/${id}`),
  getObjects: () => get<AdminObject[]>('/api/v1/admin/objects'),
  getObject: (id: string) => get<AdminObject>(`/api/v1/admin/objects/${id}`),
  getUltraObjects: () => get<AdminUltraObject[]>('/api/v1/admin/ultra-objects'),
  getUltraObject: (id: string) => get<AdminUltraObject>(`/api/v1/admin/ultra-objects/${id}`),
  getUsers: (role?: string, photographersOnly?: boolean) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (photographersOnly) params.set('photographersOnly', 'true');
    const query = params.toString();
    return get<AdminUser[]>(`/api/v1/admin/users${query ? `?${query}` : ''}`);
  },
  getRoleUsers: () => get<AdminUser[]>('/api/v1/admin/users?rolesOnly=true'),
  getPhotographers: () => get<AdminUser[]>('/api/v1/admin/users?photographersOnly=true'),
  getUser: (id: string) => get<AdminUser>(`/api/v1/admin/users/${id}`),
  getPhotographerPhotos: (id: string, page = 1, limit = 15) =>
    get<AdminPhotographerPhotosPage>(`/api/v1/admin/users/${id}/photos?page=${page}&limit=${limit}`),
  getKiosks: () => get<AdminKiosk[]>('/api/v1/admin/kiosks'),
  getKiosk: (id: string) => get<AdminKiosk>(`/api/v1/admin/kiosks/${id}`),
  getDiscounts: () => get<AdminDiscount[]>('/api/v1/admin/discounts'),
  getDiscount: (id: string) => get<AdminDiscount>(`/api/v1/admin/discounts/${id}`),
  getOrders: () => get<AdminOrder[]>('/api/v1/admin/orders'),
  getOrder: (id: string) => get<AdminOrderDetail>(`/api/v1/admin/orders/${id}`),
  downloadOrderPhoto: async (
    orderId: string,
    comboId: string,
    photoId: string,
    filename: string
  ) => {
    const response = await apiClient.get(
      `/api/v1/admin/orders/${orderId}/combos/${comboId}/photos/${photoId}/download`,
      { responseType: 'blob' }
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
  updateOrderStatus: (
    id: string,
    body: { paymentStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED'; cancellationReason?: string }
  ) => patch<AdminOrder>(`/api/v1/admin/orders/${id}/status`, body),

  createSize: (body: { height: number; width: number }) => post<{ id: string }>('/api/v1/admin/sizes', body),
  updateSize: (id: string, body: { height: number; width: number }) => patch<{ id: string }>(`/api/v1/admin/sizes/${id}`, body),
  deleteSize: (id: string) => del<{ id: string }>(`/api/v1/admin/sizes/${id}`),

  createProduct: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/products', body),
  updateProduct: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/products/${id}`, body),
  deleteProduct: (id: string) => del<{ id: string }>(`/api/v1/admin/products/${id}`),

  createCombo: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/combos', body),
  updateCombo: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/combos/${id}`, body),
  deleteCombo: (id: string) => del<{ id: string }>(`/api/v1/admin/combos/${id}`),

  createDiscount: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/discounts', body),
  updateDiscount: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/discounts/${id}`, body),
  deleteDiscount: (id: string) => del<{ id: string }>(`/api/v1/admin/discounts/${id}`),

  createFrame: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/frames', body),
  updateFrame: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/frames/${id}`, body),
  deleteFrame: (id: string) => del<{ id: string }>(`/api/v1/admin/frames/${id}`),

  createObject: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/objects', body),
  updateObject: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/objects/${id}`, body),
  deleteObject: (id: string) => del<{ id: string }>(`/api/v1/admin/objects/${id}`),

  createUltraObject: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/ultra-objects', body),
  updateUltraObject: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/ultra-objects/${id}`, body),
  deleteUltraObject: (id: string) => del<{ id: string }>(`/api/v1/admin/ultra-objects/${id}`),

  createUser: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/users', body),
  updateUser: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/users/${id}`, body),
  deleteUser: (id: string) => del<{ id: string }>(`/api/v1/admin/users/${id}`),

  createKiosk: (body: Record<string, unknown>) => post<{ id: string }>('/api/v1/admin/kiosks', body),
  updateKiosk: (id: string, body: Record<string, unknown>) => patch<{ id: string }>(`/api/v1/admin/kiosks/${id}`, body),
  deleteKiosk: (id: string) => del<{ id: string }>(`/api/v1/admin/kiosks/${id}`),
};
