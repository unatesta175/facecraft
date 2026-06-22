import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, facialSearchSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { s3Service } from '../services/s3.service';
import { rekognitionService } from '../services/rekognition.service';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export const kioskRouter = Router();

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

    res.json(
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
