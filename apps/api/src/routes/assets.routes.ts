import { Router, type Request, type Response } from 'express';
import { pipeline } from 'stream/promises';
import { z } from 'zod';
import { ApiResponseBuilder } from '@facecraft/contracts';
import { env } from '../config/env';
import { s3Service } from '../services/s3.service';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

const catalogCategories = ['products', 'frames', 'objects', 'ultra-objects', 'combos', 'profiles'] as const;

const uploadUrlSchema = z.object({
  category: z.enum(catalogCategories),
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif|avif)$/),
});

export const assetsRouter = Router();

async function serveBrandImage(
  res: import('express').Response,
  s3Key: string,
  notFoundMessage: string
) {
  const metadata = await s3Service.getObjectMetadata(s3Key);
  if (!metadata) {
    res.status(404).json({ success: false, error: { message: notFoundMessage } });
    return;
  }

  const buffer = await s3Service.getObjectBuffer(s3Key);
  res.setHeader('Content-Type', metadata.contentType ?? 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.send(buffer);
}

/** Public brand assets (logo is not sensitive; bucket stays private). */
assetsRouter.get('/branding/logo', async (_req, res) => {
  const s3Key =
    env.BRAND_LOGO_S3_KEY ??
    process.env.BRAND_LOGO_S3_KEY ??
    'branding/facecraft-brand-logo.png';

  await serveBrandImage(res, s3Key, 'Brand logo not found in S3');
});

assetsRouter.get('/branding/admin-logo', async (_req, res) => {
  const s3Key =
    env.BRAND_ADMIN_LOGO_S3_KEY ??
    process.env.BRAND_ADMIN_LOGO_S3_KEY ??
    'branding/facecraft-admin-logo.png';

  await serveBrandImage(res, s3Key, 'Admin sidebar logo not found in S3');
});

assetsRouter.get('/branding/spinner', async (_req, res) => {
  const s3Key =
    env.BRAND_SPINNER_S3_KEY ??
    process.env.BRAND_SPINNER_S3_KEY ??
    'branding/facecraft-spinner-emblem.png';

  await serveBrandImage(res, s3Key, 'Brand spinner emblem not found in S3');
});

assetsRouter.get('/kiosk/home-video', async (req, res) => {
  const s3Key =
    env.KIOSK_HOME_VIDEO_S3_KEY ??
    process.env.KIOSK_HOME_VIDEO_S3_KEY ??
    'kiosk/home/kiosk-home-hero.mp4';

  await serveKioskVideo(req, res, s3Key);
});

async function serveKioskVideo(req: Request, res: Response, s3Key: string) {
  const metadata = await s3Service.getObjectMetadata(s3Key);
  if (!metadata) {
    res.status(404).json({ success: false, error: { message: 'Kiosk home video not found in S3' } });
    return;
  }

  const total = metadata.contentLength;
  const contentType = metadata.contentType ?? 'video/mp4';
  const rangeHeader = req.headers.range;

  try {
    if (rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match) {
        res.status(416).end();
        return;
      }

      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : total - 1;

      if (start >= total || end >= total) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        return;
      }

      const streamResult = await s3Service.getObjectStream(s3Key, { start, end });
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', streamResult.contentLength);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      await pipeline(streamResult.body, res);
      return;
    }

    const streamResult = await s3Service.getObjectStream(s3Key);
    res.status(200);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', total);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    await pipeline(streamResult.body, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: { message: 'Failed to stream kiosk home video' } });
    }
  }
}

assetsRouter.use(authenticateUser);

assetsRouter.post(
  '/upload-url',
  validate(z.object({ body: uploadUrlSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { category, filename, contentType } = req.body;

    const s3Key = s3Service.getCatalogKey(category, filename);
    const uploadUrl = await s3Service.getPresignedUploadUrl(s3Key, contentType, 600);

    res.status(201).json(
      ApiResponseBuilder.success(
        {
          s3Key,
          uploadUrl,
          expiresIn: 600,
        },
        requestId
      )
    );
  }
);
