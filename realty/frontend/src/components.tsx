import { useEffect, useState, type ReactNode, type CSSProperties } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { I } from './icons';
import { useSession } from './session';
import { fmt, priceInUsd, priceInUah } from './utils/format';
import { UA, coverVariant, deriveTitle, type CoverVariant } from './data/ua';
import { tg } from './tg';
import type { Property, Photo } from './types';

// ─────────── Telegram-style header ───────────
export function TgHeader({
  title, sub, action, onBack, blur, dark, over, right,
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
  onBack?: () => void | false;
  blur?: boolean;
  dark?: boolean;
  over?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  const cls = ['tg-head', blur && 'blur', dark && 'dark', over && 'over'].filter(Boolean).join(' ');
  // Inside Telegram, the native BackButton replaces our in-app one to avoid duplicates.
  const useTelegramBack = !!tg;
  const showBack = onBack !== false && !useTelegramBack;
  const handleBack = typeof onBack === 'function' ? onBack : () => navigate(-1);
  return (
    <div className={cls}>
      {showBack ? (
        <button className="tg-back" aria-label="back" onClick={handleBack}>
          {I.back({ s: 16 })}
        </button>
      ) : <div style={{ width: 34 }}/>}
      <div className="tg-title">
        {title}
        {sub && <span className="sub">{sub}</span>}
      </div>
      {right ? right : action ? (
        <button className="tg-action">{action}</button>
      ) : useTelegramBack ? (
        <div style={{ width: 34 }}/>
      ) : (
        <button className="tg-back" aria-label="menu">{I.dots({ s: 16 })}</button>
      )}
    </div>
  );
}
// Legacy alias
export const Header = TgHeader;

// ─────────── Tab bar ───────────
export function TabBar({ active }: { active?: 'home' | 'map' | 'fav' | 'dash' | 'prof' }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const { session } = useSession();
  const isRealtor = session?.user.role === 'realtor';

  const items = [
    { k: 'home' as const, n: 'Огляд', icon: I.home, to: '/' },
    { k: 'map'  as const, n: 'Карта', icon: I.map,  to: '/map' },
    { k: 'fav'  as const, n: 'Обране', icon: I.heart, to: '/favorites' },
    isRealtor
      ? { k: 'dash' as const, n: 'Кабінет', icon: I.layers, to: '/dashboard' }
      : { k: 'prof' as const, n: 'Профіль', icon: I.user, to: '/profile' },
  ];

  function isActive(to: string) {
    if (active) return false; // explicit prop overrides
    return to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
  }

  return (
    <div className="tg-tabs">
      {items.map((it) => {
        const on = active ? active === it.k : isActive(it.to);
        return (
          <button key={it.k} className={'tg-tab ' + (on ? 'active' : '')} onClick={() => navigate(it.to)}>
            {it.icon({ s: 22, w: on ? 1.8 : 1.5 })}
            <span>{it.n}</span>
          </button>
        );
      })}
    </div>
  );
}
export const BottomTabs = TabBar;

// ─────────── Building image (photo OR stylised placeholder) ───────────
export function BldgImage({
  src, variant = 'warm', tag, tagColor, height = 220, rounded = 16, showBldgs = true, label,
  children,
}: {
  src?: string | null;
  variant?: CoverVariant;
  tag?: string | null;
  tagColor?: '' | 'gold' | 'dark' | 'accent' | 'danger';
  height?: number;
  rounded?: number;
  showBldgs?: boolean;
  label?: string;
  children?: ReactNode;
}) {
  const hasImg = !!src;
  const classes = ['ph', variant, hasImg && 'has-img'].filter(Boolean).join(' ');
  return (
    <div className={classes} style={{ height, borderRadius: rounded, overflow: 'hidden', position: 'relative' }}>
      {hasImg && <img className="cover" src={src!} alt=""/>}
      {!hasImg && showBldgs && <div className="ph-buildings"/>}
      {!hasImg && variant === 'night' && <div className="ph-window-grid"/>}
      {tag && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          <span className={'tag ' + (tagColor || '')}>{tag}</span>
        </div>
      )}
      {label && <div className="ph-label" style={{ zIndex: 2 }}>{label}</div>}
      {children}
    </div>
  );
}

// Helper: pick cover photo URL (or null) from a property
export function coverUrl(p: Property): string | null {
  if (!p.photos || p.photos.length === 0) return null;
  const c = p.photos.find((x) => x.is_cover) ?? p.photos[0];
  return c.thumb_url || c.url || null;
}
export function fullPhotoUrl(photo: Photo): string {
  return photo.url;
}

