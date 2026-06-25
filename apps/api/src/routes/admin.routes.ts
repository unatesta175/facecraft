import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { ApiResponseBuilder } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';
import { omitPassword, toDateOnly, toIsoString, toNumber } from '../utils/serialize';
import { resolveImageUrl, isRemoteUrl } from '../utils/image-url';
import { s3Service } from '../services/s3.service';

export const adminRouter = Router();

adminRouter.use(authenticateUser);

async function resolveFields<T extends Record<string, unknown>>(
  item: T,
  fields: (keyof T)[]
): Promise<T> {
  const resolved = { ...item };
  for (const field of fields) {
    const value = item[field];
    if (typeof value === 'string' || value === null) {
      (resolved as Record<string, unknown>)[field as string] = await resolveImageUrl(
        value as string | null
      );
    }
  }
  return resolved;
}

function sanitizeDownloadFilename(value: string, fallback: string): string {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned || fallback;
}

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

async function loadOrderPhotoBuffer(imageUrl: string): Promise<Buffer> {
  if (isRemoteUrl(imageUrl)) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch photo: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return s3Service.getObjectBuffer(imageUrl);
}

function serializeSize(size: { id: string; height: unknown; width: unknown; createdAt: Date }) {
  return {
    id: size.id,
    height: toNumber(size.height),
    width: toNumber(size.width),
    createdAt: toIsoString(size.createdAt),
  };
}

function serializeProduct(product: {
  id: string;
  name: string;
  price: unknown;
  description: string | null;
  productType: string;
  photoLimit: number;
  sizeId: string | null;
  imageUrl: string | null;
  status: string;
  createdAt: Date;
  size?: { id: string; height: unknown; width: unknown } | null;
}) {
  return {
    id: product.id,
    name: product.name,
    price: toNumber(product.price),
    description: product.description,
    productType: product.productType,
    photoLimit: product.photoLimit,
    sizeId: product.sizeId,
    imageUrl: product.imageUrl,
    status: product.status,
    createdAt: toIsoString(product.createdAt),
    size: product.size
      ? {
          id: product.size.id,
          height: toNumber(product.size.height),
          width: toNumber(product.size.width),
        }
      : null,
  };
}

function serializeCombo(combo: {
  id: string;
  name: string;
  price: unknown;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: Date;
  items?: Array<{
    productId: string;
    quantity: number;
    product?: { id: string; name: string; imageUrl?: string | null };
  }>;
}) {
  return {
    id: combo.id,
    name: combo.name,
    price: toNumber(combo.price),
    description: combo.description,
    thumbnailUrl: combo.thumbnailUrl,
    status: combo.status,
    createdAt: toIsoString(combo.createdAt),
    productIds: combo.items?.map((item) => item.productId) ?? [],
    items:
      combo.items?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product?.name,
        productImageUrl: item.product?.imageUrl ?? null,
      })) ?? [],
  };
}

async function resolveCombo<T extends ReturnType<typeof serializeCombo>>(combo: T): Promise<T> {
  const resolved = await resolveFields(combo, ['thumbnailUrl']);
  resolved.items = await Promise.all(
    combo.items.map(async (item) => ({
      ...item,
      productImageUrl: await resolveImageUrl(item.productImageUrl),
    }))
  );
  return resolved;
}

function serializeUser(user: {
  id: string;
  staffCode: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  locationArea: string | null;
  role: string;
  isPhotographer: boolean;
  deletePermission: boolean;
  profileImageUrl: string | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    staffCode: user.staffCode,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    locationArea: user.locationArea,
    role: user.role,
    isPhotographer: user.isPhotographer,
    deletePermission: user.deletePermission,
    profileImageUrl: user.profileImageUrl,
    status: user.status,
    createdAt: toIsoString(user.createdAt),
  };
}

function serializeOrder(order: {
  id: string;
  orderCode: string;
  kioskId: string;
  date: Date;
  time: string;
  paymentType: string;
  price: unknown;
  paymentStatus: string;
  cancellationReason?: string | null;
  kiosk?: { name: string } | null;
  staff?: { staffCode: string; name: string } | null;
}) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    kioskId: order.kioskId,
    kioskName: order.kiosk?.name ?? '',
    staffId: order.staff?.staffCode ?? '',
    staffName: order.staff?.name ?? '',
    date: toDateOnly(order.date),
    time: order.time,
    paymentType: order.paymentType,
    price: toNumber(order.price),
    paymentStatus: order.paymentStatus,
    cancellationReason: order.cancellationReason ?? null,
  };
}

