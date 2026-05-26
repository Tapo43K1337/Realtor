import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import cron from 'node-cron';
import { config } from './config.js';
import { fetchAndStoreUsdRate } from './services/nbu.js';
import { authRoutes } from './routes/auth.js';
import { propertyRoutes } from './routes/properties.js';
import { photoRoutes } from './routes/photos.js';
import { agentRoutes } from './routes/agents.js';
import { viewingRoutes } from './routes/viewings.js';
import { favoriteRoutes } from './routes/favorites.js';
import { analyticsRoutes } from './routes/analytics.js';
import { ratesRoutes } from './routes/rates.js';
import { meRoutes } from './routes/me.js';

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
  bodyLimit: 50 * 1024 * 1024,
});

await app.register(cors, { origin: true, credentials: true });
await app.register(jwt, { secret: config.jwtSecret, sign: { expiresIn: `${config.jwtTtl}s` } });
await app.register(multipart, {
  limits: { fileSize: config.photoMaxSizeMb * 1024 * 1024 },
});
await app.register(fastifyStatic, {
  root: config.uploadsDir,
  prefix: '/uploads/',
  decorateReply: false,
});

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(meRoutes, { prefix: '/api/me' });
await app.register(propertyRoutes, { prefix: '/api/properties' });
await app.register(photoRoutes, { prefix: '/api/properties' });
await app.register(agentRoutes, { prefix: '/api/agents' });
await app.register(viewingRoutes, { prefix: '/api/viewings' });
await app.register(favoriteRoutes, { prefix: '/api/favorites' });
await app.register(analyticsRoutes, { prefix: '/api/analytics' });
await app.register(ratesRoutes, { prefix: '/api/rates' });

// Cron: NBU rate at 09:00 Europe/Kyiv every day
cron.schedule(
  '0 9 * * *',
  () => {
    fetchAndStoreUsdRate()
      .then((r) => app.log.info({ rate: r }, 'NBU rate updated'))
      .catch((e) => app.log.error(e, 'NBU rate update failed'));
  },
  { timezone: 'Europe/Kyiv' }
);

// Try to seed rate on startup (non-fatal if it fails)
fetchAndStoreUsdRate().catch((e) => app.log.warn(e, 'initial NBU fetch failed'));

await app.listen({ port: config.port, host: '0.0.0.0' });
app.log.info(`API listening on :${config.port}`);
