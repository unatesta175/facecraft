import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { s3Service } from '../services/s3.service';
import { authenticateUser, requirePhotographer } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';
import { resolveImageUrl } from '../utils/image-url';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

const uploadPhotoSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const photographerRouter = Router();

photographerRouter.use(authenticateUser, requirePhotographer);

function formatSessionDuration(first: Date, last: Date): string {
  const durationMs = last.getTime() - first.getTime();
  if (durationMs < 60_000) return '< 1 min';

  const totalMinutes = Math.round(durationMs / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

function getDateFilterRange(filter: string): Date | null {
  const now = new Date();
  if (filter === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (filter === 'month') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return null;
}

photographerRouter.get('/photos', async (req, res) => {
  const requestId = (req as any).id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = { photographerId: req.user!.id };

  const [total, photos] = await Promise.all([
    prisma.photographerPhoto.count({ where }),
    prisma.photographerPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const items = await Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      filename: photo.filename,
      s3Key: photo.s3Key,
      imageUrl: await resolveImageUrl(photo.s3Key),
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      createdAt: photo.createdAt.toISOString(),
      expiresAt: photo.expiresAt.toISOString(),
    }))
  );

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

photographerRouter.get('/history', async (req, res) => {
  const requestId = (req as any).id;
  const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
  const fromDate = getDateFilterRange(filter);

  const photos = await prisma.photographerPhoto.findMany({
    where: {
      photographerId: req.user!.id,
      ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const grouped = new Map<string, typeof photos>();
  for (const photo of photos) {
    const dateKey = photo.createdAt.toISOString().slice(0, 10);
    const existing = grouped.get(dateKey) ?? [];
    existing.push(photo);
    grouped.set(dateKey, existing);
  }

  const items = await Promise.all(
    Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(async ([date, dayPhotos]) => {
        const sorted = [...dayPhotos].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const first = sorted[0].createdAt;
        const last = sorted[sorted.length - 1].createdAt;

        const resolvedPhotos = await Promise.all(
          sorted.map(async (photo) => ({
            id: photo.id,
            filename: photo.filename,
            imageUrl: await resolveImageUrl(photo.s3Key),
            createdAt: photo.createdAt.toISOString(),
            fileSize: photo.fileSize,
          }))
        );

        return {
          id: date,
          date,
          photoCount: sorted.length,
          sessionDuration: formatSessionDuration(first, last),
          firstUploadAt: first.toISOString(),
          lastUploadAt: last.toISOString(),
          thumbnails: resolvedPhotos.slice(0, 3).map((photo) => ({
            id: photo.id,
            imageUrl: photo.imageUrl,
            filename: photo.filename,
          })),
          photos: resolvedPhotos,
        };
      })
  );

  res.json(
    ApiResponseBuilder.success(
      {
        items,
        totalPhotos: photos.length,
        totalDays: items.length,
      },
      requestId
    )
  );
});

photographerRouter.get('/stats', async (req, res) => {
  const requestId = (req as any).id;
  const photographerId = req.user!.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalLifetimeUploads, todayUploads] = await Promise.all([
    prisma.photographerPhoto.count({ where: { photographerId } }),
    prisma.photographerPhoto.count({
      where: {
        photographerId,
        createdAt: { gte: todayStart },
      },
    }),
  ]);

  res.json(
    ApiResponseBuilder.success(
      {
        totalLifetimeUploads,
        todayUploads,
      },
      requestId
    )
  );
});

photographerRouter.post(
  '/upload-url',
  validate(z.object({ body: uploadPhotoSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const user = req.user!;
    const photoId = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.PHOTO_RETENTION_DAYS);

    const s3Key = s3Service.getPhotographerUploadKey(user.id, photoId, req.body.filename);
    const uploadUrl = await s3Service.getPresignedUploadUrl(s3Key, req.body.contentType, 600);

    const photo = await prisma.photographerPhoto.create({
      data: {
        id: photoId,
        photographerId: user.id,
        s3Key,
        filename: req.body.filename,
        contentType: req.body.contentType,
        width: req.body.width,
        height: req.body.height,
        expiresAt,
      },
    });

    res.status(201).json(
      ApiResponseBuilder.success(
        {
          photo: {
            id: photo.id,
            s3Key: photo.s3Key,
            filename: photo.filename,
          },
          uploadUrl,
          expiresIn: 600,
        },
        requestId
      )
    );
  }
);

photographerRouter.post('/photos/:id/confirm-upload', async (req, res) => {
  const requestId = (req as any).id;

  const photo = await prisma.photographerPhoto.findFirst({
    where: {
      id: req.params.id,
      photographerId: req.user!.id,
    },
  });

  if (!photo) {
    throw new NotFoundError('Photo', req.params.id);
  }

  const exists = await s3Service.objectExists(photo.s3Key);
  if (!exists) {
    throw new NotFoundError('Photo file in S3');
  }

  const head = await s3Service.getObjectMetadata(photo.s3Key);

  await prisma.photographerPhoto.update({
    where: { id: photo.id },
    data: {
      fileSize: head?.contentLength ?? photo.fileSize,
    },
  });

  res.json(
    ApiResponseBuilder.success(
      {
        message: 'Upload confirmed',
        photoId: photo.id,
      },
      requestId
    )
  );
});

photographerRouter.delete('/photos/:id', async (req, res) => {
  const requestId = (req as any).id;

  const photo = await prisma.photographerPhoto.findFirst({
    where: {
      id: req.params.id,
      photographerId: req.user!.id,
    },
  });

  if (!photo) {
    throw new NotFoundError('Photo', req.params.id);
  }

  await s3Service.deleteObject(photo.s3Key).catch(() => undefined);
  await prisma.photographerPhoto.delete({ where: { id: photo.id } });

  res.json(
    ApiResponseBuilder.success(
      {
        message: 'Photo deleted',
      },
      requestId
    )
  );
});