const updateOrderStatusSchema = z
  .object({
    paymentStatus: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
    cancellationReason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentStatus === 'CANCELLED' && !data.cancellationReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cancellation reason is required',
        path: ['cancellationReason'],
      });
    }
  });

adminRouter.get('/dashboard', async (req, res) => {
  const requestId = (req as any).id;

  const [totalOrders, salesAggregate, totalPhotographers, totalKiosks, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.user.count({ where: { isPhotographer: true, status: 'ACTIVE' } }),
      prisma.kiosk.count({ where: { status: 'ACTIVE' } }),
      prisma.order.findMany({
        take: 8,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: { kiosk: { select: { name: true } } },
      }),
    ]);

  res.json(
    ApiResponseBuilder.success(
      {
        stats: {
          totalOrders,
          totalSales: toNumber(salesAggregate._sum.price),
          totalPhotographers,
          totalKiosks,
        },
        recentOrders: recentOrders.map((order) => serializeOrder({ ...order, staff: null })),
      },
      requestId
    )
  );
});

adminRouter.get('/sizes', async (req, res) => {
  const requestId = (req as any).id;
  const sizes = await prisma.size.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(ApiResponseBuilder.success(sizes.map(serializeSize), requestId));
});

adminRouter.get('/sizes/:id', async (req, res) => {
  const requestId = (req as any).id;
  const size = await prisma.size.findUnique({ where: { id: req.params.id } });
  if (!size) throw new NotFoundError('Size', req.params.id);
  res.json(ApiResponseBuilder.success(serializeSize(size), requestId));
});

adminRouter.get('/products', async (req, res) => {
  const requestId = (req as any).id;
  const products = await prisma.product.findMany({
    include: { size: true },
    orderBy: { createdAt: 'desc' },
  });
  const serialized = await Promise.all(
    products.map(async (product) => resolveFields(serializeProduct(product), ['imageUrl']))
  );
  res.json(ApiResponseBuilder.success(serialized, requestId));
});

adminRouter.get('/products/:id', async (req, res) => {
  const requestId = (req as any).id;
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { size: true },
  });
  if (!product) throw new NotFoundError('Product', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveFields(serializeProduct(product), ['imageUrl']),
      requestId
    )
  );
});

adminRouter.get('/combos', async (req, res) => {
  const requestId = (req as any).id;
  const combos = await prisma.comboProduct.findMany({
    include: {
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(
    ApiResponseBuilder.success(
      await Promise.all(
        combos.map(async (combo) => resolveCombo(serializeCombo(combo)))
      ),
      requestId
    )
  );
});

adminRouter.get('/combos/:id', async (req, res) => {
  const requestId = (req as any).id;
  const combo = await prisma.comboProduct.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });
  if (!combo) throw new NotFoundError('Combo product', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveCombo(serializeCombo(combo)),
      requestId
    )
  );
});

adminRouter.get('/frames', async (req, res) => {
  const requestId = (req as any).id;
  const frames = await prisma.frame.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    ApiResponseBuilder.success(
      await Promise.all(
        frames.map(async (frame) =>
          resolveFields(
            {
              id: frame.id,
              name: frame.name,
              imageUrl: frame.imageUrl,
              status: frame.status,
              createdAt: toIsoString(frame.createdAt),
            },
            ['imageUrl']
          )
        )
      ),
      requestId
    )
  );
});

adminRouter.get('/frames/:id', async (req, res) => {
  const requestId = (req as any).id;
  const frame = await prisma.frame.findUnique({ where: { id: req.params.id } });
  if (!frame) throw new NotFoundError('Frame', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveFields(
        {
          id: frame.id,
          name: frame.name,
          imageUrl: frame.imageUrl,
          status: frame.status,
          createdAt: toIsoString(frame.createdAt),
        },
        ['imageUrl']
      ),
      requestId
    )
  );
});

adminRouter.get('/objects', async (req, res) => {
  const requestId = (req as any).id;
  const objects = await prisma.objectMaster.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    ApiResponseBuilder.success(
      await Promise.all(
        objects.map(async (obj) =>
          resolveFields(
            {
              id: obj.id,
              title: obj.title,
              description: obj.description,
              imageUrl: obj.imageUrl,
              status: obj.status,
              createdAt: toIsoString(obj.createdAt),
            },
            ['imageUrl']
          )
        )
      ),
      requestId
    )
  );
});

