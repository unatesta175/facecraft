import { Router } from 'express';
import { ApiResponseBuilder } from '@facecraft/contracts';
import { DatabaseService } from '../services/database.service';
import { env } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  const requestId = (req as any).id;

  res.json(
    ApiResponseBuilder.success(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: env.NODE_ENV,
      },
      requestId
    )
  );
});

healthRouter.get('/ready', async (req, res) => {
  const requestId = (req as any).id;

  const dbHealthy = await DatabaseService.healthCheck();

  const isReady = dbHealthy;

  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json(
    ApiResponseBuilder.success(
      {
        status: isReady ? 'ready' : 'not_ready',
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
        },
        timestamp: new Date().toISOString(),
      },
      requestId
    )
  );
});
