import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { DatabaseService } from './services/database.service';
import { rekognitionService } from './services/rekognition.service';

async function start() {
  try {
    await DatabaseService.connect();

    await rekognitionService.ensureCollectionExists();

    const app = createApp();

    const server = app.listen(env.API_PORT, () => {
      logger.info(
        {
          port: env.API_PORT,
          env: env.NODE_ENV,
          url: env.API_URL,
        },
        'Server started successfully'
      );
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');

      server.close(async () => {
        logger.info('HTTP server closed');

        await DatabaseService.disconnect();

        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Promise Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
