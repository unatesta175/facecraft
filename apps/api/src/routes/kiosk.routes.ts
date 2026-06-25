import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, applyDiscountSchema, facialSearchSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { s3Service } from '../services/s3.service';
import { rekognitionService } from '../services/rekognition.service';
import { validate } from '../middleware/validate';
import { BusinessRuleError, NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import { resolveImageUrl } from '../utils/image-url';

export const kioskRouter = Router();

const kioskCheckoutAssignmentSchema = z.object({
  imageId: z.string().min(1),
  imageUrl: z.string().url(),
  filename: z.string().min(1),
});

const kioskCheckoutProductSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  photoCount: z.number().int().positive(),
  quantity: z.number().int().positive(),
  assignments: z.array(kioskCheckoutAssignmentSchema),
});

const kioskCheckoutItemSchema = z.object({
  packageId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  products: z.array(kioskCheckoutProductSchema).min(1),
});

const kioskCreateOrderSchema = z.object({
  kioskId: z.string().uuid(),
  paymentType: z.enum(['QR', 'CARD', 'CASH']),
  staffCode: z.string().optional(),
  discountCode: z.string().optional(),
  items: z.array(kioskCheckoutItemSchema).min(1, 'Cart must contain at least one package'),
});

kioskRouter.get('/frames', async (req, res) => {
  const requestId = (req as any).id;

  const frames = await prisma.frame.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  });

  const resolved = await Promise.all(
    frames.map(async (frame) => ({
      id: frame.id,
      name: frame.name,
      imageUrl: await resolveImageUrl(frame.imageUrl),
    }))
  );

  res.json(ApiResponseBuilder.success(resolved, requestId));
});

kioskRouter.get('/combos', async (req, res) => {
  const requestId = (req as any).id;

  const combos = await prisma.comboProduct.findMany({
    where: { status: 'ACTIVE' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              photoLimit: true,
              imageUrl: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const resolved = await Promise.all(
    combos.map(async (combo) => {
      const products = await Promise.all(
        combo.items
          .filter((item) => item.product.status === 'ACTIVE')
          .map(async (item) => ({
            id: item.product.id,
            name: item.product.name,
            photoCount: item.quantity * Math.max(item.product.photoLimit, 1),
            quantity: item.quantity,
            imageUrl: await resolveImageUrl(item.product.imageUrl),
          }))
      );

      return {
        id: combo.id,
        name: combo.name,
        description: combo.description,
        price: Number(combo.price),
        imageUrl: await resolveImageUrl(combo.thumbnailUrl),
        products,
      };
    })
  );

  res.json(
    ApiResponseBuilder.success(
      resolved.filter((combo) => combo.products.length > 0),
      requestId
    )
  );
});

kioskRouter.post(
  '/discounts/validate',
  validate(z.object({ body: applyDiscountSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const code = req.body.code.trim().toUpperCase();

    const discount = await prisma.discount.findUnique({
      where: { code },
    });

    if (!discount) {
      throw new NotFoundError('Discount code', code);
    }

    res.json(
      ApiResponseBuilder.success(
        {
          code: discount.code,
          amount: Number(discount.amount),
          description: discount.description,
        },
        requestId
      )
    );
  }
);

function generateOrderCode(): string {
  return `FC${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
}

async function resolveStaffUserId(
  staffCode: string | undefined,
  paymentType: 'QR' | 'CARD' | 'CASH'
): Promise<string> {
  if (staffCode?.trim()) {
    const staff = await prisma.user.findFirst({
      where: {
        staffCode: staffCode.trim(),
        status: 'ACTIVE',
      },
    });

    if (!staff) {
      throw new BusinessRuleError('Invalid staff ID');
    }

    return staff.id;
  }

  if (paymentType === 'CARD') {
    const fallbackStaff = await prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        role: { in: ['STAFF', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!fallbackStaff) {
      throw new BusinessRuleError('No staff available to process order');
    }

    return fallbackStaff.id;
  }

  throw new BusinessRuleError('Staff ID is required for this payment method');
}

kioskRouter.post(
  '/orders',
  validate(z.object({ body: kioskCreateOrderSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { kioskId, paymentType, staffCode, discountCode, items } = req.body;

    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk || kiosk.status !== 'ACTIVE') {
      throw new NotFoundError('Kiosk', kioskId);
    }

    const staffId = await resolveStaffUserId(staffCode, paymentType);

    const comboIds = items.map((item: { packageId: string }) => item.packageId);
    const combos = await prisma.comboProduct.findMany({
      where: {
        id: { in: comboIds },
        status: 'ACTIVE',
      },
    });

    if (combos.length !== items.length) {
      throw new BusinessRuleError('One or more packages are no longer available');
    }

    const subtotal = items.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
    let discountId: string | null = null;
    let discountAmount = 0;

    if (discountCode?.trim()) {
      const discount = await prisma.discount.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      });

      if (discount) {
        discountAmount = Math.min(Number(discount.amount), subtotal);
        discountId = discount.id;
      }
    }

    const finalPrice = Math.max(0, subtotal - discountAmount);
    const now = new Date();
    const orderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const orderTime = now.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const photoExpiresAt = new Date();
    photoExpiresAt.setDate(photoExpiresAt.getDate() + env.PHOTO_RETENTION_DAYS);

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode(),
        kioskId,
        staffId,
        discountId,
        date: orderDate,
        time: orderTime,
        paymentType,
        price: finalPrice,
        paymentStatus: 'COMPLETED',
        orderCombos: {
          create: items.map(
            (
              item: {
                packageId: string;
                name: string;
                description?: string | null;
                price: number;
                products: Array<{
                  productId: string;
                  assignments: Array<{
                    imageUrl: string;
                    filename: string;
                  }>;
                }>;
              },
              index: number
            ) => ({
              comboProductId: item.packageId,
              comboCode: `#${Date.now()}${index}`,
              priceSnapshot: item.price,
              descriptionSnapshot: item.description ?? item.name,
              orderPhotos: {
                create: item.products.flatMap((product) =>
                  product.assignments.map((assignment) => ({
                    productId: product.productId,
                    imageUrl: assignment.imageUrl,
                    folderLabel: assignment.filename,
                    expiresAt: photoExpiresAt,
                  }))
                ),
              },
            })
          ),
        },
      },
      include: {
        kiosk: { select: { name: true } },
        staff: { select: { staffCode: true, name: true } },
        orderCombos: {
          include: {
            comboProduct: { select: { name: true } },
            orderPhotos: true,
          },
        },
      },
    });

    res.status(201).json(
      ApiResponseBuilder.success(
        {
          id: order.id,
          orderCode: order.orderCode,
          kioskName: order.kiosk.name,
          staffCode: order.staff.staffCode,
          date: orderDate.toISOString().slice(0, 10),
          time: order.time,
          paymentType: order.paymentType,
          paymentStatus: order.paymentStatus,
          subtotal,
          discount: discountAmount,
          price: Number(order.price),
          items: items.map(
            (item: {
              name: string;
              description?: string | null;
              price: number;
              products: Array<{
                name: string;
                photoCount: number;
                quantity: number;
                assignments: Array<{ filename: string }>;
              }>;
            }) => ({
              name: item.name,
              description: item.description ?? null,
              price: item.price,
              products: item.products.map((product) => ({
                name: product.name,
                photoCount: product.photoCount,
                quantity: product.quantity,
                assignments: product.assignments.map((assignment) => ({
                  filename: assignment.filename,
                })),
              })),
            })
          ),
        },
        requestId
      )
    );
  }
);

