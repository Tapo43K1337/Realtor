import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import type { Property, Currency, DealType } from '../types';
import { useSession } from '../session';
import {
  TgHeader, ListingCardLg, ListingRow, SectionHeader, showToast,
} from '../components';
import { I } from '../icons';
import { UA } from '../data/ua';
import { setUsdUahRate } from '../utils/format';

type Op = 'all' | 'buy' | 'rent' | 'daily';
const OP_TO_DEAL: Record<Op, DealType | undefined> = { all: undefined, buy: 'sale', rent: 'rent', daily: undefined };

export function FeedScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<Property[] | null>(null);
  const [op, setOp] = useState<Op>(() => {
    const d = searchParams.get('deal');
    if (d === 'sale') return 'buy';
    if (d === 'rent') return 'rent';
    return 'all';
  });
  const [district, setDistrict] = useState<string | undefined>(() => searchParams.get('district') || undefined);
  const [query, setQuery] = useState('');
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const mainCurrency: Currency = 'USD'; // primary currency for display; UAH shown as ≈

  // Load properties — applies URL params from Filters screen + local controls
  useEffect(() => {
    const f: any = { limit: 40, status: 'active' };
    const deal = OP_TO_DEAL[op];
    if (deal) f.deal = deal;
    if (district) f.district = district;
    if (query) f.q = query;
    if (op === 'daily') { setItems([]); return; } // not supported yet

    // Merge any filter params from URL (set by Filters screen)
    for (const k of ['type', 'building_type', 'condition',
                     'rooms_min', 'rooms_max', 'price_min', 'price_max',
                     'area_min', 'area_max', 'currency']) {
      const v = searchParams.get(k);
      if (v) f[k] = v;
    }

    api.listProperties(f).then((r) => {
      setItems(r.items);
      if (r.rate) setUsdUahRate(r.rate);
    }).catch(() => setItems([]));
  }, [op, district, query, searchParams]);

  // Load favorites for client
  useEffect(() => {
    if (session?.user.role === 'client') {
      api.listFavorites().then((r) => setFavIds(new Set(r.items.map((i: any) => i.id)))).catch(() => {});
    }
  }, [session]);

  const toggleFav = async (id: number) => {
    if (session?.user.role !== 'client') {
      showToast('Обране доступне лише клієнтам');
      return;
    }
    try {
      if (favIds.has(id)) {
        await api.removeFavorite(id);
        setFavIds((s) => { const n = new Set(s); n.delete(id); return n; });
      } else {
        await api.addFavorite(id);
        setFavIds((s) => new Set(s).add(id));
        showToast('Додано в обране');
      }
    } catch {
      showToast('Не вдалося оновити обране');
    }
  };

  const total = items?.length ?? 0;
  const featured = items?.[0];
  const rest = useMemo(() => items?.slice(1) ?? [], [items]);

  const open = (id: number) => navigate(`/property/${id}`);

  return (
    <div className="tg">
      <TgHeader title="Realty" sub={UA.city} onBack={false}/>

      <div className="tg-body">

        {/* Operation segmented control */}
        <div style={{ padding: '0 16px 4px' }}>
          <div className="segment" style={{ height: 38 }}>
            <button className={op === 'all'   ? 'on' : ''} onClick={() => setOp('all')}>Усі</button>
            <button className={op === 'buy'   ? 'on' : ''} onClick={() => setOp('buy')}>Купити</button>
            <button className={op === 'rent'  ? 'on' : ''} onClick={() => setOp('rent')}>Орендувати</button>
            <button className={op === 'daily' ? 'on' : ''} onClick={() => setOp('daily')}>Подобово</button>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ padding: '10px 16px 0' }}>
          <div className="input" style={{ borderRadius: 14, height: 48 }}>
            {I.search({ s: 18, c: '#9C9890', w: 1.8 })}
            <input
              type="search"
              placeholder="Адреса, ЖК або район"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, border: 0, background: 'transparent', height: '100%', minWidth: 0 }}
            />
            <button style={{ color: 'var(--ink)' }} onClick={() => navigate('/filters', { state: { from: '/' } })} aria-label="filters">
              {I.slider({ s: 18, w: 1.8 })}
            </button>
          </div>
        </div>

        {/* District chips */}
        <div style={{ marginTop: 14 }}>
          <div className="hscroll">
            <button
              className={'chip lg ' + (district === undefined ? 'solid' : '')}
              onClick={() => setDistrict(undefined)}
            >
              {I.compass({ s: 14, c: district === undefined ? '#fff' : 'currentColor' })} Усі райони
            </button>
            {UA.districts.slice(0, 6).map((d) => (
              <button
                key={d}
                className={'chip lg ' + (district === d ? 'solid' : '')}
                onClick={() => setDistrict(district === d ? undefined : d)}
              >{d}</button>
            ))}
          </div>
        </div>

        {/* Eyebrow + featured */}
        {featured && (
          <>
            <div style={{ padding: '24px 20px 12px' }}>
              <div className="eyebrow">Підбірка тижня</div>
              <div className="h-display" style={{ fontSize: 32, marginTop: 6 }}>
                Преміум житло над<br/>правим берегом Дніпра
              </div>
            </div>
            <div style={{ padding: '0 16px' }}>
              <ListingCardLg
                property={featured}
                mainCurrency={mainCurrency}
                onClick={() => open(featured.id)}
                isFav={favIds.has(featured.id)}
                onFav={() => toggleFav(featured.id)}
              />
            </div>
          </>
        )}

        {/* All listings (after featured) */}
        {rest.length > 0 && (
          <>
            <SectionHeader title={op === 'rent' ? 'Усі об\'єкти в оренду' : op === 'buy' ? 'Усі об\'єкти на продаж' : op === 'daily' ? 'Подобово' : 'Усі об\'єкти'} action={`${total} шт.`}/>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rest.map((it) => (
                <ListingRow
                  key={it.id}
                  property={it}
                  mainCurrency={mainCurrency}
                  saved={favIds.has(it.id)}
                  onClick={() => open(it.id)}
                  onFav={() => toggleFav(it.id)}
                />
              ))}
            </div>
          </>
        )}

        {items === null && (
          <div className="center-state"><div className="t">Завантаження…</div></div>
        )}
        {items?.length === 0 && (
          <div className="center-state">
            <div className="t">Поки нічого не знайдено</div>
            <div>Спробуйте змінити фільтри</div>
          </div>
        )}
      </div>
    </div>
  );
}
