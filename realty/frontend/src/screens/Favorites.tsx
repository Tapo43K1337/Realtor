import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtPrice, fmtM2 } from '../api';
import { Header, Empty } from '../components';
import { useSession } from '../session';
import { IconPin, IconHeartFilled } from '../icons';

export function FavoritesScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    if (session?.user.role !== 'client') { setItems([]); return; }
    api.listFavorites().then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [session]);

  if (session?.user.role !== 'client') {
    return (
      <div className="tg">
        <Header title="Обране"/>
        <Empty title="Тільки для клієнтів" sub="Ріелтор не використовує обране"/>
      </div>
    );
  }

  return (
    <div className="tg">
      <header className="tg-head">
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Збережене</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Обране</div>
        </div>
      </header>
      <div className="tg-body" style={{ padding: '8px 16px' }}>
        {items === null && <div className="center-state">Завантаження…</div>}
        {items?.length === 0 && <Empty title="Поки порожньо" sub="Зберігайте об'єкти, щоб повернутися до них пізніше"/>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items?.map((p) => (
            <div key={p.id} className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
              <div className="cover">
                {p.cover_url ? <img src={p.cover_url} alt=""/> : <div className="ph" style={{ width: '100%', height: '100%' }}/>}
                <button className="fav" onClick={async (e) => {
                  e.stopPropagation();
                  await api.removeFavorite(p.id);
                  setItems((arr) => arr?.filter((x) => x.id !== p.id) ?? null);
                }}>
                  <IconHeartFilled width={18} height={18}/>
                </button>
              </div>
              <div className="body">
                <div className="price">{fmtPrice(Number(p.price_value), p.price_currency)}</div>
                <div className="addr" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconPin width={14} height={14} stroke="var(--muted)"/>
                  {p.address}{p.district ? ` · ${p.district}` : ''}
                </div>
                <div className="meta">
                  {p.rooms != null && <span>{p.rooms} кімн.</span>}
                  {p.area_total != null && <span>{fmtM2(Number(p.area_total))}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
