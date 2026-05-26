import { Bot, InlineKeyboard } from 'grammy';
import cron from 'node-cron';
import pg from 'pg';

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const APP_URL = process.env.APP_URL ?? '';
const REALTOR_TG_IDS = (process.env.REALTOR_TG_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error('[bot] BOT_TOKEN missing — exiting. Set it in .env and restart.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const bot = new Bot(BOT_TOKEN);

function isRealtor(tgId: number | string): boolean {
  return REALTOR_TG_IDS.includes(String(tgId));
}

function fmtDate(d: Date): string {
  return d.toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * If the Telegram user is in REALTOR_TG_IDS, make sure they have a row in the `agents` table
 * (and remove any stale `clients` row). This is the source of truth read by the API server,
 * so the role works even if the API container's env didn't reload.
 */
async function ensureAgentRecord(tgId: number, firstName?: string, lastName?: string, username?: string) {
  if (!isRealtor(tgId)) return;
  const tg = String(tgId);
  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM agents WHERE tg_id = $1', [tg]
  );
  if (existing.rowCount === 0) {
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'Ріелтор';
    await pool.query(
      `INSERT INTO agents (tg_id, name, tg_username) VALUES ($1, $2, $3)`,
      [tg, name, username ?? null]
    );
    // Migrate: if same tg_id was previously stored as a client, remove that row so the user
    // is unambiguously a realtor.
    await pool.query(`DELETE FROM clients WHERE tg_id = $1`, [tg]);
  } else {
    await pool.query(
      `UPDATE agents SET tg_username = COALESCE($2, tg_username), updated_at = now() WHERE id = $1`,
      [existing.rows[0].id, username ?? null]
    );
  }
}

// ─── Commands ───
bot.command('start', async (ctx) => {
  // Make sure realtor accounts are bootstrapped in the database.
  await ensureAgentRecord(ctx.from!.id, ctx.from!.first_name, ctx.from!.last_name, ctx.from!.username).catch((e) => {
    console.error('[bot] ensureAgentRecord failed', e);
  });

  // Support deep-link to a specific property: /start property_42
  const payload = ctx.match;
  if (payload && payload.startsWith('property_') && APP_URL) {
    const id = payload.replace('property_', '');
    const kb = new InlineKeyboard().webApp(
      "📂 Відкрити об'єкт",
      `${APP_URL}/?start=property_${id}`
    );
    await ctx.reply("Відкрийте об'єкт у застосунку:", { reply_markup: kb });
    return;
  }

  const greeting = isRealtor(ctx.from!.id)
    ? "Вітаємо! Ви ввійшли як ріелтор. Відкрийте кабінет:"
    : "Вітаємо в Realty! Знайдіть свою нерухомість у Дніпрі:";

  const kb = APP_URL
    ? new InlineKeyboard().webApp("🏠 Відкрити застосунок", APP_URL)
    : undefined;
  await ctx.reply(greeting, { reply_markup: kb });
});

bot.command('help', (ctx) =>
  ctx.reply(
    "Команди:\n/start — головне меню\n/help — ця довідка\n\nЯкщо у вас питання — натисніть кнопку «Написати в Telegram» у застосунку, і ріелтор відповість."
  )
);

// ─── Reminders cron ───
async function sendReminders() {
  // Day-before: 24h ahead window
  const day = await pool.query(
    `SELECT v.id, v.scheduled_at, c.tg_id, p.address
       FROM viewings v
       JOIN clients c ON c.id = v.client_id
       JOIN properties p ON p.id = v.property_id
      WHERE v.status = 'pending'
        AND v.reminder_day_sent = FALSE
        AND v.scheduled_at BETWEEN now() + INTERVAL '23 hours'
                               AND now() + INTERVAL '25 hours'`
  );
  for (const row of day.rows) {
    try {
      await bot.api.sendMessage(
        String(row.tg_id),
        `⏰ Нагадування: завтра у вас перегляд об'єкту\n📍 ${row.address}\n📅 ${fmtDate(new Date(row.scheduled_at))}`
      );
      await pool.query('UPDATE viewings SET reminder_day_sent = TRUE WHERE id = $1', [row.id]);
    } catch (e) {
      console.error('[bot] day reminder failed', e);
    }
  }

  // Hour-before
  const hour = await pool.query(
    `SELECT v.id, v.scheduled_at, c.tg_id, p.address
       FROM viewings v
       JOIN clients c ON c.id = v.client_id
       JOIN properties p ON p.id = v.property_id
      WHERE v.status = 'pending'
        AND v.reminder_hour_sent = FALSE
        AND v.scheduled_at BETWEEN now() + INTERVAL '50 minutes'
                               AND now() + INTERVAL '70 minutes'`
  );
  for (const row of hour.rows) {
    try {
      await bot.api.sendMessage(
        String(row.tg_id),
        `⏰ Через годину перегляд:\n📍 ${row.address}\n📅 ${fmtDate(new Date(row.scheduled_at))}`
      );
      await pool.query('UPDATE viewings SET reminder_hour_sent = TRUE WHERE id = $1', [row.id]);
    } catch (e) {
      console.error('[bot] hour reminder failed', e);
    }
  }
}

// Run every 10 minutes
cron.schedule('*/10 * * * *', () => {
  sendReminders().catch((e) => console.error('[bot] reminders cron failed', e));
});

// ─── Daily summary for realtors (21:00 Kyiv) ───
async function sendDailySummary() {
  const r = await pool.query<{ leads: string; views: string; saves: string }>(
    `SELECT
       (SELECT COUNT(*) FROM viewings WHERE created_at::date = CURRENT_DATE) AS leads,
       (SELECT COUNT(*) FROM property_views WHERE viewed_at::date = CURRENT_DATE) AS views,
       (SELECT COUNT(*) FROM favorites WHERE created_at::date = CURRENT_DATE) AS saves`
  );
  const { leads, views, saves } = r.rows[0];
  const text =
    `📊 <b>Підсумок дня</b>\n` +
    `🆕 Нових заявок: ${leads}\n` +
    `👁 Переглядів об'єктів: ${views}\n` +
    `❤️ Додано в обране: ${saves}`;
  for (const id of REALTOR_TG_IDS) {
    try {
      await bot.api.sendMessage(id, text, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('[bot] daily summary failed', e);
    }
  }
}
cron.schedule('0 21 * * *', () => sendDailySummary().catch((e) => console.error(e)), {
  timezone: 'Europe/Kyiv',
});

// ─── Weekly summary for realtors (Mon 09:00 Kyiv) ───
async function sendWeeklySummary() {
  const r = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM viewings WHERE created_at >= now() - INTERVAL '7 days') AS leads,
       (SELECT COUNT(*) FROM property_views WHERE viewed_at >= now() - INTERVAL '7 days') AS views,
       (SELECT COUNT(*) FROM favorites WHERE created_at >= now() - INTERVAL '7 days') AS saves,
       (SELECT COUNT(*) FROM properties WHERE status = 'active') AS active,
       (SELECT COUNT(*) FROM properties WHERE status = 'sold_rented' AND archived_at >= now() - INTERVAL '7 days') AS closed`
  );
  const d = r.rows[0];
  const text =
    `📈 <b>Тижневий звіт</b>\n\n` +
    `🏠 Активних об'єктів: ${d.active}\n` +
    `✅ Закрито угод: ${d.closed}\n` +
    `🆕 Заявок: ${d.leads}\n` +
    `👁 Переглядів: ${d.views}\n` +
    `❤️ В обраному: ${d.saves}`;
  for (const id of REALTOR_TG_IDS) {
    try {
      await bot.api.sendMessage(id, text, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('[bot] weekly summary failed', e);
    }
  }
}
cron.schedule('0 9 * * MON', () => sendWeeklySummary().catch((e) => console.error(e)), {
  timezone: 'Europe/Kyiv',
});

bot.catch((err) => console.error('[bot] error', err));
bot.start({ onStart: (me) => console.log(`[bot] @${me.username} started`) });
