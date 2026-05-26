import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { ensureUser, verifyInitData } from '../auth.js';

const loginBody = z.object({ initData: z.string().min(1) });

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' });

    const tg = verifyInitData(parsed.data.initData, config.botToken);
    if (!tg) return reply.code(401).send({ error: 'bad_init_data' });

    const session = await ensureUser(tg);
    const token = await reply.jwtSign({
      role: session.role,
      tgId: session.tgId.toString(),
      agentId: session.agentId,
      clientId: session.clientId,
    });

    return {
      token,
      user: {
        role: session.role,
        tgId: session.tgId.toString(),
        agentId: session.agentId,
        clientId: session.clientId,
        firstName: session.firstName,
        lastName: session.lastName,
        username: session.username,
      },
    };
  });
}
