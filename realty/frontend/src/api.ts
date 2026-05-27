import type { Property, Photo, Agent, Viewing, Session, Filters } from './types';

const API_URL = (import.meta.env.VITE_API_URL as string) || '/api';

let TOKEN: string | null = localStorage.getItem('realty_token');

export function setToken(t: string | null) {
  TOKEN = t;
  if (t) localStorage.setItem('realty_token', t);
  else localStorage.removeItem('realty_token');
}

export function getToken(): string | null {
  return TOKEN;
}

// Optional re-login hook: when a request returns 401 we try this once and retry.
// SessionProvider wires it up so the user doesn't get stuck on an expired token.
let reauth: (() => Promise<string | null>) | null = null;
export function setReauth(fn: (() => Promise<string | null>) | null) { reauth = fn; }

async function doFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body != null) headers['content-type'] = 'application/json';
  if (token) headers['authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await doFetch(path, init, TOKEN);
  if (res.status === 401 && reauth && !path.startsWith('/auth/')) {
    // Try to silently re-issue the token via Telegram initData, then retry once.
    const fresh = await reauth().catch(() => null);
    if (fresh) res = await doFetch(path, init, fresh);
  }
  if (res.status === 401) {
    setToken(null);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `HTTP ${res.status}`) as Error & { status?: number; body?: string };
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function reqForm<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (TOKEN) headers['authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// Auth
export const api = {
  login: (initData: string) =>
    req<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ initData }) }),

  me: () => req<{ role: 'realtor' | 'client'; profile: any }>('/me'),
  saveProfile: (name: string, phone: string) =>
    req<{ ok: true }>('/me/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) }),

  // Properties
  listProperties: (f: Filters & { limit?: number; offset?: number; bbox?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    return req<{ items: Property[]; rate: number; total: number }>(`/properties?${params}`);
  },

  getProperty: (id: number) => req<{ property: Property; rate: number }>(`/properties/${id}`),

  createProperty: (body: Partial<Property>) =>
    req<{ id: number }>('/properties', { method: 'POST', body: JSON.stringify(body) }),

  updateProperty: (id: number, body: Partial<Property>) =>
    req<{ ok: true }>(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteProperty: (id: number) =>
    req<{ ok: true }>(`/properties/${id}`, { method: 'DELETE' }),

  closeProperty: (id: number, reason: 'sold_rented' | 'withdrawn') =>
    req<{ ok: true }>(`/properties/${id}/close`, { method: 'POST', body: JSON.stringify({ reason }) }),

  shareProperty: (id: number) =>
    req<{ ok: true }>(`/properties/${id}/share`, { method: 'POST' }),

  preparePropertyShare: (id: number) =>
    req<{ id: string; expiration_date: number }>(`/properties/${id}/prepare-share`, { method: 'POST' }),

  // Photos
  uploadPhotos: (propertyId: number, files: File[]) => {
    const fd = new FormData();
    for (const f of files) fd.append('photos', f, f.name);
    return reqForm<{ photos: Photo[] }>(`/properties/${propertyId}/photos`, fd);
  },
  deletePhoto: (propertyId: number, photoId: number) =>
    req<{ ok: true }>(`/properties/${propertyId}/photos/${photoId}`, { method: 'DELETE' }),
  setCover: (propertyId: number, photoId: number) =>
    req<{ ok: true }>(`/properties/${propertyId}/photos/${photoId}/cover`, { method: 'PUT' }),
  reorderPhotos: (propertyId: number, ids: number[]) =>
    req<{ ok: true }>(`/properties/${propertyId}/photos/order`, {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    }),

  // Agents
  listAgents: () => req<{ items: Agent[] }>('/agents'),
  updateAgentMe: (body: Partial<Agent>) =>
    req<{ ok: true }>('/agents/me', { method: 'PUT', body: JSON.stringify(body) }),
  uploadAgentPhoto: (file: File) => {
    const fd = new FormData();
    fd.append('photo', file, file.name);
    return reqForm<{ photo: string }>('/agents/me/photo', fd);
  },

  // Viewings
  createViewing: (body: {
    property_id: number;
    scheduled_at: string | null;
    name: string;
    phone: string;
    note?: string;
    remember_profile?: boolean;
  }) => req<{ id: number }>('/viewings', { method: 'POST', body: JSON.stringify(body) }),

  myViewings: () => req<{ items: Viewing[] }>('/viewings/mine'),
  listViewings: (status?: string) =>
    req<{ items: Viewing[] }>(`/viewings${status ? `?status=${status}` : ''}`),
  cancelViewing: (id: number) =>
    req<{ ok: true }>(`/viewings/${id}/cancel`, { method: 'POST' }),
  markViewingDone: (id: number) =>
    req<{ ok: true }>(`/viewings/${id}/done`, { method: 'POST' }),

  // Favorites
  listFavorites: () => req<{ items: any[] }>('/favorites'),
  addFavorite: (propertyId: number) =>
    req<{ ok: true }>(`/favorites/${propertyId}`, { method: 'POST' }),
  removeFavorite: (propertyId: number) =>
    req<{ ok: true }>(`/favorites/${propertyId}`, { method: 'DELETE' }),

  // Analytics
  dashboard: () => req<{
    active: number; sold_or_rented_30d: number;
    leads_7d: number; leads_30d: number;
    views_7d: number; views_30d: number; saves_7d: number;
    total_clients: number;
    top_property: any;
  }>('/analytics/dashboard'),

  // Rates
  usdRate: () => req<{ usd_uah: number }>('/rates/usd'),
};

export function fmtPrice(value: number, currency: 'USD' | 'UAH'): string {
  if (currency === 'USD') return '$' + Math.round(value).toLocaleString('en-US');
  return Math.round(value).toLocaleString('uk-UA').replace(/,/g, ' ') + ' ₴';
}

export function fmtPriceShort(value: number, currency: 'USD' | 'UAH'): string {
  if (currency === 'USD') {
    if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (value >= 1000) return '$' + Math.round(value / 1000) + 'K';
    return '$' + value;
  }
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace('.0', '') + ' млн ₴';
  if (value >= 1000) return Math.round(value / 1000) + ' тис ₴';
  return value + ' ₴';
}

export function fmtM2(n: number | null | undefined): string {
  return n == null ? '—' : `${n} м²`;
}
