import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, applyDiscountSchema, facialSearchSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { s3Service } from '../services/s3.service';
import { rekognitionService } from '../services/rekognition.service';
import { validate } from '../middleware/validate';
import { BusinessRuleError, NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import { resolveImageUrl } from '../utils/image-url';
import { v4 as uuidv4 } from 'uuid';

export const kioskRouter = Router();

const kioskCheckoutAssignmentSchema = z.object({
  imageId: z.string().min(1),
  imageUrl: z.string().min(1),
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

const selfieUploadUrlSchema = z.object({
  kioskId: z.string().uuid(),
  captureId: z.string().uuid().optional(),
});

const browsePhotosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

kioskRouter.post(
  '/selfie-upload-url',
  validate(z.object({ body: selfieUploadUrlSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { kioskId } = req.body;
    const captureId = req.body.captureId ?? uuidv4();

    const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk || kiosk.status !== 'ACTIVE') {
      throw new NotFoundError('Kiosk', kioskId);
    }

    const s3Key = s3Service.getSelfieKey(kioskId, captureId);
    const uploadUrl = await s3Service.getPresignedUploadUrl(s3Key, 'image/jpeg', 600);

    res.status(201).json(
      ApiResponseBuilder.success(
        {
          captureId,
          s3Key,
          uploadUrl,
          expiresIn: 600,
        },
        requestId
      )
    );
  }
);

kioskRouter.post(
  '/search-faces',
  validate(z.object({ body: facialSearchSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { selfieS3Key, maxResults, minConfidence } = req.body;
    const threshold = minConfidence ?? env.FACE_MATCH_THRESHOLD;

    const selfieExists = await s3Service.objectExists(selfieS3Key);
    if (!selfieExists) {
      throw new NotFoundError('Selfie image');
    }

    const faceMatches = await rekognitionService.searchFacesByImage(
      env.S3_BUCKET_NAME,
      selfieS3Key,
      maxResults,
      threshold
    );

    if (faceMatches.length === 0) {
      res.json(
        ApiResponseBuilder.success(
          {
            matches: [],
            matchCount: 0,
          },
          requestId
        )
      );
      return;
    }

    const faceIds = faceMatches.map((match) => match.faceId);
    const similarityByFaceId = new Map(faceMatches.map((match) => [match.faceId, match.similarity]));

    const indexedFaces = await prisma.photographerPhotoFace.findMany({
      where: { rekognitionFaceId: { in: faceIds } },
      include: {
        photographerPhoto: {
          select: {
            id: true,
            s3Key: true,
            filename: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    const now = new Date();
    const bestMatchByPhotoId = new Map<
      string,
      {
        photo: (typeof indexedFaces)[number]['photographerPhoto'];
        similarity: number;
      }
    >();

    for (const face of indexedFaces) {
      const photo = face.photographerPhoto;
      if (photo.expiresAt <= now) {
        continue;
      }

      const similarity = similarityByFaceId.get(face.rekognitionFaceId) ?? 0;
      const existing = bestMatchByPhotoId.get(photo.id);

      if (!existing || similarity > existing.similarity) {
        bestMatchByPhotoId.set(photo.id, { photo, similarity });
      }
    }

    const sortedMatches = Array.from(bestMatchByPhotoId.values()).sort(
      (a, b) => b.similarity - a.similarity
    );

    const matches = await Promise.all(
      sortedMatches.map(async ({ photo, similarity }) => ({
        id: photo.id,
        s3Key: photo.s3Key,
        imageUrl: await resolveImageUrl(photo.s3Key),
        filename: photo.filename,
        capturedAt: photo.createdAt.toISOString(),
        similarity: Math.round(similarity * 100) / 100,
      }))
    );

    res.json(
      ApiResponseBuilder.success(
        {
          matches,
          matchCount: matches.length,
        },
        requestId
      )
    );
  }
);

kioskRouter.get('/photos', async (req, res) => {
  const requestId = (req as any).id;
  const query = browsePhotosQuerySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;
  const now = new Date();

  const createdAtFilter: { gte?: Date; lt?: Date } = {};

  if (query.date) {
    const [year, month, day] = query.date.split('-').map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    createdAtFilter.gte = start;

    if (query.time) {
      const [hour, minute] = query.time.split(':').map(Number);
      const exact = new Date(year, month - 1, day, hour, minute, 0, 0);
      createdAtFilter.gte = exact;
      createdAtFilter.lt = new Date(exact.getTime() + 60_000);
    } else {
      createdAtFilter.lt = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    }
  }

  const where = {
    expiresAt: { gt: now },
    ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
  };

  const [total, photos] = await Promise.all([
    prisma.photographerPhoto.count({ where }),
    prisma.photographerPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
  ]);

  const items = await Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      s3Key: photo.s3Key,
      imageUrl: await resolveImageUrl(photo.s3Key),
      filename: photo.filename,
      capturedAt: photo.createdAt.toISOString(),
    }))
  );

  res.json(
    ApiResponseBuilder.success(
      {
        items,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      requestId
    )
  );
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

kioskRouter.get('/ai-effects', async (req, res) => {
  const requestId = (req as any).id;

  const [ultraObjects, allObjects] = await Promise.all([
    prisma.ultraObject.findMany({
      where: { status: 'ACTIVE' },
      include: {
        items: {
          include: {
            object: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.objectMaster.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { title: 'asc' },
    }),
  ]);

  const linkedObjectIds = new Set(
    ultraObjects.flatMap((uo) => uo.items.map((item) => item.objectId))
  );

  const resolvedUltraObjects = await Promise.all(
    ultraObjects.map(async (uo) => ({
      id: uo.id,
      title: uo.title,
      description: uo.description,
      imageUrl: await resolveImageUrl(uo.imageUrl),
      objects: await Promise.all(
        uo.items
          .filter((item) => item.object.status === 'ACTIVE')
          .map(async (item) => ({
            id: item.object.id,
            title: item.object.title,
            description: item.object.description,
            imageUrl: await resolveImageUrl(item.object.imageUrl),
          }))
      ),
    }))
  );

  const resolvedObjects = await Promise.all(
    allObjects
      .filter((obj) => !linkedObjectIds.has(obj.id))
      .map(async (obj) => ({
        id: obj.id,
        title: obj.title,
        description: obj.description,
        imageUrl: await resolveImageUrl(obj.imageUrl),
      }))
  );

  res.json(
    ApiResponseBuilder.success(
      {
        ultraObjects: resolvedUltraObjects,
        objects: resolvedObjects,
      },
      requestId
    )
  );
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
