import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
    this.bucketName = env.S3_BUCKET_NAME;
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = env.SIGNED_URL_TTL_SECONDS
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });
      logger.debug({ key, contentType, expiresIn }, 'Generated presigned upload URL');
      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate presigned upload URL');
      throw error;
    }
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = env.SIGNED_URL_TTL_SECONDS
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });
      logger.debug({ key, expiresIn }, 'Generated presigned download URL');
      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate presigned download URL');
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
      logger.info({ key }, 'Deleted S3 object');
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete S3 object');
      throw error;
    }
  }

  async objectExists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      logger.error({ error, key }, 'Failed to check if S3 object exists');
      throw error;
    }
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const result = await this.client.send(command);
    const stream = result.Body;

    if (!stream) {
      throw new Error(`Empty S3 object: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async getObjectMetadata(key: string): Promise<{ contentLength: number; contentType?: string } | null> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const result = await this.client.send(command);
      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType,
      };
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return null;
      }
      logger.error({ error, key }, 'Failed to get S3 object metadata');
      throw error;
    }
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join('/');
  }

  getPhotoKey(photographerId: string, eventId: string, photoId: string, filename: string): string {
    const ext = filename.split('.').pop();
    return this.generateKey('originals', photographerId, eventId, photoId, `original.${ext}`);
  }

  getPhotographerUploadKey(photographerId: string, photoId: string, filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    return this.generateKey('originals', photographerId, photoId, `original.${ext}`);
  }

  getCatalogKey(category: string, filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const id = uuidv4();
    return this.generateKey('catalog', category, `${id}.${ext}`);
  }

  getThumbnailKey(
    photographerId: string,
    eventId: string,
    photoId: string,
    size: 'small' | 'medium'
  ): string {
    return this.generateKey('thumbnails', photographerId, eventId, photoId, `${size}.webp`);
  }

  getVariantKey(photographerId: string, eventId: string, photoId: string, variantId: string): string {
    return this.generateKey('variants', photographerId, eventId, photoId, `${variantId}.webp`);
  }

  getSelfieKey(kioskSessionId: string, captureId: string): string {
    return this.generateKey('temporary', 'selfies', kioskSessionId, `${captureId}.jpg`);
  }

  getReceiptKey(orderId: string): string {
    return this.generateKey('receipts', orderId, 'receipt.pdf');
  }
}

export const s3Service = new S3Service();
