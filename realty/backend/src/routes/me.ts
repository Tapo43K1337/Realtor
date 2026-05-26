import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { query } from '../db.js';

const profileBody = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(5).max(40),
});

export async function meRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (req) => {
    if (req.user.role === 'realtor') {
      const r = await query(
        `SELECT id, name, position, tg_username, phone, photo,
                experience_years, deals_count, bio, languages
         FROM agents WHERE id = $1`,
        [req.user.agentId]
      );
      return { role: 'realtor', profile: r.rows[0] };
    }
    const r = await query(
      'SELECT id, name, phone, first_name, last_name, tg_username FROM clients WHERE id = $1',
      [req.user.clientId]
    );
    return { role: 'client', profile: r.rows[0] };
  });

  // Client saves their lead profile (name + phone) once, reused for viewings
  app.put('/profile', { preHandler: requireAuth }, async (req, reply) => {
    if (req.user.role !== 'client') return reply.code(403).send({ error: 'realtor_uses_agent_profile' });
    const parsed = profileBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' });
    await query(
      'UPDATE clients SET name = $2, phone = $3 WHERE id = $1',
      [req.user.clientId, parsed.data.name, parsed.data.phone]
    );
    return { ok: true };
  });
}
