export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string;
  photographerId: string;
  eventId: string;
  s3Key: string;
  filename: string;
  width: number;
  height: number;
  faceCount: number;
  capturedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface PhotoVariant {
  id: string;
  photoId: string;
  type: string;
  s3Key: string;
  width: number;
  height: number;
  transformData?: object;
}

export interface Event {
  id: string;
  photographerId: string;
  name: string;
  description?: string;
  eventDate: Date;
  location?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  items: PackageItem[];
}

export interface PackageItem {
  id: string;
  packageId: string;
  productId: string;
  quantity: number;
  requiredPhotoCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  photographerId: string;
  kioskSessionId?: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  photos: OrderItemPhoto[];
}

export interface OrderItemPhoto {
  id: string;
  orderItemId: string;
  photoId: string;
  photoVariantId?: string;
}

export interface Cart {
  id: string;
  kioskSessionId: string;
  subtotal: number;
  discount: number;
  total: number;
  items: CartItem[];
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  packageId?: string;
  quantity: number;
  photos: CartItemPhoto[];
}

export interface CartItemPhoto {
  id: string;
  cartItemId: string;
  photoId: string;
  photoVariantId?: string;
}

export interface KioskSession {
  id: string;
  kioskId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface SearchResult {
  photos: Photo[];
  nextCursor?: string;
  total: number;
}

export interface FaceSearchResult {
  photo: Photo;
  confidence: number;
}
