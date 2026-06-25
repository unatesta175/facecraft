import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder } from '@facecraft/contracts';
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