adminRouter.get('/objects/:id', async (req, res) => {
  const requestId = (req as any).id;
  const obj = await prisma.objectMaster.findUnique({ where: { id: req.params.id } });
  if (!obj) throw new NotFoundError('Object master', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveFields(
        {
          id: obj.id,
          title: obj.title,
          description: obj.description,
          imageUrl: obj.imageUrl,
          status: obj.status,
          createdAt: toIsoString(obj.createdAt),
        },
        ['imageUrl']
      ),
      requestId
    )
  );
});

adminRouter.get('/ultra-objects', async (req, res) => {
  const requestId = (req as any).id;
  const ultraObjects = await prisma.ultraObject.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(
    ApiResponseBuilder.success(
      await Promise.all(
        ultraObjects.map(async (uo) =>
          resolveFields(
            {
              id: uo.id,
              title: uo.title,
              description: uo.description,
              imageUrl: uo.imageUrl,
              status: uo.status,
              createdAt: toIsoString(uo.createdAt),
              objectIds: uo.items.map((item) => item.objectId),
            },
            ['imageUrl']
          )
        )
      ),
      requestId
    )
  );
});

adminRouter.get('/ultra-objects/:id', async (req, res) => {
  const requestId = (req as any).id;
  const uo = await prisma.ultraObject.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!uo) throw new NotFoundError('Ultra object', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveFields(
        {
          id: uo.id,
          title: uo.title,
          description: uo.description,
          imageUrl: uo.imageUrl,
          status: uo.status,
          createdAt: toIsoString(uo.createdAt),
          objectIds: uo.items.map((item) => item.objectId),
        },
        ['imageUrl']
      ),
      requestId
    )
  );
});

adminRouter.get('/users', async (req, res) => {
  const requestId = (req as any).id;
  const role = typeof req.query.role === 'string' ? (req.query.role as UserRole) : undefined;
  const photographersOnly = req.query.photographersOnly === 'true';
  const rolesOnly = req.query.rolesOnly === 'true';

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(photographersOnly ? { isPhotographer: true } : {}),
      ...(rolesOnly ? { isPhotographer: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = await Promise.all(
    users.map(async (user) => resolveFields(serializeUser(user), ['profileImageUrl']))
  );

  res.json(ApiResponseBuilder.success(serialized, requestId));
});

adminRouter.get('/users/:id/photos', async (req, res) => {
  const requestId = (req as any).id;
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('User', req.params.id);

  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? '15'), 10) || 15));
  const skip = (page - 1) * limit;

  const where = { photographerId: req.params.id };

  const [orderPhotoTotal, uploadPhotoTotal, orderPhotos, uploadPhotos] = await Promise.all([
    prisma.orderPhoto.count({ where }),
    prisma.photographerPhoto.count({ where }),
    prisma.orderPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        orderCombo: {
          select: {
            comboCode: true,
            order: { select: { orderCode: true } },
          },
        },
      },
    }),
    prisma.photographerPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const total = orderPhotoTotal + uploadPhotoTotal;

  const orderItems = await Promise.all(
    orderPhotos.map(async (photo: (typeof orderPhotos)[number]) =>
      resolveFields(
        {
          id: photo.id,
          imageUrl: photo.imageUrl,
          folderLabel: photo.folderLabel,
          createdAt: toIsoString(photo.createdAt),
          orderCode: photo.orderCombo.order.orderCode,
          comboCode: photo.orderCombo.comboCode,
          source: 'order',
        },
        ['imageUrl']
      )
    )
  );

  const uploadItems = await Promise.all(
    uploadPhotos.map(async (photo: (typeof uploadPhotos)[number]) =>
      resolveFields(
        {
          id: photo.id,
          imageUrl: photo.s3Key,
          folderLabel: photo.filename,
          createdAt: toIsoString(photo.createdAt),
          orderCode: null,
          comboCode: null,
          source: 'upload',
        },
        ['imageUrl']
      )
    )
  );

  const items = [...uploadItems, ...orderItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  res.json(
    ApiResponseBuilder.success(
      {
        items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      requestId
    )
  );
});

adminRouter.get('/users/:id', async (req, res) => {
  const requestId = (req as any).id;
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('User', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveFields(serializeUser(user), ['profileImageUrl']),
      requestId
    )
  );
});

adminRouter.get('/kiosks', async (req, res) => {
  const requestId = (req as any).id;
  const kiosks = await prisma.kiosk.findMany({ orderBy: { createdAt: 'desc' } });
  const serialized = await Promise.all(
    kiosks.map(async (kiosk) =>
      resolveFields(
        {
          ...omitPassword(kiosk),
          createdAt: toIsoString(kiosk.createdAt),
          updatedAt: toIsoString(kiosk.updatedAt),
        },
        ['profileImageUrl']
      )
    )
  );
  res.json(ApiResponseBuilder.success(serialized, requestId));
});

