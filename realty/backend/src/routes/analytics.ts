import type { FastifyInstance } from 'fastify';
import { query } from '../db.js';
import { requireRealtor } from '../auth.js';

export async function analyticsRoutes(app: FastifyInstance) {
  // Realtor dashboard summary
  app.get('/dashboard', { preHandler: requireRealtor }, async () => {
    const [active, sold30, leadsWeek, leadsMonth, viewsWeek, viewsMonth, savesWeek, totalClients, topProp] = await Promise.all([
      query<{ c: string }>(`SELECT COUNT(*)::text c FROM properties WHERE status = 'active'`),
      query<{ c: string }>(
        `SELECT COUNT(*)::text c FROM properties
         WHERE status = 'sold_rented' AND archived_at >= now() - INTERVAL '30 days'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text c FROM viewings WHERE created_at >= now() - INTERVAL '7 days'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text c FROM viewings WHERE created_at >= now() - INTERVAL '30 days'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text c FROM property_views WHERE viewed_at >= now() - INTERVAL '7 days'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text c FROM property_views WHERE viewed_at >= now() - INTERVAL '30 days'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text c FROM favorites WHERE created_at >= now() - INTERVAL '7 days'`
      ),
      query<{ c: string }>(`SELECT COUNT(*)::text c FROM clients`),
      query(
        `SELECT p.id, p.address, p.price_value, p.price_currency,
                COUNT(v.id)::int AS views_week
         FROM properties p
         LEFT JOIN property_views v ON v.property_id = p.id AND v.viewed_at >= now() - INTERVAL '7 days'
         WHERE p.status = 'active'
         GROUP BY p.id
         ORDER BY views_week DESC
         LIMIT 1`
      ),
    ]);

    return {
      active: Number(active.rows[0].c),
      sold_or_rented_30d: Number(sold30.rows[0].c),
      leads_7d: Number(leadsWeek.rows[0].c),
      leads_30d: Number(leadsMonth.rows[0].c),
      views_7d: Number(viewsWeek.rows[0].c),
      views_30d: Number(viewsMonth.rows[0].c),
      saves_7d: Number(savesWeek.rows[0].c),
      total_clients: Number(totalClients.rows[0].c),
      top_property: topProp.rows[0] ?? null,
    };
  });

  // Per-property analytics
  app.get('/properties/:id', { preHandler: requireRealtor }, async (req: any) => {
    const id = Number(req.params.id);
    const [views, saves, viewings] = await Promise.all([
      query<{ c: string }>(
        'SELECT COUNT(*)::text c FROM property_views WHERE property_id = $1', [id]
      ),
      query<{ c: string }>(
        'SELECT COUNT(*)::text c FROM favorites WHERE property_id = $1', [id]
      ),
      query<{ c: string }>(
        'SELECT COUNT(*)::text c FROM viewings WHERE property_id = $1', [id]
      ),
    ]);
    return {
      views: Number(views.rows[0].c),
      saves: Number(saves.rows[0].c),
      viewings: Number(viewings.rows[0].c),
    };
  });
}
