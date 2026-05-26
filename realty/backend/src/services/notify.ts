import { config } from '../config.js';
import { query } from '../db.js';

// We send notifications to realtors via direct Bot API HTTP calls (no bot dep here).
// The bot service handles inbound messages & scheduled reminders.

const API = `https://api.telegram.org/bot${config.botToken}`;

async function tgSend(chatId: bigint | string, text: string, extra: Record<string, unknown> = {}) {
  if (!config.botToken) return; // not configured yet
  try {
    await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.toString(),
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...extra,
      }),
    });
  } catch (e) {
    console.error('[notify] tg send failed', e);
  }
}

export async function notifyRealtorsNewViewing(viewingId: number) {
  const r = await query<{
    address: string;
    price_value: string;
    price_currency: string;
    scheduled_at: Date;
    client_name: string;
    client_phone: string;
    client_username: string | null;
    note: string | null;
  }>(
    `SELECT p.address, p.price_value, p.price_currency, v.scheduled_at,
            v.client_name, v.client_phone, c.tg_username AS client_username, v.note
     FROM viewings v
     JOIN properties p ON p.id = v.property_id
     JOIN clients c ON c.id = v.client_id
     WHERE v.id = $1`,
    [viewingId]
  );
  if (r.rowCount === 0) return;
  const v = r.rows[0];
  const when = new Date(v.scheduled_at).toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const text =
    `🆕 <b>Нова заявка на перегляд</b>\n` +
    `📍 ${v.address}\n` +
    `💰 ${v.price_value} ${v.price_currency}\n` +
    `📅 ${when}\n` +
    `👤 ${v.client_name}\n` +
    `📞 ${v.client_phone}` +
    (v.client_username ? `\n✈️ @${v.client_username}` : '') +
    (v.note ? `\n💬 ${v.note}` : '');

  for (const tg of config.realtorTgIds) {
    await tgSend(tg, text);
  }
}

export async function notifyRealtorsCancelled(viewingId: number) {
  const r = await query<{
    address: string;
    scheduled_at: Date;
    client_name: string;
    client_phone: string;
  }>(
    `SELECT p.address, v.scheduled_at, v.client_name, v.client_phone
     FROM viewings v
     JOIN properties p ON p.id = v.property_id
     WHERE v.id = $1`,
    [viewingId]
  );
  if (r.rowCount === 0) return;
  const v = r.rows[0];
  const when = new Date(v.scheduled_at).toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const text =
    `❌ <b>Клієнт скасував перегляд</b>\n` +
    `📍 ${v.address}\n` +
    `📅 був на ${when}\n` +
    `👤 ${v.client_name}\n` +
    `📞 ${v.client_phone}`;

  for (const tg of config.realtorTgIds) {
    await tgSend(tg, text);
  }
}
