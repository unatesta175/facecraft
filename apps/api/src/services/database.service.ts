import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

export class DatabaseService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: [
          { level: 'warn', emit: 'event' },
          { level: 'error', emit: 'event' },
        ],
      });

      DatabaseService.instance.$on('warn' as never, (e: any) => {
        logger.warn(e, 'Prisma warning');
      });

      DatabaseService.instance.$on('error' as never, (e: any) => {
        logger.error(e, 'Prisma error');
      });
    }

    return DatabaseService.instance;
  }

  static async connect(): Promise<void> {
    try {
      const prisma = DatabaseService.getInstance();
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database');
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseService.getInstance();
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect from database');
      throw error;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const prisma = DatabaseService.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return false;
    }
  }
}

export const prisma = DatabaseService.getInstance();
