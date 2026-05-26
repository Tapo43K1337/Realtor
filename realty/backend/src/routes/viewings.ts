import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth, requireRealtor } from '../auth.js';
import { notifyRealtorsNewViewing, notifyRealtorsCancelled } from '../services/notify.js';

const MIN_HOURS_AHEAD = 2;

const createBody = z.object({
  property_id: z.number().int().positive(),
  // scheduled_at is now optional — the form no longer asks for a preferred time,
  // the realtor calls the client back to arrange it. Kept here for callers that
  // still want to pass it (e.g. a future "preferred time" UI).
  scheduled_at: z.string().datetime().optional().nullable(),
  name: z.string().min(1).max(120),
  phone: z.string().min(5).max(40),
  note: z.string().max(500).optional().nullable(),
  remember_profile: z.boolean().default(true),
});

export async function viewingRoutes(app: FastifyInstance) {
  // Client creates a viewing request
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    if (req.user.role !== 'client') return reply.code(403).send({ error: 'realtor_cannot_book' });
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    const d = parsed.data;

    let scheduledIso: string | null = null;
    if (d.scheduled_at) {
      const at = new Date(d.scheduled_at);
      const hours = (at.getTime() - Date.now()) / 36e5;
      if (hours < MIN_HOURS_AHEAD) {
        return reply.code(400).send({ error: 'too_soon', min_hours: MIN_HOURS_AHEAD });
      }
      scheduledIso = at.toISOString();
    }

    // Property must be active
    const prop = await query<{ id: number; created_by: number; status: string }>(
      'SELECT id, created_by, status FROM properties WHERE id = $1',
      [d.property_id]
    );
    if (prop.rowCount === 0) return reply.code(404).send({ error: 'property_not_found' });
    if (prop.rows[0].status !== 'active' && prop.rows[0].status !== 'reserved') {
      return reply.code(400).send({ error: 'property_not_available' });
    }

    // Save profile if requested
    if (d.remember_profile) {
      await query(
        'UPDATE clients SET name = $2, phone = $3 WHERE id = $1',
        [req.user.clientId, d.name, d.phone]
      );
    }

    const r = await query<{ id: number }>(
      `INSERT INTO viewings (property_id, client_id, agent_id, scheduled_at, client_name, client_phone, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [d.property_id, req.user.clientId, prop.rows[0].created_by, scheduledIso, d.name, d.phone, d.note ?? null]
    );

    // Fire-and-forget notification to realtors
    notifyRealtorsNewViewing(r.rows[0].id).catch((e) => app.log.error(e, 'notify failed'));

    return { id: r.rows[0].id };
  });

  // Client lists their own viewings
  app.get('/mine', { preHandler: requireAuth }, async (req, reply) => {
    if (req.user.role !== 'client') return reply.code(403).send({ error: 'use_realtor_endpoint' });
    const r = await query(
      `SELECT v.id, v.scheduled_at, v.status, v.client_name, v.client_phone, v.note,
              p.id AS property_id, p.address, p.district,
              p.price_value, p.price_currency
       FROM viewings v
       JOIN properties p ON p.id = v.property_id
       WHERE v.client_id = $1
       ORDER BY v.scheduled_at DESC`,
      [req.user.clientId]
    );
    return { items: r.rows };
  });

  // Realtor: list all viewings (with filters)
  app.get('/', { preHandler: requireRealtor }, async (req: any) => {
    const status = String(req.query?.status ?? '');
    const args: unknown[] = [];
    let where = '';
    if (['pending', 'cancelled_by_client', 'done'].includes(status)) {
      args.push(status);
      where = `WHERE v.status = $${args.length}`;
    }
    const r = await query(
      `SELECT v.id, v.scheduled_at, v.status, v.client_name, v.client_phone, v.note,
              v.created_at, v.cancelled_at,
              p.id AS property_id, p.address, p.district,
              p.price_value, p.price_currency,
              c.tg_username AS client_username
       FROM viewings v
       JOIN properties p ON p.id = v.property_id
       JOIN clients c ON c.id = v.client_id
       ${where}
       ORDER BY v.scheduled_at DESC`,
      args
    );
    return { items: r.rows };
  });

  // Client cancels own
  app.post('/:id/cancel', { preHandler: requireAuth }, async (req: any, reply) => {
    const id = Number(req.params.id);
    if (req.user.role === 'client') {
      const r = await query(
        `UPDATE viewings SET status = 'cancelled_by_client', cancelled_at = now()
         WHERE id = $1 AND client_id = $2 AND status = 'pending' RETURNING id`,
        [id, req.user.clientId]
      );
      if (r.rowCount === 0) return reply.code(404).send({ error: 'not_found_or_not_pending' });
      notifyRealtorsCancelled(id).catch(() => {});
      return { ok: true };
    }
    // Realtor cancel — still notify? we use same status to keep it simple
    const r = await query(
      `UPDATE viewings SET status = 'cancelled_by_client', cancelled_at = now()
       WHERE id = $1 RETURNING id`, [id]
    );
    return { ok: r.rowCount ? true : false };
  });

  // Realtor marks done
  app.post('/:id/done', { preHandler: requireRealtor }, async (req: any) => {
    const id = Number(req.params.id);
    await query(`UPDATE viewings SET status = 'done' WHERE id = $1`, [id]);
    return { ok: true };
  });
}
