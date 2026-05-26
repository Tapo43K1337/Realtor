import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth, requireRealtor } from '../auth.js';
import { getLatestRate, convert } from '../services/nbu.js';

const Status = z.enum(['draft', 'active', 'reserved', 'sold_rented', 'withdrawn']);
const Type = z.enum(['apartment', 'house', 'commercial', 'land']);
const Deal = z.enum(['sale', 'rent']);
const Currency = z.enum(['USD', 'UAH']);

const upsertBody = z.object({
  status: Status.default('draft'),
  type: Type,
  deal: Deal,
  price_value: z.number().positive(),
  price_currency: Currency,
  price_value_secondary: z.number().positive().optional().nullable(),
  price_currency_secondary: Currency.optional().nullable(),

  address: z.string().min(1).max(300),
  district: z.string().max(100).optional().nullable(),
  complex_name: z.string().max(200).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),

  area_total: z.number().positive().optional().nullable(),
  area_living: z.number().positive().optional().nullable(),
  area_kitchen: z.number().positive().optional().nullable(),

  rooms: z.number().int().min(0).max(50).optional().nullable(),
  floor: z.number().int().min(-5).max(200).optional().nullable(),
  floors_total: z.number().int().min(0).max(200).optional().nullable(),
  year_built: z.number().int().min(1800).max(2100).optional().nullable(),

  building_type: z.string().max(80).optional().nullable(),
  condition: z.string().max(80).optional().nullable(),
  description: z.string().max(8000).optional().nullable(),

  heating_type: z.string().max(80).optional().nullable(),
  balcony: z.string().max(80).optional().nullable(),
  parking: z.string().max(80).optional().nullable(),
  furniture: z.string().max(80).optional().nullable(),
  appliances: z.string().max(200).optional().nullable(),
  kids_allowed: z.boolean().optional().nullable(),
  pets_allowed: z.boolean().optional().nullable(),
  deposit: z.number().nonnegative().optional().nullable(),
  utilities_included: z.boolean().optional().nullable(),
  bathroom: z.string().max(80).optional().nullable(),
  ceiling_height: z.number().positive().max(10).optional().nullable(),
  documents: z.string().max(120).optional().nullable(),
  plot_area: z.number().positive().optional().nullable(),

  features: z.array(z.string().max(60)).max(40).default([]),
});

const listQuery = z.object({
  q: z.string().optional(),
  type: Type.optional(),
  deal: Deal.optional(),
  district: z.string().optional(),
  building_type: z.string().optional(),
  condition: z.string().optional(),
  rooms_min: z.coerce.number().optional(),
  rooms_max: z.coerce.number().optional(),
  price_min: z.coerce.number().optional(),
  price_max: z.coerce.number().optional(),
  area_min: z.coerce.number().optional(),
  area_max: z.coerce.number().optional(),
  currency: Currency.default('USD'),
  status: Status.optional(),
  bbox: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(40),
  offset: z.coerce.number().min(0).default(0),
});

const ALL_COLUMNS = `
  p.id, p.status, p.type, p.deal,
  p.price_value, p.price_currency, p.price_value_secondary, p.price_currency_secondary,
  p.address, p.district, p.complex_name, p.lat, p.lng,
  p.area_total, p.area_living, p.area_kitchen,
  p.rooms, p.floor, p.floors_total, p.year_built,
  p.building_type, p.condition, p.description,
  p.heating_type, p.balcony, p.parking, p.furniture, p.appliances,
  p.kids_allowed, p.pets_allowed, p.deposit, p.utilities_included,
  p.bathroom, p.ceiling_height, p.documents, p.plot_area,
  p.features, p.created_at, p.updated_at, p.archived_at,
  p.created_by
`;

async function attachPhotosAndAgent(rows: any[]) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const photos = await query(
    `SELECT property_id, id, filename, thumb_filename, is_cover, sort_order
     FROM property_photos WHERE property_id = ANY($1::int[])
     ORDER BY is_cover DESC, sort_order ASC, id ASC`,
    [ids]
  );
  const byProp = new Map<number, any[]>();
  for (const ph of photos.rows) {
    const list = byProp.get(ph.property_id) ?? [];
    list.push({
      id: ph.id,
      url: `/uploads/properties/${ph.property_id}/${ph.filename}`,
      thumb_url: ph.thumb_filename
        ? `/uploads/properties/${ph.property_id}/${ph.thumb_filename}`
        : null,
      is_cover: ph.is_cover,
      sort_order: ph.sort_order,
    });
    byProp.set(ph.property_id, list);
  }

  const agentIds = [...new Set(rows.map((r) => r.created_by))];
  const agents = await query(
    `SELECT id, name, position, photo, phone, tg_username, experience_years, deals_count, bio, languages
     FROM agents WHERE id = ANY($1::int[])`,
    [agentIds]
  );
  const byAgent = new Map(agents.rows.map((a) => [a.id, a]));

  return rows.map((r) => ({
    ...r,
    photos: byProp.get(r.id) ?? [],
    agent: byAgent.get(r.created_by) ?? null,
  }));
}