kioskRouter.post('/sessions', async (req, res) => {
  const requestId = (req as any).id;
  const { kioskId } = req.body;

  const kiosk = await prisma.kiosk.findUnique({
    where: { id: kioskId },
  });

  if (!kiosk || !kiosk.isActive) {
    throw new NotFoundError('Kiosk', kioskId);
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + env.KIOSK_SESSION_TTL_MINUTES);

  const session = await prisma.kioskSession.create({
    data: {
      kioskId,
      sessionToken: uuidv4(),
      expiresAt,
    },
  });

  res.status(201).json(ApiResponseBuilder.success(session, requestId));
});

kioskRouter.get('/sessions/:sessionToken', async (req, res) => {
  const requestId = (req as any).id;

  const session = await prisma.kioskSession.findUnique({
    where: { sessionToken: req.params.sessionToken },
    include: {
      kiosk: true,
    },
  });

  if (!session) {
    throw new NotFoundError('Kiosk session', req.params.sessionToken);
  }

  if (session.expiresAt < new Date()) {
    throw new NotFoundError('Kiosk session expired');
  }

  res.json(ApiResponseBuilder.success(session, requestId));
});

kioskRouter.post('/selfie-upload-url', async (req, res) => {
  const requestId = (req as any).id;
  const { sessionToken } = req.body;

  const session = await prisma.kioskSession.findUnique({
    where: { sessionToken },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new NotFoundError('Valid kiosk session');
  }

  const captureId = uuidv4();
  const s3Key = s3Service.getSelfieKey(session.id, captureId);

  const uploadUrl = await s3Service.getPresignedUploadUrl(s3Key, 'image/jpeg', 300);

  res.json(
    ApiResponseBuilder.success(
      {
        captureId,
        s3Key,
        uploadUrl,
        expiresIn: 300,
      },
      requestId
    )
  );
});

kioskRouter.post(
  '/search-faces',
  validate(z.object({ body: facialSearchSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { selfieS3Key, eventId, maxResults, minConfidence } = req.body;

    const faceMatches = await rekognitionService.searchFacesByImage(
      env.S3_BUCKET_NAME,
      selfieS3Key,
      maxResults,
      minConfidence
    );

    if (faceMatches.length === 0) {
      await s3Service.deleteObject(selfieS3Key);

      return res.json(
        ApiResponseBuilder.success(
          {
            matches: [],
            total: 0,
          },
          requestId
        )
      );
    }

    const faceIds = faceMatches.map((m) => m.faceId);

    const photoFaces = await prisma.photoFace.findMany({
      where: {
        rekognitionFaceId: {
          in: faceIds,
        },
        photo: {
          expiresAt: {
            gt: new Date(),
          },
          isProcessed: true,
          ...(eventId ? { eventId } : {}),
        },
      },
      include: {
        photo: {
          include: {
            event: true,
            variants: true,
          },
        },
      },
    });

    const photoMap = new Map<string, { photo: any; confidence: number }>();

    for (const face of photoFaces) {
      const match = faceMatches.find((m) => m.faceId === face.rekognitionFaceId);
      if (match && !photoMap.has(face.photoId)) {
        photoMap.set(face.photoId, {
          photo: face.photo,
          confidence: match.similarity,
        });
      }
    }

    const matches = Array.from(photoMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);

    const matchesWithUrls = await Promise.all(
      matches.map(async (m) => ({
        photo: {
          ...m.photo,
          thumbnailUrl: await s3Service.getPresignedDownloadUrl(
            s3Service.getThumbnailKey(m.photo.photographerId, m.photo.eventId, m.photo.id, 'medium')
          ),
        },
        confidence: m.confidence,
      }))
    );

    await s3Service.deleteObject(selfieS3Key);

    return res.json(
      ApiResponseBuilder.success(
        {
          matches: matchesWithUrls,
          total: matchesWithUrls.length,
        },
        requestId
      )
    );
  }
);
