import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { fmt, priceInUsd, setUsdUahRate } from '../utils/format';
import type { Property, Currency } from '../types';
import { I } from '../icons';
import { UA } from '../data/ua';

// Dnipro center
const DNIPRO: [number, number] = [48.4647, 35.0462];

function makeMarker(label: string, active = false) {
  // Estimate width from label length so the pill fits the text without clipping.
  // Leaflet positions the icon based on iconSize/iconAnchor — using realistic
  // values keeps the pill centered over the actual lat/lng.
  const approxW = Math.max(56, label.length * 8 + 22);
  const approxH = 30;
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
  const currency: Currency = 'USD';

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
        position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)',
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

      {/* Floating list toggle */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)',
          bottom: 'calc(env(safe-area-inset-bottom) + var(--tg-content-bottom) + 90px)',
          zIndex: 500, height: 40, padding: '0 18px', borderRadius: 100,
          background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 14px rgba(20,19,15,0.25)',
        }}
      >
        {I.layers({ s: 14, c: '#fff' })} Списком
      </button>

      {/* Map itself — leaves space at bottom for the tab bar */}
      <div className="map-wrap" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        bottom: 'calc(env(safe-area-inset-bottom) + var(--tg-content-bottom) + 72px)', zIndex: 1,
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
            const label = currency === 'USD' ? fmt.usdShort(usd) : fmt.uahShort(usd * 41.2);
            return (
              <Marker
                key={p.id}
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
