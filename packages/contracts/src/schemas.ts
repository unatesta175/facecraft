import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const usernameLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const kioskLoginSchema = usernameLoginSchema;

export const registerPhotographerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  businessName: z.string().optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  description: z.string().optional(),
  eventDate: z.string().datetime(),
  location: z.string().optional(),
});

export const searchPhotosSchema = z.object({
  eventId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const createCartSchema = z.object({
  kioskSessionId: z.string().uuid(),
});

export const addToCartSchema = z.object({
  productId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
  photos: z.array(z.object({
    photoId: z.string().uuid(),
    photoVariantId: z.string().uuid().optional(),
  })),
}).refine((data) => data.productId || data.packageId, {
  message: 'Either productId or packageId must be provided',
});

export const applyDiscountSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
});

export const kioskCheckoutAssignmentSchema = z.object({
  imageId: z.string().min(1),
  imageUrl: z.string().url(),
  filename: z.string().min(1),
});

export const kioskCheckoutProductSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  photoCount: z.number().int().positive(),
  quantity: z.number().int().positive(),
  assignments: z.array(kioskCheckoutAssignmentSchema),
});

export const kioskCheckoutItemSchema = z.object({
  packageId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  products: z.array(kioskCheckoutProductSchema).min(1),
});

export const kioskCreateOrderSchema = z.object({
  kioskId: z.string().uuid(),
  paymentType: z.enum(['QR', 'CARD', 'CASH']),
  staffCode: z.string().optional(),
  discountCode: z.string().optional(),
  items: z.array(kioskCheckoutItemSchema).min(1, 'Cart must contain at least one package'),
});

export const createOrderSchema = z.object({
  cartId: z.string().uuid(),
  paymentMethod: z.enum(['CARD', 'QR', 'CASH']),
  discountCode: z.string().optional(),
  staffId: z.string().uuid().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
  notes: z.string().optional(),
});

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['PRINT', 'CERTIFICATE', 'FRAME', 'ALBUM', 'DIGITAL']),
  basePrice: z.number().positive('Price must be positive'),
  isActive: z.boolean().default(true),
});

export const createPackageSchema = z.object({
  name: z.string().min(2, 'Package name must be at least 2 characters'),
  description: z.string().optional(),
  basePrice: z.number().positive('Price must be positive'),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    requiredPhotoCount: z.number().int().min(0),
  })).min(1, 'Package must have at least one item'),
});

export const createDiscountSchema = z.object({
  code: z.string().min(3, 'Discount code must be at least 3 characters'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().positive('Discount value must be positive'),
  minPurchaseAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export const uploadPhotoSchema = z.object({
  eventId: z.string().uuid(),
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const kioskHeartbeatSchema = z.object({
  kioskId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  metadata: z.record(z.any()).optional(),
});

export const facialSearchSchema = z.object({
  selfieS3Key: z.string().min(1),
  eventId: z.string().uuid().optional(),
  maxResults: z.number().int().min(1).max(50).default(20),
  minConfidence: z.number().min(0).max(100).default(80),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UsernameLoginInput = z.infer<typeof usernameLoginSchema>;
export type KioskLoginInput = z.infer<typeof kioskLoginSchema>;
export type RegisterPhotographerInput = z.infer<typeof registerPhotographerSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SearchPhotosInput = z.infer<typeof searchPhotosSchema>;
export type CreateCartInput = z.infer<typeof createCartSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
export type KioskCreateOrderInput = z.infer<typeof kioskCreateOrderSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;
export type KioskHeartbeatInput = z.infer<typeof kioskHeartbeatSchema>;
export type FacialSearchInput = z.infer<typeof facialSearchSchema>;
