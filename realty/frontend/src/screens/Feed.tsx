import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtPrice, fmtPriceShort, fmtM2 } from '../api';
import type { Property, Filters, Currency } from '../types';
import { IconHeart, IconHeartFilled, IconSearch, IconFilter, IconPin } from '../icons';
import { useSession } from '../session';
import { showToast } from '../components';

export function FeedScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [items, setItems] = useState<Property[] | null>(null);
  const [query, setQuery] = useState('');
  const [deal, setDeal] = useState<'sale' | 'rent' | undefined>(undefined);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [favIds, setFavIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const f: Filters & { limit: number } = { limit: 40, currency };
    if (query) f.q = query;
    if (deal) f.deal = deal;
    api.listProperties(f).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [query, deal, currency]);

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
      showToast("Додано в обране");
    }
  };

  return (
    <div className="tg">
      <header className="tg-head">
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 2 }}>Realty · Дніпро</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1 }}>
            {session?.user.role === 'realtor' ? 'Огляд об\'єктів' : 'Знайдіть свій дім'}
          </div>
        </div>
        <button className="tg-back" onClick={() => navigate('/filters')} aria-label="filters">
          <IconFilter/>
        </button>
      </header>

      <div className="tg-body">
        <div style={{ padding: '8px 16px 12px' }}>
          <div className="input">
            <IconSearch width={18} height={18} stroke="var(--muted)"/>
            <input
              type="search"
              placeholder="Адреса, район, ЖК…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, border: 0, background: 'transparent', height: '100%' }}
            />
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div className="segment">
            <button className={deal === undefined ? 'on' : ''} onClick={() => setDeal(undefined)}>Усі</button>
            <button className={deal === 'sale' ? 'on' : ''} onClick={() => setDeal('sale')}>Купити</button>
            <button className={deal === 'rent' ? 'on' : ''} onClick={() => setDeal('rent')}>Оренда</button>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'flex-end' }}>
          <div className="segment" style={{ width: 140 }}>
            <button className={currency === 'USD' ? 'on' : ''} onClick={() => setCurrency('USD')}>USD</button>
            <button className={currency === 'UAH' ? 'on' : ''} onClick={() => setCurrency('UAH')}>UAH</button>
          </div>
        </div>

        {items === null && <div className="center-state">Завантаження…</div>}
        {items?.length === 0 && (
          <div className="center-state">
            <div className="t">Поки нічого не знайдено</div>
            <div>Спробуйте змінити фільтри</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
          {items?.map((p) => {
            const primaryMatches = p.price_currency === currency;
            const mainPrice = primaryMatches ? p.price_value : (p.price_value_secondary ?? p.price_value);
            const mainCur: Currency = primaryMatches ? p.price_currency : (p.price_currency_secondary ?? p.price_currency);
            const cover = p.photos.find((ph) => ph.is_cover) ?? p.photos[0];

            return (
              <div key={p.id} className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
                <div className="cover">
                  {cover ? (
                    <img src={cover.url} alt=""/>
                  ) : (
                    <div className="ph" style={{ width: '100%', height: '100%' }}/>
                  )}
                  <div className="badges">
                    {p.deal === 'rent' && <div className="tag accent">Оренда</div>}
                    {p.status === 'reserved' && <div className="tag gold">Зарезервовано</div>}
                  </div>
                  {session?.user.role === 'client' && (
                    <button className="fav" onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}>
                      {favIds.has(p.id) ? <IconHeartFilled width={18} height={18}/> : <IconHeart width={18} height={18}/>}
                    </button>
                  )}
                </div>
                <div className="body">
                  <div className="price">{fmtPrice(mainPrice, mainCur)}</div>
                  {p.price_value_secondary && (
                    <div className="price-sec">
                      ≈ {fmtPriceShort(
                        primaryMatches ? p.price_value_secondary : p.price_value,
                        primaryMatches ? (p.price_currency_secondary as Currency) : p.price_currency
                      )}
                    </div>
                  )}
                  <div className="addr" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconPin width={14} height={14} stroke="var(--muted)"/>
                    {p.address}{p.district ? ` · ${p.district}` : ''}
                  </div>
                  <div className="meta">
                    {p.rooms != null && <span>{p.rooms} кімн.</span>}
                    {p.area_total != null && <span>{fmtM2(p.area_total)}</span>}
                    {p.floor != null && p.floors_total != null && <span>{p.floor}/{p.floors_total} пов.</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
