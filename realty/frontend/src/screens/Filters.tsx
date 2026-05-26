import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TgHeader } from '../components';
import { I } from '../icons';
import { UA } from '../data/ua';
import type { Currency, DealType, PropertyType } from '../types';

const BUILDING_TYPES = ['новобудова', 'сталінка', 'хрущовка', 'чешка', 'вторинка', 'інше'] as const;
const CONDITIONS = ['дизайн-ремонт', 'євроремонт', 'житловий стан', 'під ремонт', 'без ремонту'] as const;

export function FiltersScreen() {
  const navigate = useNavigate();
  const [type, setType] = useState<PropertyType | ''>('');
  const [deal, setDeal] = useState<DealType | ''>('');
  const [districts, setDistricts] = useState<Set<string>>(new Set());
  const [buildingType, setBuildingType] = useState('');
  const [condition, setCondition] = useState('');
  const [roomsMin, setRoomsMin] = useState('');
  const [roomsMax, setRoomsMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');

  const apply = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (deal) params.set('deal', deal);
    if (districts.size === 1) params.set('district', [...districts][0]);
    if (buildingType) params.set('building_type', buildingType);
    if (condition) params.set('condition', condition);
    if (roomsMin) params.set('rooms_min', roomsMin);
    if (roomsMax) params.set('rooms_max', roomsMax);
    if (priceMin) params.set('price_min', priceMin);
    if (priceMax) params.set('price_max', priceMax);
    if (areaMin) params.set('area_min', areaMin);
    if (areaMax) params.set('area_max', areaMax);
    params.set('currency', currency);
    navigate(`/?${params.toString()}`);
  };

  const reset = () => {
    setType(''); setDeal(''); setDistricts(new Set());
    setBuildingType(''); setCondition('');
    setRoomsMin(''); setRoomsMax(''); setPriceMin(''); setPriceMax('');
    setAreaMin(''); setAreaMax('');
  };

  const toggleDistrict = (d: string) => {
    setDistricts((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d); else n.add(d);
      return n;
    });
  };

  const Section = ({ title, count, children }: { title: string; count?: string; children: ReactNode }) => (
    <div style={{ padding: '20px 20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
        {count !== undefined && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{count}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="tg" style={{ position: 'relative' }}>
      <TgHeader
        title="Фільтри"
        right={<button className="tg-action" onClick={reset} style={{ fontSize: 14, color: 'var(--muted)' }}>Скинути</button>}
      />

      {/* Scrollable content area; sticky apply bar at bottom */}
      <div className="tg-body" style={{ overflowY: 'auto', paddingBottom: 110 }}>

        {/* Deal type segmented */}
        <div style={{ padding: '4px 20px 0' }}>
          <div className="segment" style={{ height: 38 }}>
            <button className={deal === 'sale' ? 'on' : ''} onClick={() => setDeal(deal === 'sale' ? '' : 'sale')}>Купити</button>
            <button className={deal === 'rent' ? 'on' : ''} onClick={() => setDeal(deal === 'rent' ? '' : 'rent')}>Орендувати</button>
            <button className={deal === '' ? 'on' : ''} onClick={() => setDeal('')}>Усі</button>
          </div>
        </div>

        {/* Property type */}
        <Section title="Тип нерухомості">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {([
              ['apartment', 'Квартира'],
              ['house', 'Будинок'],
              ['commercial', 'Комерція'],
              ['land', 'Ділянка'],
            ] as const).map(([v, l]) => (
              <button key={v} className={'chip lg ' + (type === v ? 'solid' : '')} onClick={() => setType(type === v ? '' : v as PropertyType)}>{l}</button>
            ))}
          </div>
        </Section>

        {/* Price */}
        <Section title="Ціна" count={currency}>
          <div className="segment" style={{ marginBottom: 10, maxWidth: 140 }}>
            <button className={currency === 'USD' ? 'on' : ''} onClick={() => setCurrency('USD')}>USD</button>
            <button className={currency === 'UAH' ? 'on' : ''} onClick={() => setCurrency('UAH')}>UAH</button>
          </div>
          <div className="row-2">
            <div className="input" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 2, padding: '0 14px', height: 48 }}>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Від</span>
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} inputMode="numeric"
                placeholder="0"
                style={{ border: 0, background: 'transparent', fontSize: 15, width: '100%', padding: 0 }}/>
            </div>
            <div className="input" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 2, padding: '0 14px', height: 48 }}>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>До</span>
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} inputMode="numeric"
                placeholder="—"
                style={{ border: 0, background: 'transparent', fontSize: 15, width: '100%', padding: 0 }}/>
            </div>
          </div>
        </Section>

        {/* Rooms */}
        <Section title="Кількість кімнат">
          <div className="row-2">
            <input className="input" placeholder="Від" inputMode="numeric" value={roomsMin} onChange={(e) => setRoomsMin(e.target.value)}/>
            <input className="input" placeholder="До" inputMode="numeric" value={roomsMax} onChange={(e) => setRoomsMax(e.target.value)}/>
          </div>
        </Section>

        {/* Area */}
        <Section title="Площа" count="м²">
          <div className="row-2">
            <input className="input" placeholder="Від" inputMode="numeric" value={areaMin} onChange={(e) => setAreaMin(e.target.value)}/>
            <input className="input" placeholder="До" inputMode="numeric" value={areaMax} onChange={(e) => setAreaMax(e.target.value)}/>
          </div>
        </Section>

        {/* Building type */}
        <Section title="Тип будинку">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BUILDING_TYPES.map((b) => (
              <button
                key={b}
                className={'chip ' + (buildingType === b ? 'solid' : '')}
                onClick={() => setBuildingType(buildingType === b ? '' : b)}
              >{b}</button>
            ))}
          </div>
        </Section>

        {/* Condition */}
        <Section title="Стан">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONDITIONS.map((c) => (
              <button
                key={c}
                className={'chip ' + (condition === c ? 'solid' : '')}
                onClick={() => setCondition(condition === c ? '' : c)}
              >{c}</button>
            ))}
          </div>
        </Section>

        {/* Districts */}
        <Section title="Райони Дніпра" count={districts.size > 0 ? `${districts.size} обрано` : ''}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {UA.districts.map((d) => {
              const on = districts.has(d);
              return (
                <button key={d} className={'chip ' + (on ? 'solid' : '')} onClick={() => toggleDistrict(d)}>
                  {on && I.check({ s: 12, c: '#fff' })} {d}
                </button>
              );
            })}
          </div>
        </Section>

        <div style={{ height: 140 }}/>
      </div>

      {/* Sticky bottom apply bar — z-index above TabBar (1000) and Telegram chrome */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 0,
        padding: '12px 16px calc(env(safe-area-inset-bottom) + 14px)',
        borderTop: '0.5px solid var(--hair)',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', gap: 12,
        zIndex: 2000,
        boxShadow: '0 -8px 24px rgba(20,19,15,0.08)',
      }}>
        <button className="btn btn-secondary" style={{ flex: '0 0 auto', padding: '0 18px' }} onClick={reset}>
          Скинути
        </button>
        <button className="btn btn-primary" style={{ flex: 1, minWidth: 0 }} onClick={apply}>
          Показати {I.chev({ s: 14, c: '#fff' })}
        </button>
      </div>
    </div>
  );
}
