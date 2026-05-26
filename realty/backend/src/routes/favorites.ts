import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

export async function favoriteRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (req, reply) => {
    if (req.user.role !== 'client') return reply.code(403).send({ error: 'realtor_no_favorites' });
    const r = await query(
      `SELECT p.id, p.address, p.district, p.type, p.deal, p.price_value, p.price_currency,
              p.price_value_secondary, p.price_currency_secondary, p.area_total, p.rooms,
              p.floor, p.floors_total, f.created_at AS saved_at,
              (SELECT filename FROM property_photos WHERE property_id = p.id AND is_cover = TRUE LIMIT 1) AS cover_filename
       FROM favorites f
       JOIN properties p ON p.id = f.property_id
       WHERE f.client_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.clientId]
    );
    const items = r.rows.map((row: any) => ({
      ...row,
      cover_url: row.cover_filename
        ? `/uploads/properties/${row.id}/${row.cover_filename}`
        : null,
    }));
    return { items };
  });

  app.post('/:propertyId', { preHandler: requireAuth }, async (req: any, reply) => {
    if (req.user.role !== 'client') return reply.code(403).send({ error: 'realtor_no_favorites' });
    const id = Number(req.params.propertyId);
    await query(
      `INSERT INTO favorites (client_id, property_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.clientId, id]
    );
    return { ok: true };
  });

  app.delete('/:propertyId', { preHandler: requireAuth }, async (req: any, reply) => {
    if (req.user.role !== 'client') return reply.code(403).send({ error: 'realtor_no_favorites' });
    const id = Number(req.params.propertyId);
    await query(
      'DELETE FROM favorites WHERE client_id = $1 AND property_id = $2',
      [req.user.clientId, id]
    );
    return { ok: true };
  });
}
