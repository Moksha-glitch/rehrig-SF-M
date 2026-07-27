import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import accountsRoutes from './routes/accounts.js';
import contactsRoutes from './routes/contacts.js';
import routesRoutes from './routes/routes.js';
import recordsRoutes from './routes/records.js';
import configRoutes from './routes/config.js';
import notificationsRoutes from './routes/notifications.js';
import onboardingRoutes, { draftsRouter, uploadsRouter } from './routes/onboarding.js';
import searchRoutes from './routes/search.js';
import importsRoutes from './routes/imports.js';
import miscRoutes from './routes/misc.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'vision-api' }));

  const api = express.Router();
  api.use('/auth', authRoutes);
  api.use(miscRoutes);
  api.use('/accounts', accountsRoutes);
  api.use('/contacts', contactsRoutes);
  api.use('/routes', routesRoutes);
  api.use('/records', recordsRoutes);
  api.use('/config', configRoutes);
  api.use('/notifications', notificationsRoutes);
  api.use('/onboarding', onboardingRoutes);
  api.use('/drafts', draftsRouter);
  api.use('/uploads', uploadsRouter);
  api.use('/search', searchRoutes);
  api.use('/imports', importsRoutes);

  app.use('/api/v1', api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
