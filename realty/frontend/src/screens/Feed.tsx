import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Property, Currency, DealType } from '../types';
import { useSession } from '../session';
import {
  TgHeader, TabBar, BldgImage, ListingCardLg, ListingCard, ListingRow, SectionHeader,
  showToast,
} from '../components';
import { I } from '../icons';
import { UA, coverVariant } from '../data/ua';
import { setUsdUahRate } from '../utils/format';

type Op = 'buy' | 'rent' | 'daily';
const OP_TO_DEAL: Record<Op, DealType | undefined> = { buy: 'sale', rent: 'rent', daily: undefined };

export function FeedScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [items, setItems] = useState<Property[] | null>(null);
  const [op, setOp] = useState<Op>('buy');
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const mainCurrency: Currency = 'USD'; // primary currency for display; UAH shown as ≈

  // Load properties
  useEffect(() => {
    const f: any = { limit: 40, status: 'active' };
    const deal = OP_TO_DEAL[op];
    if (deal) f.deal = deal;
    if (district) f.district = district;
    if (query) f.q = query;
    if (op === 'daily') { setItems([]); return; } // not supported yet
    api.listProperties(f).then((r) => {
      setItems(r.items);
      if (r.rate) setUsdUahRate(r.rate);
    }).catch(() => setItems([]));
  }, [op, district, query]);

  // Load favorites for client
  useEffect(() => {
    if (session?.user.role === 'client') {
      api.listFavorites().then((r) => setFavIds(new Set(r.items.map((i: any) => i.id)))).catch(() => {});
    }
  }, [session]);

  const toggleFav = async (id: number) => {
    if (session?.user.role !== 'client') return;
    if (favIds.has(id)) {
      await api.removeFavorite(id);
      setFavIds((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await api.addFavorite(id);
      setFavIds((s) => new Set(s).add(id));
      showToast('Додано в обране');
    }
  };

  const total = items?.length ?? 0;
  const featured = items?.[0];
  const newOnes = useMemo(() => items?.slice(1, 5) ?? [], [items]);
  const more = useMemo(() => items?.slice(5, 11) ?? [], [items]);

  const open = (id: number) => navigate(`/property/${id}`);

  return (
    <div className="tg">
      <TgHeader title="Realty" sub={UA.city} onBack={false}
        right={<button className="tg-back" aria-label="share">{I.share({ s: 16 })}</button>}/>

      <div className="tg-body">

        {/* Operation segmented control */}
        <div style={{ padding: '0 16px 4px' }}>
          <div className="segment" style={{ height: 38 }}>
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
            <button style={{ color: 'var(--ink)' }} onClick={() => navigate('/filters')} aria-label="filters">
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

        {/* New offers */}
        {newOnes.length > 0 && (
          <>
            <SectionHeader title="Нові пропозиції" action={`Усі ${total}`} onAction={() => navigate('/filters')}/>
            <div className="hscroll">
              {newOnes.map((it) => (
                <ListingCard
                  key={it.id}
                  property={it}
                  mainCurrency={mainCurrency}
                  w={230}
                  onClick={() => open(it.id)}
                  isFav={favIds.has(it.id)}
                  onFav={() => toggleFav(it.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Category tiles */}
        <SectionHeader title="За форматом"/>
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { label: 'Новобудови', count: countBy(items, 'building_type', 'новобудова'), bg: 'cool' },
            { label: 'Сталінки',  count: countBy(items, 'building_type', 'сталінка'),  bg: 'warm' },
            { label: 'Будинки',   count: countBy(items, 'type', 'house'),              bg: 'clay' },
            { label: 'Оренда',    count: countBy(items, 'deal', 'rent'),               bg: 'sand' },
          ] as const).map((c) => (
            <button
              key={c.label}
              style={{ position: 'relative', height: 110, borderRadius: 14, overflow: 'hidden', textAlign: 'left' }}
              onClick={() => navigate('/filters')}
            >
              <BldgImage variant={c.bg as any} height={110} rounded={14}/>
              <div style={{
                position: 'absolute', inset: 0, padding: 12, display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end', color: '#fff',
                background: 'linear-gradient(180deg, rgba(20,19,15,0) 30%, rgba(20,19,15,0.55) 100%)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.label}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{c.count} об'єктів</div>
              </div>
            </button>
          ))}
        </div>

        {/* Recent list */}
        {more.length > 0 && (
          <>
            <SectionHeader title="Свіжі оголошення" action="Сортувати"/>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {more.map((it) => (
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

        {/* Market pulse */}
        <div style={{ padding: '24px 16px 0' }}>
          <div className="card-flat" style={{ padding: 18 }}>
            <div className="eyebrow">Ринок · {monthYear()}</div>
            <div className="h-display" style={{ fontSize: 24, marginTop: 6 }}>
              {UA.city} · {total} активних об'єктів
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
              Преміум, вторинний ринок та новобудови. Перегляди організуються через застосунок.
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/map')}>
              Дивитися на карті {I.chev({ s: 12 })}
            </button>
          </div>
        </div>

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

      <TabBar active="home"/>
    </div>
  );
}

function countBy<T>(arr: T[] | null, key: keyof T, value: any): number {
  if (!arr) return 0;
  return arr.filter((x) => x[key] === value).length;
}
function monthYear(): string {
  const d = new Date();
  const months = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
                  'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
