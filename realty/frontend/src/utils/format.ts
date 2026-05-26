// Fallback rate used only when /api/rates fails. Real rate is fetched from NBU daily.
export const FALLBACK_USD_UAH = 41.2;

let currentRate = FALLBACK_USD_UAH;
export function setUsdUahRate(rate: number) { if (rate > 0) currentRate = rate; }
export function getUsdUahRate() { return currentRate; }

export const fmt = {
  usd: (n: number) => '$' + Math.round(n).toLocaleString('en-US'),
  uah: (n: number) => Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' ') + ' ₴',
  uahShort: (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' млн ₴';
    if (n >= 1000) return Math.round(n / 1000) + ' тис ₴';
    return Math.round(n) + ' ₴';
  },
  usdShort: (n: number) => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + Math.round(n);
  },
  m2: (n: number | null | undefined) => (n == null ? '—' : n + ' м²'),
};

// Convert any price → USD and UAH equivalents based on current rate
export function priceInUsd(value: number, currency: 'USD' | 'UAH') {
  return currency === 'USD' ? value : value / currentRate;
}
export function priceInUah(value: number, currency: 'USD' | 'UAH') {
  return currency === 'UAH' ? value : value * currentRate;
}

/** Capitalize the first letter of a label for display only.
 *  Values stored in the DB (e.g. building_type='новобудова') stay lowercase —
 *  this is purely a UI presentation helper, mirroring how Ukrainian renders
 *  category labels with an initial capital. */
export function cap<T extends string | null | undefined>(s: T): T {
  if (!s) return s;
  return (s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1)) as T;
}
