import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireRealtor } from '../auth.js';
import { processAndStoreAgentPhoto } from '../services/photos.js';

const updateBody = z.object({
  name: z.string().min(1).max(120).optional(),
  position: z.string().max(120).optional().nullable(),
  experience_years: z.number().int().min(0).max(80).optional(),
  deals_count: z.number().int().min(0).max(10000).optional(),
  bio: z.string().max(2000).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  tg_username: z.string().max(60).optional().nullable(),
  languages: z.array(z.string().max(40)).max(10).optional(),
  photo: z.string().max(300).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function agentRoutes(app: FastifyInstance) {
  // Public: list active agents for client-facing info
  app.get('/', async () => {
    const r = await query(
      `SELECT id, name, position, experience_years, deals_count, bio,
              phone, tg_username, languages, photo
       FROM agents WHERE is_active = TRUE ORDER BY id`
    );
    return { items: r.rows };
  });

  app.get('/:id', async (req: any, reply) => {
    const r = await query(
      `SELECT id, name, position, experience_years, deals_count, bio,
              phone, tg_username, languages, photo
       FROM agents WHERE id = $1 AND is_active = TRUE`,
      [Number(req.params.id)]
    );
    if (r.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return r.rows[0];
  });

  // Realtor: update own profile
  app.put('/me', { preHandler: requireRealtor }, async (req, reply) => {
    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' });
    const fields = Object.entries(parsed.data);
    if (fields.length === 0) return reply.code(400).send({ error: 'empty_update' });
    const sets: string[] = [];
    const args: unknown[] = [];
    for (const [k, v] of fields) {
      args.push(v);
      sets.push(`${k} = $${args.length}`);
    }
    sets.push(`updated_at = now()`);
    args.push(req.user.agentId);
    await query(`UPDATE agents SET ${sets.join(', ')} WHERE id = $${args.length}`, args);
    return { ok: true };
  });

  // Realtor: upload own avatar
  app.post('/me/photo', { preHandler: requireRealtor }, async (req: any, reply) => {
    const agentId = req.user.agentId;
    if (!agentId) return reply.code(400).send({ error: 'no_agent' });
    const parts = req.parts();
    let url: string | null = null;
    for await (const part of parts) {
      if (part.type !== 'file') continue;
      const buf = await part.toBuffer();
      url = await processAndStoreAgentPhoto(agentId, buf);
      break; // single photo only
    }
    if (!url) return reply.code(400).send({ error: 'no_file' });
    await query(`UPDATE agents SET photo = $1, updated_at = now() WHERE id = $2`, [url, agentId]);
    return { photo: url };
  });
}