adminRouter.get('/kiosks/:id', async (req, res) => {
  const requestId = (req as any).id;
  const kiosk = await prisma.kiosk.findUnique({ where: { id: req.params.id } });
  if (!kiosk) throw new NotFoundError('Kiosk', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      await resolveFields(
        {
          ...omitPassword(kiosk),
          createdAt: toIsoString(kiosk.createdAt),
          updatedAt: toIsoString(kiosk.updatedAt),
        },
        ['profileImageUrl']
      ),
      requestId
    )
  );
});

adminRouter.get('/discounts', async (req, res) => {
  const requestId = (req as any).id;
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    ApiResponseBuilder.success(
      discounts.map((discount) => ({
        id: discount.id,
        code: discount.code,
        amount: toNumber(discount.amount),
        description: discount.description,
        createdAt: toIsoString(discount.createdAt),
      })),
      requestId
    )
  );
});

adminRouter.get('/discounts/:id', async (req, res) => {
  const requestId = (req as any).id;
  const discount = await prisma.discount.findUnique({ where: { id: req.params.id } });
  if (!discount) throw new NotFoundError('Discount', req.params.id);
  res.json(
    ApiResponseBuilder.success(
      {
        id: discount.id,
        code: discount.code,
        amount: toNumber(discount.amount),
        description: discount.description,
        createdAt: toIsoString(discount.createdAt),
      },
      requestId
    )
  );
});

adminRouter.get('/orders', async (req, res) => {
  const requestId = (req as any).id;
  const orders = await prisma.order.findMany({
    include: {
      kiosk: { select: { name: true } },
      staff: { select: { staffCode: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(ApiResponseBuilder.success(orders.map(serializeOrder), requestId));
});

adminRouter.get('/orders/:id', async (req, res) => {
  const requestId = (req as any).id;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      kiosk: { select: { name: true } },
      staff: { select: { staffCode: true, name: true } },
      orderCombos: {
        include: {
          comboProduct: true,
          orderPhotos: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!order) throw new NotFoundError('Order', req.params.id);

  res.json(
    ApiResponseBuilder.success(
      {
        ...serializeOrder(order),
        orderCombos: await Promise.all(
          order.orderCombos.map(async (combo) => ({
            id: combo.id,
            comboCode: combo.comboCode,
            priceSnapshot: toNumber(combo.priceSnapshot),
            descriptionSnapshot: combo.descriptionSnapshot,
            comboName: combo.comboProduct.name,
            comboImageUrl: await resolveImageUrl(combo.comboProduct.thumbnailUrl),
            photos: await Promise.all(
              combo.orderPhotos.map(async (photo) =>
                resolveFields(
                  {
                    id: photo.id,
                    folderLabel: photo.folderLabel,
                    filename: photo.folderLabel ?? `photo-${photo.id}.jpg`,
                    productName: photo.product?.name ?? null,
                    imageUrl: photo.imageUrl,
                  },
                  ['imageUrl']
                )
              )
            ),
          }))
        ),
      },
      requestId
    )
  );
});

adminRouter.get('/orders/:orderId/combos/:comboId/photos/:photoId/download', async (req, res) => {
  const photo = await prisma.orderPhoto.findFirst({
    where: {
      id: req.params.photoId,
      orderComboId: req.params.comboId,
      orderCombo: {
        orderId: req.params.orderId,
      },
    },
  });

  if (!photo) {
    throw new NotFoundError('Order photo', req.params.photoId);
  }

  const buffer = await loadOrderPhotoBuffer(photo.imageUrl);
  const filename = sanitizeDownloadFilename(
    photo.folderLabel ?? `photo-${photo.id}.jpg`,
    `photo-${photo.id}.jpg`
  );

  res.setHeader('Content-Type', guessContentType(filename));
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
});

adminRouter.patch(
  '/orders/:id/status',
  validate(z.object({ body: updateOrderStatusSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { paymentStatus, cancellationReason } = req.body;

    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new NotFoundError('Order', req.params.id);
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        paymentStatus,
        cancellationReason:
          paymentStatus === 'CANCELLED' ? cancellationReason?.trim() ?? null : null,
      },
      include: {
        kiosk: { select: { name: true } },
        staff: { select: { staffCode: true, name: true } },
      },
    });

    res.json(ApiResponseBuilder.success(serializeOrder(order), requestId));
  }
);

import { registerAdminCrudRoutes } from './admin-crud.routes';
registerAdminCrudRoutes(adminRouter);
