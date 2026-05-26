import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api, fmtPriceShort } from '../api';
import type { Property, Currency } from '../types';

// Dnipro center
const DNIPRO: [number, number] = [48.4647, 35.0462];

function makeMarker(label: string) {
  return L.divIcon({
    className: 'map-pin-marker-wrapper',
    html: `<div class="map-pin-marker">${label}</div>`,
    iconSize: undefined as any,
    iconAnchor: [0, 0],
  });
}

function FitToBounds({ items }: { items: Property[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = items.filter((p) => p.lat != null && p.lng != null)
      .map((p) => [p.lat as number, p.lng as number] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 15);
    } else {
      map.fitBounds(pts, { padding: [40, 40] });
    }
  }, [items, map]);
  return null;
}

export function MapScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Property[]>([]);
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    api.listProperties({ limit: 200, currency })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [currency]);

  return (
    <div className="tg">
      <header className="tg-head">
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Карта Дніпра</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{items.length} об'єктів</div>
        </div>
        <div className="segment" style={{ width: 140 }}>
          <button className={currency === 'USD' ? 'on' : ''} onClick={() => setCurrency('USD')}>USD</button>
          <button className={currency === 'UAH' ? 'on' : ''} onClick={() => setCurrency('UAH')}>UAH</button>
        </div>
      </header>

      <div className="map-wrap">
        <MapContainer center={DNIPRO} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToBounds items={items}/>
          {items.filter((p) => p.lat != null && p.lng != null).map((p) => {
            const primary = p.price_currency === currency;
            const v = primary ? p.price_value : (p.price_value_secondary ?? p.price_value);
            const c: Currency = primary ? p.price_currency : (p.price_currency_secondary ?? p.price_currency);
            return (
              <Marker
                key={p.id}
                position={[p.lat as number, p.lng as number]}
                icon={makeMarker(fmtPriceShort(v, c))}
                eventHandlers={{ click: () => navigate(`/property/${p.id}`) }}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
