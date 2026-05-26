import { query } from '../db.js';

const NBU_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json';

export async function fetchAndStoreUsdRate(): Promise<number> {
  const res = await fetch(NBU_URL);
  if (!res.ok) throw new Error(`NBU API HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ rate: number }>;
  if (!data?.length) throw new Error('NBU API empty response');
  const rate = data[0].rate;
  await query(
    `INSERT INTO exchange_rates (date, usd_uah)
     VALUES (CURRENT_DATE, $1)
     ON CONFLICT (date) DO UPDATE SET usd_uah = EXCLUDED.usd_uah, fetched_at = now()`,
    [rate]
  );
  return rate;
}

export async function getLatestRate(): Promise<number> {
  const res = await query<{ usd_uah: string }>(
    'SELECT usd_uah FROM exchange_rates ORDER BY date DESC LIMIT 1'
  );
  if (res.rowCount === 0) {
    return fetchAndStoreUsdRate();
  }
  return Number(res.rows[0].usd_uah);
}

export function convert(value: number, from: 'USD' | 'UAH', to: 'USD' | 'UAH', rate: number): number {
  if (from === to) return value;
  if (from === 'USD') return value * rate;
  return value / rate;
}
