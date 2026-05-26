import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import type { Currency, DealType, PropertyType } from '../types';

const DISTRICTS = [
  'Соборний', 'Шевченківський', 'Центральний',
  'Чечелівський', 'Новокодацький', 'Самарський',
  'Амур-Нижньодніпровський', 'Індустріальний',
];

export function FiltersScreen() {
  const navigate = useNavigate();
  const [type, setType] = useState<PropertyType | ''>('');
  const [deal, setDeal] = useState<DealType | ''>('');
  const [district, setDistrict] = useState('');
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
    if (district) params.set('district', district);
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
    setType(''); setDeal(''); setDistrict('');
    setRoomsMin(''); setRoomsMax(''); setPriceMin(''); setPriceMax('');
    setAreaMin(''); setAreaMax('');
  };

  return (
    <div className="tg">
      <Header title="Фільтри" right={<button className="tg-action" onClick={reset}>Скинути</button>}/>
      <div className="tg-body" style={{ padding: '4px 16px 20px' }}>

        <div className="filter-block">
          <div className="title">Тип угоди</div>
          <div className="segment">
            <button className={deal === '' ? 'on' : ''} onClick={() => setDeal('')}>Усі</button>
            <button className={deal === 'sale' ? 'on' : ''} onClick={() => setDeal('sale')}>Купити</button>
            <button className={deal === 'rent' ? 'on' : ''} onClick={() => setDeal('rent')}>Оренда</button>
          </div>
        </div>

        <div className="filter-block">
          <div className="title">Тип нерухомості</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {([
              ['', 'Усі'],
              ['apartment', 'Квартира'],
              ['house', 'Будинок'],
              ['commercial', 'Комерція'],
              ['land', 'Земля'],
            ] as const).map(([v, l]) => (
              <button key={l} className={`chip ${type === v ? 'solid' : ''}`} onClick={() => setType(v as any)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="filter-block">
          <div className="title">Район</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className={`chip ${district === '' ? 'solid' : ''}`} onClick={() => setDistrict('')}>Усі</button>
            {DISTRICTS.map((d) => (
              <button key={d} className={`chip ${district === d ? 'solid' : ''}`} onClick={() => setDistrict(d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="filter-block">
          <div className="title">Кількість кімнат</div>
          <div className="row-2">
            <input className="input" placeholder="Від" inputMode="numeric" value={roomsMin} onChange={(e) => setRoomsMin(e.target.value)}/>
            <input className="input" placeholder="До" inputMode="numeric" value={roomsMax} onChange={(e) => setRoomsMax(e.target.value)}/>
          </div>
        </div>

        <div className="filter-block">
          <div className="title">Ціна</div>
          <div className="segment" style={{ marginBottom: 8, maxWidth: 140 }}>
            <button className={currency === 'USD' ? 'on' : ''} onClick={() => setCurrency('USD')}>USD</button>
            <button className={currency === 'UAH' ? 'on' : ''} onClick={() => setCurrency('UAH')}>UAH</button>
          </div>
          <div className="row-2">
            <input className="input" placeholder="Від" inputMode="numeric" value={priceMin} onChange={(e) => setPriceMin(e.target.value)}/>
            <input className="input" placeholder="До" inputMode="numeric" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}/>
          </div>
        </div>

        <div className="filter-block">
          <div className="title">Площа, м²</div>
          <div className="row-2">
            <input className="input" placeholder="Від" inputMode="numeric" value={areaMin} onChange={(e) => setAreaMin(e.target.value)}/>
            <input className="input" placeholder="До" inputMode="numeric" value={areaMax} onChange={(e) => setAreaMax(e.target.value)}/>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          <button className="btn btn-primary" onClick={apply}>Застосувати</button>
        </div>
      </div>
    </div>
  );
}
