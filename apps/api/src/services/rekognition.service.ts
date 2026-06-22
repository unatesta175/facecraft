import {
  RekognitionClient,
  CreateCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  ListCollectionsCommand,
} from '@aws-sdk/client-rekognition';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface IndexedFace {
  faceId: string;
  boundingBox: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
  confidence: number;
  imageId?: string;
}

export interface FaceMatch {
  faceId: string;
  similarity: number;
}

export class RekognitionService {
  private client: RekognitionClient;
  private collectionId: string;

  constructor() {
    this.client = new RekognitionClient({
      region: env.AWS_REGION,
      credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
    this.collectionId = env.REKOGNITION_COLLECTION_ID;
  }

  async ensureCollectionExists(): Promise<void> {
    try {
      const listCommand = new ListCollectionsCommand({});
      const response = await this.client.send(listCommand);

      if (response.CollectionIds?.includes(this.collectionId)) {
        logger.info({ collectionId: this.collectionId }, 'Rekognition collection exists');
        return;
      }

      const createCommand = new CreateCollectionCommand({
        CollectionId: this.collectionId,
      });

      await this.client.send(createCommand);
      logger.info({ collectionId: this.collectionId }, 'Created Rekognition collection');
    } catch (error) {
      logger.error({ error, collectionId: this.collectionId }, 'Failed to ensure collection exists');
      throw error;
    }
  }

  async indexFaces(s3Bucket: string, s3Key: string, externalImageId: string): Promise<IndexedFace[]> {
    const command = new IndexFacesCommand({
      CollectionId: this.collectionId,
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      },
      ExternalImageId: externalImageId,
      DetectionAttributes: ['ALL'],
      MaxFaces: 15,
      QualityFilter: 'AUTO',
    });

    try {
      const response = await this.client.send(command);

      const indexedFaces: IndexedFace[] = (response.FaceRecords || []).map((record) => ({
        faceId: record.Face!.FaceId!,
        boundingBox: {
          width: record.Face!.BoundingBox!.Width!,
          height: record.Face!.BoundingBox!.Height!,
          left: record.Face!.BoundingBox!.Left!,
          top: record.Face!.BoundingBox!.Top!,
        },
        confidence: record.Face!.Confidence!,
        imageId: record.Face!.ExternalImageId,
      }));

      logger.info(
        { s3Key, faceCount: indexedFaces.length, externalImageId },
        'Indexed faces in Rekognition'
      );

      return indexedFaces;
    } catch (error) {
      logger.error({ error, s3Key }, 'Failed to index faces');
      throw error;
    }
  }

  async searchFacesByImage(
    s3Bucket: string,
    s3Key: string,
    maxFaces: number = 20,
    faceMatchThreshold: number = 80
  ): Promise<FaceMatch[]> {
    const command = new SearchFacesByImageCommand({
      CollectionId: this.collectionId,
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      },
      MaxFaces: maxFaces,
      FaceMatchThreshold: faceMatchThreshold,
    });

    try {
      const response = await this.client.send(command);

      const matches: FaceMatch[] = (response.FaceMatches || []).map((match) => ({
        faceId: match.Face!.FaceId!,
        similarity: match.Similarity!,
      }));

      logger.info(
        { s3Key, matchCount: matches.length, threshold: faceMatchThreshold },
        'Searched faces by image'
      );

      return matches;
    } catch (error: any) {
      if (error.name === 'InvalidParameterException' && error.message.includes('no faces')) {
        logger.warn({ s3Key }, 'No faces detected in search image');
        return [];
      }
      logger.error({ error, s3Key }, 'Failed to search faces by image');
      throw error;
    }
  }

  async deleteFaces(faceIds: string[]): Promise<void> {
    if (faceIds.length === 0) {
      return;
    }

    const command = new DeleteFacesCommand({
      CollectionId: this.collectionId,
      FaceIds: faceIds,
    });

    try {
      await this.client.send(command);
      logger.info({ faceIds, count: faceIds.length }, 'Deleted faces from Rekognition');
    } catch (error) {
      logger.error({ error, faceIds }, 'Failed to delete faces');
      throw error;
    }
  }
}

export const rekognitionService = new RekognitionService();