export async function propertyRoutes(app: FastifyInstance) {
  // List (public for clients & realtors, but unauthenticated clients can also browse active)
  app.get('/', async (req) => {
    const q = listQuery.parse(req.query);

    const where: string[] = [];
    const args: unknown[] = [];
    const add = (sql: string, val: unknown) => {
      args.push(val);
      where.push(sql.replace('?', `$${args.length}`));
    };

    // By default only active for unauthenticated, all-except-draft for clients,
    // realtors can request any status (including drafts they own).
    let viewer: 'public' | 'client' | 'realtor' = 'public';
    let agentId: number | undefined;
    try {
      const payload: any = await req.jwtVerify();
      viewer = payload.role;
      agentId = payload.agentId;
    } catch { /* anonymous ok */ }

    if (q.status) {
      add('p.status = ?', q.status);
      if (q.status === 'draft' && viewer === 'realtor' && agentId) {
        add('p.created_by = ?', agentId);
      }
    } else {
      if (viewer === 'realtor') {
        // realtors see everything by default
      } else {
        add("p.status = ?", 'active');
      }
    }

    if (q.type) add('p.type = ?', q.type);
    if (q.deal) add('p.deal = ?', q.deal);
    if (q.district) add('p.district = ?', q.district);
    if (q.building_type) add('p.building_type = ?', q.building_type);
    if (q.condition) add('p.condition = ?', q.condition);
    if (q.rooms_min != null) add('p.rooms >= ?', q.rooms_min);
    if (q.rooms_max != null) add('p.rooms <= ?', q.rooms_max);
    if (q.area_min != null) add('p.area_total >= ?', q.area_min);
    if (q.area_max != null) add('p.area_total <= ?', q.area_max);

    // Price filter — convert input in `currency` to property currency on the fly using stored fields.
    // Simpler: compare against price in property's own currency (USD or UAH) — we use whichever matches `q.currency`.
    // If property currency matches, use price_value, else use price_value_secondary (if same currency).
    if (q.price_min != null || q.price_max != null) {
      // Build a normalized comparable price in q.currency using COALESCE
      const matchPrimary = 'p.price_currency = $' + (args.length + 1);
      args.push(q.currency);
      const matchSecondary = 'p.price_currency_secondary = $' + (args.length + 1);
      args.push(q.currency);
      const priceExpr = `CASE
        WHEN ${matchPrimary} THEN p.price_value
        WHEN ${matchSecondary} THEN p.price_value_secondary
        ELSE NULL END`;
      if (q.price_min != null) {
        args.push(q.price_min);
        where.push(`(${priceExpr}) >= $${args.length}`);
      }
      if (q.price_max != null) {
        args.push(q.price_max);
        where.push(`(${priceExpr}) <= $${args.length}`);
      }
    }

    if (q.q) {
      args.push(`%${q.q}%`);
      where.push(`(p.address ILIKE $${args.length} OR p.complex_name ILIKE $${args.length} OR p.district ILIKE $${args.length})`);
    }

    if (q.bbox) {
      const parts = q.bbox.split(',').map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        const [w, s, e, n] = parts;
        args.push(s); where.push(`p.lat >= $${args.length}`);
        args.push(n); where.push(`p.lat <= $${args.length}`);
        args.push(w); where.push(`p.lng >= $${args.length}`);
        args.push(e); where.push(`p.lng <= $${args.length}`);
      }
    }

    args.push(q.limit);
    const limitIdx = args.length;
    args.push(q.offset);
    const offsetIdx = args.length;

    const sql = `
      SELECT ${ALL_COLUMNS}
      FROM properties p
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;
    const r = await query(sql, args);
    const rows = await attachPhotosAndAgent(r.rows);

    // Augment with NBU rate so frontend can compute secondary price on demand
    const rate = await getLatestRate();
    return { items: rows, rate, total: rows.length };
  });

  // Public get-by-id
  app.get('/:id', async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.code(400).send({ error: 'bad_id' });

    const r = await query(`SELECT ${ALL_COLUMNS} FROM properties p WHERE p.id = $1`, [id]);
    if (r.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    // Track view (if authenticated as client)
    try {
      const payload: any = await req.jwtVerify();
      if (payload.role === 'client' && payload.clientId) {
        await query(
          `INSERT INTO property_views (property_id, client_id) VALUES ($1, $2)`,
          [id, payload.clientId]
        );
      }
    } catch { /* anonymous ok */ }

    const [row] = await attachPhotosAndAgent(r.rows);
    const rate = await getLatestRate();
    return { property: row, rate };
  });

  // Create (realtor only)
  app.post('/', { preHandler: requireRealtor }, async (req, reply) => {
    const parsed = upsertBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    const d = parsed.data;

    // Auto-compute secondary price if not provided
    let priceSec = d.price_value_secondary ?? null;
    let curSec = d.price_currency_secondary ?? null;
    if (!priceSec || !curSec) {
      const rate = await getLatestRate();
      curSec = d.price_currency === 'USD' ? 'UAH' : 'USD';
      priceSec = Math.round(convert(d.price_value, d.price_currency, curSec, rate) * 100) / 100;
    }

    const r = await query<{ id: number }>(
      `INSERT INTO properties (
        status, type, deal, price_value, price_currency, price_value_secondary, price_currency_secondary,
        address, district, complex_name, lat, lng,
        area_total, area_living, area_kitchen,
        rooms, floor, floors_total, year_built,
        building_type, condition, description,
        heating_type, balcony, parking, furniture, appliances,
        kids_allowed, pets_allowed, deposit, utilities_included,
        bathroom, ceiling_height, documents, plot_area,
        features, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,
        $13,$14,$15,
        $16,$17,$18,$19,
        $20,$21,$22,
        $23,$24,$25,$26,$27,
        $28,$29,$30,$31,
        $32,$33,$34,$35,
        $36,$37
      ) RETURNING id`,
      [
        d.status, d.type, d.deal, d.price_value, d.price_currency, priceSec, curSec,
        d.address, d.district, d.complex_name, d.lat, d.lng,
        d.area_total, d.area_living, d.area_kitchen,
        d.rooms, d.floor, d.floors_total, d.year_built,
        d.building_type, d.condition, d.description,
        d.heating_type, d.balcony, d.parking, d.furniture, d.appliances,
        d.kids_allowed, d.pets_allowed, d.deposit, d.utilities_included,
        d.bathroom, d.ceiling_height, d.documents, d.plot_area,
        d.features, req.user.agentId,
      ]
    );
    return { id: r.rows[0].id };
  });

  // Update
  app.put('/:id', { preHandler: requireRealtor }, async (req: any, reply) => {
    const id = Number(req.params.id);
    const parsed = upsertBody.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    const d = parsed.data;

    const fields = Object.entries(d).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return reply.code(400).send({ error: 'empty_update' });

    // Recompute secondary price if primary changed but secondary not provided
    if ((d.price_value !== undefined || d.price_currency !== undefined) &&
        d.price_value_secondary === undefined && d.price_currency_secondary === undefined) {
      const existing = await query(
        'SELECT price_value, price_currency FROM properties WHERE id = $1', [id]
      );
      if (existing.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
      const pv = d.price_value ?? Number(existing.rows[0].price_value);
      const pc = (d.price_currency ?? existing.rows[0].price_currency) as 'USD' | 'UAH';
      const rate = await getLatestRate();
      const sc = pc === 'USD' ? 'UAH' : 'USD';
      const sv = Math.round(convert(pv, pc, sc, rate) * 100) / 100;
      fields.push(['price_value_secondary', sv], ['price_currency_secondary', sc]);
    }

    const sets: string[] = [];
    const args: unknown[] = [];
    for (const [k, v] of fields) {
      args.push(v);
      sets.push(`${k} = $${args.length}`);
    }
    sets.push(`updated_at = now()`);
    args.push(id);

    await query(
      `UPDATE properties SET ${sets.join(', ')} WHERE id = $${args.length}`,
      args
    );
    return { ok: true };
  });

  // Delete (or archive)
  app.delete('/:id', { preHandler: requireRealtor }, async (req: any) => {
    const id = Number(req.params.id);
    await query('DELETE FROM properties WHERE id = $1', [id]);
    return { ok: true };
  });

  // Close (sold/rented or withdrawn) — quick action
  app.post('/:id/close', { preHandler: requireRealtor }, async (req: any, reply) => {
    const id = Number(req.params.id);
    const body = z.object({ reason: z.enum(['sold_rented', 'withdrawn']) }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid_body' });
    await query(
      `UPDATE properties SET status = $2, archived_at = now(), updated_at = now() WHERE id = $1`,
      [id, body.data.reason]
    );
    return { ok: true };
  });

  // Share — record event
  app.post('/:id/share', async (req: any) => {
    const id = Number(req.params.id);
    let clientId: number | null = null;
    try {
      const payload: any = await req.jwtVerify();
      if (payload.role === 'client') clientId = payload.clientId;
    } catch {}
    await query(
      'INSERT INTO shares (property_id, client_id) VALUES ($1, $2)',
      [id, clientId]
    );
    return { ok: true };
  });
}
