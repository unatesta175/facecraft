import { FaceIndexStatus } from '@prisma/client';
import { prisma } from './database.service';
import { rekognitionService } from './rekognition.service';
import { s3Service } from './s3.service';
import { env } from '../config/env';
import { logger } from '../config/logger';

export async function indexPhotographerPhoto(photoId: string): Promise<void> {
  const photo = await prisma.photographerPhoto.findUnique({
    where: { id: photoId },
    include: { faces: true },
  });

  if (!photo) {
    return;
  }

  const exists = await s3Service.objectExists(photo.s3Key);
  if (!exists) {
    await prisma.photographerPhoto.update({
      where: { id: photo.id },
      data: { faceIndexStatus: FaceIndexStatus.FAILED },
    });
    return;
  }

  if (photo.faces.length > 0) {
    await rekognitionService.deleteFaces(photo.faces.map((face) => face.rekognitionFaceId)).catch(() => undefined);
    await prisma.photographerPhotoFace.deleteMany({ where: { photographerPhotoId: photo.id } });
  }

  try {
    const indexedFaces = await rekognitionService.indexFaces(
      env.S3_BUCKET_NAME,
      photo.s3Key,
      photo.id
    );

    if (indexedFaces.length === 0) {
      await prisma.photographerPhoto.update({
        where: { id: photo.id },
        data: { faceIndexStatus: FaceIndexStatus.NO_FACE },
      });
      return;
    }

    await prisma.$transaction([
      prisma.photographerPhotoFace.createMany({
        data: indexedFaces.map((face) => ({
          photographerPhotoId: photo.id,
          rekognitionFaceId: face.faceId,
          confidence: face.confidence,
        })),
      }),
      prisma.photographerPhoto.update({
        where: { id: photo.id },
        data: { faceIndexStatus: FaceIndexStatus.INDEXED },
      }),
    ]);

    logger.info({ photoId: photo.id, faceCount: indexedFaces.length }, 'Photographer photo indexed');
  } catch (error) {
    logger.error({ error, photoId: photo.id }, 'Failed to index photographer photo');
    await prisma.photographerPhoto.update({
      where: { id: photo.id },
      data: { faceIndexStatus: FaceIndexStatus.FAILED },
    });
  }
}

export async function deletePhotographerPhotoFaces(photoId: string): Promise<void> {
  const faces = await prisma.photographerPhotoFace.findMany({
    where: { photographerPhotoId: photoId },
  });

  if (faces.length > 0) {
    await rekognitionService.deleteFaces(faces.map((face) => face.rekognitionFaceId)).catch(() => undefined);
    await prisma.photographerPhotoFace.deleteMany({ where: { photographerPhotoId: photoId } });
  }
}
