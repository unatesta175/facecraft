import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, searchPhotosSchema, uploadPhotoSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { s3Service } from '../services/s3.service';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export const photoRouter = Router();

photoRouter.get(
  '/search',
  validate(z.object({ query: searchPhotosSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { eventId, dateFrom, dateTo, cursor, limit } = req.query;

    const where: any = {
      expiresAt: {
        gt: new Date(),
      },
      isProcessed: true,
    };

    if (eventId) {
      where.eventId = eventId as string;
    }

    if (dateFrom || dateTo) {
      where.capturedAt = {};
      if (dateFrom) where.capturedAt.gte = new Date(dateFrom as string);
      if (dateTo) where.capturedAt.lte = new Date(dateTo as string);
    }

    if (cursor) {
      where.id = {
        lt: cursor as string,
      };
    }

    const limitNum = parseInt(limit as string) || 20;

    const photos = await prisma.photo.findMany({
      where,
      take: limitNum + 1,
      orderBy: {
        capturedAt: 'desc',
      },
      include: {
        event: true,
        variants: true,
      },
    });

    const hasMore = photos.length > limitNum;
    const items = hasMore ? photos.slice(0, -1) : photos;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    const itemsWithUrls = await Promise.all(
      items.map(async (photo) => ({
        ...photo,
        thumbnailUrl: await s3Service.getPresignedDownloadUrl(
          s3Service.getThumbnailKey(photo.photographerId, photo.eventId, photo.id, 'medium')
        ),
      }))
    );

    res.json(
      ApiResponseBuilder.success(
        {
          items: itemsWithUrls,
          nextCursor,
          hasMore,
        },
        requestId
      )
    );
  }
);

photoRouter.post(
  '/upload-url',
  authenticateUser,
  requireRoles('PHOTOGRAPHER', 'ADMIN'),
  validate(z.object({ body: uploadPhotoSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const user = req.user!;

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundError('Photographer profile');
    }

    const photoId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.PHOTO_RETENTION_DAYS);

    const s3Key = s3Service.getPhotoKey(
      profile.id,
      req.body.eventId,
      photoId,
      req.body.filename
    );

    const uploadUrl = await s3Service.getPresignedUploadUrl(s3Key, req.body.contentType, 600);

    const photo = await prisma.photo.create({
      data: {
        id: photoId,
        photographerId: profile.id,
        eventId: req.body.eventId,
        s3Key,
        filename: req.body.filename,
        contentType: req.body.contentType,
        fileSize: 0,
        width: req.body.width,
        height: req.body.height,
        expiresAt,
      },
    });

    await prisma.job.create({
      data: {
        type: 'THUMBNAIL_GENERATION',
        payload: {
          photoId: photo.id,
          s3Key: photo.s3Key,
        },
      },
    });

    res.status(201).json(
      ApiResponseBuilder.success(
        {
          photo,
          uploadUrl,
          expiresIn: 600,
        },
        requestId
      )
    );
  }
);

photoRouter.post('/:id/confirm-upload', authenticateUser, async (req, res) => {
  const requestId = (req as any).id;

  const photo = await prisma.photo.findUnique({
    where: { id: req.params.id },
  });

  if (!photo) {
    throw new NotFoundError('Photo', req.params.id);
  }

  const exists = await s3Service.objectExists(photo.s3Key);

  if (!exists) {
    throw new NotFoundError('Photo file in S3');
  }

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      isProcessed: false,
    },
  });

  await prisma.job.create({
    data: {
      type: 'FACE_INDEXING',
      payload: {
        photoId: photo.id,
        s3Key: photo.s3Key,
      },
    },
  });

  res.json(
    ApiResponseBuilder.success(
      {
        message: 'Upload confirmed, processing started',
      },
      requestId
    )
  );
});

photoRouter.get('/:id', async (req, res) => {
  const requestId = (req as any).id;

  const photo = await prisma.photo.findUnique({
    where: { id: req.params.id },
    include: {
      event: true,
      variants: true,
      faces: true,
    },
  });

  if (!photo) {
    throw new NotFoundError('Photo', req.params.id);
  }

  const photoWithUrl = {
    ...photo,
    url: await s3Service.getPresignedDownloadUrl(photo.s3Key),
    thumbnailUrl: await s3Service.getPresignedDownloadUrl(
      s3Service.getThumbnailKey(photo.photographerId, photo.eventId, photo.id, 'medium')
    ),
  };

  res.json(ApiResponseBuilder.success(photoWithUrl, requestId));
});
