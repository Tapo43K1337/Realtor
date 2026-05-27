import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { fmt, priceInUsd, setUsdUahRate, getUsdUahRate } from '../utils/format';
import type { Property, Currency } from '../types';
import { I } from '../icons';
import { UA } from '../data/ua';

// Dnipro center
const DNIPRO: [number, number] = [48.4647, 35.0462];

function makeMarker(label: string, active = false) {
  // Pill width is dictated by CSS (`width: max-content`) so it hugs the text.
  // Leaflet still needs an approximate iconSize for anchoring — slight under-
  // estimate is fine, the pill is `inline-block` and grows over its anchor box.
  const approxW = label.length * 7 + 18;
  const approxH = 24;
  return L.divIcon({
    className: 'leaflet-pin-wrap',
    html: `<div class="leaflet-pin-marker${active ? ' active' : ''}">${label}</div>`,
    iconSize: [approxW, approxH],
    iconAnchor: [approxW / 2, approxH / 2],
  });
}

function FitToBounds({ items }: { items: Property[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = items.filter((p) => p.lat != null && p.lng != null)
      .map((p) => [p.lat as number, p.lng as number] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) map.setView(pts[0], 15);
    else map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
  }, [items, map]);
  return null;
}

export function MapScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<Property[] | null>(null);
  // Seed from filter param so a user who picked UAH in filters sees UAH labels;
  // toggle below lets them flip without reopening filters.
  const [currency, setCurrency] = useState<Currency>(
    () => (searchParams.get('currency') as Currency) || 'USD'
  );

  useEffect(() => {
    const f: any = { limit: 100, status: 'active' };
    for (const k of ['type', 'deal', 'district', 'building_type', 'condition',
                     'rooms_min', 'rooms_max', 'price_min', 'price_max',
                     'area_min', 'area_max', 'currency']) {
      const v = searchParams.get(k);
      if (v) f[k] = v;
    }
    api.listProperties(f)
      .then((r) => {
        setItems(r.items);
        if (r.rate) setUsdUahRate(r.rate);
      })
      .catch(() => setItems([]));
  }, [searchParams]);

  const withCoords = (items ?? []).filter((p) => p.lat != null && p.lng != null);

  return (
    <div className="tg" style={{ background: '#E8E3D8' }}>
      {/* Top floating chrome */}
      <div style={{
        position: 'absolute',
        top: 'calc(max(env(safe-area-inset-top), var(--tg-safe-top)) + var(--tg-content-top) + 12px)',
        left: 16, right: 16, display: 'flex', gap: 10, zIndex: 600,
      }}>
        <button
          className="glass tg-back"
          style={{ width: 44, height: 44, flexShrink: 0 }}
          onClick={() => navigate('/')}
          aria-label="back"
        >
          {I.back({ s: 16 })}
        </button>
        <div className="glass" style={{
          flex: 1, height: 44, borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
        }}>
          {I.search({ s: 18, c: '#6B6862', w: 1.8 })}
          <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>{UA.city}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
            {items === null ? 'завантаження…' : `${withCoords.length} об'єктів`}
          </span>
        </div>
        <button
          className="glass tg-back"
          style={{ width: 44, height: 44, flexShrink: 0 }}
          onClick={() => navigate('/filters', { state: { from: '/map' } })}
          aria-label="filters"
        >
          {I.slider({ s: 16 })}
        </button>
      </div>

      {/* Floating bottom controls: list toggle + currency switch */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'calc(env(safe-area-inset-bottom) + var(--tg-content-bottom) + 90px)',
        zIndex: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            pointerEvents: 'auto',
            height: 40, padding: '0 18px', borderRadius: 100,
            background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(20,19,15,0.25)',
          }}
        >
          {I.layers({ s: 14, c: '#fff' })} Списком
        </button>
        <div className="glass" role="group" aria-label="currency" style={{
          pointerEvents: 'auto',
          height: 40, borderRadius: 100, padding: 3,
          display: 'flex', alignItems: 'center', gap: 2,
          boxShadow: '0 4px 14px rgba(20,19,15,0.15)',
        }}>
          {(['USD', 'UAH'] as const).map((c) => {
            const on = currency === c;
            return (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                aria-pressed={on}
                style={{
                  width: 34, height: 34, borderRadius: 100, border: 'none',
                  background: on ? 'var(--ink)' : 'transparent',
                  color: on ? '#fff' : 'var(--ink-2)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {c === 'USD' ? '$' : '₴'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map itself — extends behind the tab bar (its own blur masks the edge),
          so there's no visible gap between map and bottom nav. */}
      <div className="map-wrap" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        bottom: 'var(--tg-content-bottom)', zIndex: 1,
      }}>
        <MapContainer
          center={DNIPRO}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; OSM, CartoDB'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <FitToBounds items={withCoords}/>
          {withCoords.map((p) => {
            const usd = priceInUsd(p.price_value, p.price_currency);
            const label = currency === 'USD' ? fmt.usdShort(usd) : fmt.uahShort(usd * getUsdUahRate());
            return (
              <Marker
                key={`${p.id}-${currency}`}
                position={[p.lat as number, p.lng as number]}
                icon={makeMarker(label)}
                eventHandlers={{ click: () => navigate(`/property/${p.id}`) }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Loading overlay */}
      {items === null && (
        <div style={{
          position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.92)', padding: '12px 20px', borderRadius: 100,
          fontSize: 13.5, color: 'var(--ink)', zIndex: 700, boxShadow: '0 4px 14px rgba(20,19,15,0.15)',
        }}>Завантаження карти…</div>
      )}
    </div>
  );
}
