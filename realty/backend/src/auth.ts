import crypto from 'node:crypto';
import { config, isRealtor } from './config.js';
import { query } from './db.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

/** Validate Telegram WebApp initData (HMAC-SHA256). */
export function verifyInitData(initData: string, botToken: string): TgUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheck = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (calc !== hash) return null;

  // Optional auth_date freshness (24h)
  const authDate = Number(params.get('auth_date'));
  if (authDate && Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as TgUser;
  } catch {
    return null;
  }
}

export type SessionUser = {
  role: 'realtor' | 'client';
  tgId: bigint;
  agentId?: number;
  clientId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
};

/** Upsert the current user (agent or client) and return session payload. */
export async function ensureUser(tg: TgUser): Promise<SessionUser> {
  const tgId = BigInt(tg.id);

  if (isRealtor(tgId)) {
    const existing = await query<{ id: number; name: string }>(
      'SELECT id, name FROM agents WHERE tg_id = $1',
      [tgId.toString()]
    );
    let agentId: number;
    if (existing.rowCount === 0) {
      const insert = await query<{ id: number }>(
        `INSERT INTO agents (tg_id, name, tg_username)
         VALUES ($1, $2, $3) RETURNING id`,
        [
          tgId.toString(),
          [tg.first_name, tg.last_name].filter(Boolean).join(' ') || 'Ріелтор',
          tg.username ?? null,
        ]
      );
      agentId = insert.rows[0].id;
    } else {
      agentId = existing.rows[0].id;
      await query(
        `UPDATE agents SET tg_username = COALESCE($2, tg_username), updated_at = now()
         WHERE id = $1`,
        [agentId, tg.username ?? null]
      );
    }
    return {
      role: 'realtor',
      tgId,
      agentId,
      firstName: tg.first_name,
      lastName: tg.last_name,
      username: tg.username,
    };
  }

  // Client
  const existing = await query<{ id: number }>(
    'SELECT id FROM clients WHERE tg_id = $1',
    [tgId.toString()]
  );
  let clientId: number;
  if (existing.rowCount === 0) {
    const insert = await query<{ id: number }>(
      `INSERT INTO clients (tg_id, first_name, last_name, tg_username)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [tgId.toString(), tg.first_name ?? null, tg.last_name ?? null, tg.username ?? null]
    );
    clientId = insert.rows[0].id;
  } else {
    clientId = existing.rows[0].id;
    await query(
      `UPDATE clients SET
         first_name = COALESCE($2, first_name),
         last_name = COALESCE($3, last_name),
         tg_username = COALESCE($4, tg_username),
         last_active_at = now()
       WHERE id = $1`,
      [
        clientId,
        tg.first_name ?? null,
        tg.last_name ?? null,
        tg.username ?? null,
      ]
    );
  }
  return {
    role: 'client',
    tgId,
    clientId,
    firstName: tg.first_name,
    lastName: tg.last_name,
    username: tg.username,
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser;
  }
}

/** Pre-handler: require JWT auth, populate request.user. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await req.jwtVerify<{
      role: 'realtor' | 'client';
      tgId: string;
      agentId?: number;
      clientId?: number;
    }>();
    req.user = {
      role: payload.role,
      tgId: BigInt(payload.tgId),
      agentId: payload.agentId,
      clientId: payload.clientId,
    };
  } catch {
    return reply.code(401).send({ error: 'unauthorized' });
  }
}

export async function requireRealtor(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (reply.sent) return;
  if (req.user.role !== 'realtor') {
    return reply.code(403).send({ error: 'forbidden' });
  }
}
