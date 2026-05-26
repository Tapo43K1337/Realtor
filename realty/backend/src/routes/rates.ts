import type { FastifyInstance } from 'fastify';
import { getLatestRate } from '../services/nbu.js';

export async function ratesRoutes(app: FastifyInstance) {
  app.get('/usd', async () => {
    const rate = await getLatestRate();
    return { usd_uah: rate, fetched_at: new Date().toISOString() };
  });
}