// ─────────── Price label ───────────
// Primary currency = the one the realtor entered the price in.
// Conversion shown underneath as an approximation.
export function PriceLabel({
  property, big = false, light = false,
}: {
  property: Property; big?: boolean; light?: boolean;
}) {
  const usd = priceInUsd(property.price_value, property.price_currency);
  const uah = priceInUah(property.price_value, property.price_currency);
  const main = property.price_currency === 'USD' ? fmt.usd(usd) : fmt.uah(uah);
  const alt  = property.price_currency === 'USD' ? '≈ ' + fmt.uahShort(uah) : '≈ ' + fmt.usd(usd);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: light ? 'flex-end' : 'flex-start' }}>
      <span className="num-display" style={{ fontSize: big ? 34 : 20, color: light ? '#fff' : 'var(--ink)' }}>{main}</span>
      <span style={{ fontSize: 11, color: light ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginTop: 2 }}>{alt}</span>
    </div>
  );
}

// ─────────── Stat strip (rooms / area / floor) ───────────
export function StatStrip({ property, light, mono }: { property: Property; light?: boolean; mono?: boolean }) {
  const C = light ? 'rgba(255,255,255,0.85)' : 'var(--muted)';
  const F = light ? '#fff' : 'var(--ink)';
  const Cell = ({ icon, k, v }: { icon: ReactNode; k: string; v: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <div style={{ color: C, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}
        <span>{k}</span>
      </div>
      <div style={{ color: F, fontSize: mono ? 14 : 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{v}</div>
    </div>
  );
  const floor = property.floor && property.floors_total ? `${property.floor}/${property.floors_total}`
              : property.floor ? String(property.floor) : '—';
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <Cell icon={I.bed({ s: 13, w: 1.6, c: C })} k="Кімнат" v={property.rooms ? String(property.rooms) : '—'}/>
      <div style={{ width: 0.5, background: light ? 'rgba(255,255,255,0.18)' : 'var(--hair)' }}/>
      <Cell icon={I.area({ s: 13, w: 1.6, c: C })} k="Площа" v={fmt.m2(property.area_total)}/>
      <div style={{ width: 0.5, background: light ? 'rgba(255,255,255,0.18)' : 'var(--hair)' }}/>
      <Cell icon={I.floor({ s: 13, w: 1.6, c: C })} k="Поверх" v={floor}/>
    </div>
  );
}

// Decide what badge to put on the cover (tag) — based on building_type / status
export function propertyBadge(p: Property): { tag: string; tagColor: '' | 'gold' | 'dark' | 'accent' | 'danger' } | null {
  if (p.deal === 'rent') return { tag: 'Оренда', tagColor: 'accent' };
  if (p.building_type === 'новобудова') return { tag: 'Новобудова', tagColor: '' };
  if (p.building_type === 'сталінка') return { tag: 'Сталінка', tagColor: '' };
  if (p.condition === 'дизайн-ремонт') return { tag: 'Преміум', tagColor: 'gold' };
  return null;
}

// ─────────── Listing card — large (used on feed top) ───────────
export function ListingCardLg({ property, onClick, onFav, isFav }: {
  property: Property; onClick?: () => void; onFav?: () => void; isFav?: boolean;
}) {
  const badge = propertyBadge(property);
  const title = deriveTitle(property);
  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }} onClick={onClick}>
      <BldgImage
        src={coverUrl(property)}
        variant={coverVariant(property.id)}
        tag={badge?.tag} tagColor={badge?.tagColor}
        height={360} rounded={18}
      />
      <button
        className="glass"
        style={{ position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
        onClick={(e) => { e.stopPropagation(); onFav?.(); }}
      >
        {isFav ? I.heartFill({ s: 18, c: 'var(--danger)' }) : I.heart({ s: 18, c: '#14130F', w: 1.8 })}
      </button>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18,
        background: 'linear-gradient(180deg, rgba(20,19,15,0) 0%, rgba(20,19,15,0.55) 100%)',
        color: '#fff', zIndex: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.02em' }}>
              {property.district ? `${property.district} · ${UA.city}` : UA.city}
            </div>
            <div className="h-display" style={{ fontSize: 24, marginTop: 4, textWrap: 'balance' as CSSProperties['textWrap'] }}>{title}</div>
          </div>
          <PriceLabel property={property} light/>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid rgba(255,255,255,0.2)' }}>
          <StatStrip property={property} light/>
        </div>
      </div>
    </div>
  );
}

// ─────────── Listing card — wide list row ───────────
export function ListingRow({ property, saved, onClick, onFav }: {
  property: Property; saved?: boolean; onClick?: () => void; onFav?: () => void;
}) {
  const title = deriveTitle(property);
  const usd = priceInUsd(property.price_value, property.price_currency);
  const uah = priceInUah(property.price_value, property.price_currency);
  const main = property.price_currency === 'USD' ? fmt.usd(usd) : fmt.uah(uah);
  // Price-per-m² only makes sense for sales — for rent it'd mix monthly rate with
  // total area and produce a misleading number, so hide it.
  const perM2 = property.deal === 'sale' && property.area_total
    ? Math.round(uah / property.area_total)
    : 0;
  return (
    <div className="card" style={{ display: 'flex', gap: 12, padding: 10, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ width: 130, flexShrink: 0 }}>
        <BldgImage src={coverUrl(property)} variant={coverVariant(property.id)} height={104} rounded={12}/>
      </div>
      <div style={{ flex: 1, padding: '4px 4px 4px 0', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.02em' }}>{property.district ?? '—'}</div>
          <button style={{ color: saved ? 'var(--danger)' : 'var(--muted-2)', marginTop: -2 }}
            onClick={(e) => { e.stopPropagation(); onFav?.(); }}>
            {saved ? I.heartFill({ s: 16 }) : I.heart({ s: 16 })}
          </button>
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          {property.rooms ? `${property.rooms} кімн.` : ''} {property.area_total ? `· ${property.area_total} м²` : ''}{' '}
          {property.floor ? `· ${property.floor}${property.floors_total ? '/' + property.floors_total : ''}` : ''}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span className="num-display" style={{ fontSize: 19 }}>{main}</span>
          {perM2 > 0 && (
            <span style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>{fmt.usdShort(perM2)}/м²·UAH</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────── Listing card — vertical (grid item / hscroll item) ───────────
export function ListingCard({ property, w = 240, onClick, onFav, isFav }: {
  property: Property; w?: number;
  onClick?: () => void; onFav?: () => void; isFav?: boolean;
}) {
  const badge = propertyBadge(property);
  const title = deriveTitle(property);
  const usd = priceInUsd(property.price_value, property.price_currency);
  const uah = priceInUah(property.price_value, property.price_currency);
  const main = property.price_currency === 'USD' ? fmt.usd(usd) : fmt.uah(uah);
  return (
    <div style={{ width: w, flexShrink: 0, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
        <BldgImage src={coverUrl(property)} variant={coverVariant(property.id)} height={170} rounded={14}
          tag={badge?.tag} tagColor={badge?.tagColor}/>
        <button className="glass"
          style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
          onClick={(e) => { e.stopPropagation(); onFav?.(); }}>
          {isFav ? I.heartFill({ s: 14, c: 'var(--danger)' }) : I.heart({ s: 14, c: '#14130F', w: 1.8 })}
        </button>
      </div>
      <div style={{ padding: '10px 2px 2px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.02em' }}>{property.district ?? '—'}</div>
        <div style={{
          fontSize: 13.5, fontWeight: 600, marginTop: 4, lineHeight: 1.2, letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32,
        }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
          <span className="num-display" style={{ fontSize: 18 }}>{main}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>
            {property.rooms ? `${property.rooms}к` : ''} {property.area_total ? `· ${property.area_total}м²` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────── Section header ───────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="sec-h" style={{ marginTop: 24, marginBottom: 12 }}>
      <div className="t">{title}</div>
      {action && (onAction ? (
        <button className="a" style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={onAction}>
          {action} {I.chev({ s: 12 })}
        </button>
      ) : (
        // No handler — render as plain text so it doesn't look like a tappable link.
        <span className="a">{action}</span>
      ))}
    </div>
  );
}

// ─────────── Toast / Sheet / Loading / Empty ───────────
export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);
  return <div className="toast">{msg}</div>;
}

let toastSetter: ((s: string) => void) | null = null;
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    toastSetter = setMsg;
    return () => { toastSetter = null; };
  }, []);
  if (!msg) return null;
  return <Toast msg={msg} onDone={() => setMsg(null)}/>;
}
export function showToast(msg: string) { toastSetter?.(msg); }

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-h">
          <div className="t">{title}</div>
          <button className="x" onClick={onClose}>Закрити</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

export function Loading() {
  return <div className="center-state"><div className="t">Завантаження…</div></div>;
}
export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="center-state">
      <div className="t">{title}</div>
      {sub && <div>{sub}</div>}
    </div>
  );
}
