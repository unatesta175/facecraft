import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { requestIdMiddleware } from './middleware/request-id';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { photoRouter } from './routes/photo.routes';
import { eventRouter } from './routes/event.routes';
import { kioskRouter } from './routes/kiosk.routes';
import { productRouter } from './routes/product.routes';
import { packageRouter } from './routes/package.routes';
import { cartRouter } from './routes/cart.routes';
import { orderRouter } from './routes/order.routes';
import { discountRouter } from './routes/discount.routes';
import { adminRouter } from './routes/admin.routes';
import { assetsRouter } from './routes/assets.routes';
import { photographerRouter } from './routes/photographer.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
      },
      customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
      },
    })
  );

  app.use('/api/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/photos', photoRouter);
  app.use('/api/v1/events', eventRouter);
  app.use('/api/v1/kiosks', kioskRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/packages', packageRouter);
  app.use('/api/v1/carts', cartRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/discounts', discountRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/assets', assetsRouter);
  app.use('/api/v1/photographer', photographerRouter);

  app.use(errorHandler);

  return app;
}
