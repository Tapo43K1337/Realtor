import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtPrice } from '../api';
import { IconPlus } from '../icons';

export function DashboardScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);

  useEffect(() => {
    api.dashboard().then(setStats).catch(() => {});
    api.listProperties({ status: 'draft', limit: 100 }).then((r) => setDrafts(r.items)).catch(() => {});
    api.listProperties({ status: 'active', limit: 100 }).then((r) => setActive(r.items)).catch(() => {});
  }, []);

  return (
    <div className="tg">
      <header className="tg-head">
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Кабінет</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Ріелтор</div>
        </div>
      </header>

      <div className="tg-body" style={{ padding: '8px 16px' }}>
        {stats && (
          <>
            <div className="row-2" style={{ marginBottom: 10 }}>
              <div className="stat">
                <div className="k">Активних об'єктів</div>
                <div className="v">{stats.active}</div>
              </div>
              <div className="stat">
                <div className="k">Закрито за 30д</div>
                <div className="v">{stats.sold_or_rented_30d}</div>
              </div>
            </div>
            <div className="row-2" style={{ marginBottom: 10 }}>
              <div className="stat">
                <div className="k">Заявки за 7д</div>
                <div className="v">{stats.leads_7d}</div>
                <div className="d">за місяць: {stats.leads_30d}</div>
              </div>
              <div className="stat">
                <div className="k">Перегляди за 7д</div>
                <div className="v">{stats.views_7d}</div>
                <div className="d">за місяць: {stats.views_30d}</div>
              </div>
            </div>
            <div className="row-2" style={{ marginBottom: 10 }}>
              <div className="stat">
                <div className="k">В обраному за 7д</div>
                <div className="v">{stats.saves_7d}</div>
              </div>
              <div className="stat">
                <div className="k">Усього клієнтів</div>
                <div className="v">{stats.total_clients}</div>
              </div>
            </div>

            {stats.top_property && (
              <div className="card-flat" style={{ padding: 14, marginBottom: 14 }}
                   onClick={() => navigate(`/property/${stats.top_property.id}`)}>
                <div className="eyebrow">Топ тижня</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{stats.top_property.address}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                  {fmtPrice(Number(stats.top_property.price_value), stats.top_property.price_currency)} · {stats.top_property.views_week} переглядів
                </div>
              </div>
            )}
          </>
        )}

        <button className="btn btn-secondary" onClick={() => navigate('/agent-profile')} style={{ marginBottom: 10, width: '100%' }}>
          Редагувати свій профіль
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/leads')} style={{ marginBottom: 10, width: '100%' }}>
          Усі заявки на перегляд
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/edit/new')} style={{ marginBottom: 20, width: '100%' }}>
          <IconPlus width={18} height={18}/> Додати об'єкт
        </button>

        {drafts.length > 0 && (
          <>
            <div className="eyebrow" style={{ padding: '8px 4px' }}>Чорнетки</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {drafts.map((p) => (
                <div key={p.id} className="card-flat" style={{ padding: 14 }} onClick={() => navigate(`/edit/${p.id}`)}>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>{p.address || 'Без адреси'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Чорнетка · {new Date(p.updated_at).toLocaleDateString('uk-UA')}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="eyebrow" style={{ padding: '8px 4px' }}>Активні об'єкти</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map((p) => (
            <div key={p.id} className="card-flat" style={{ padding: 14 }} onClick={() => navigate(`/property/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{p.address}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtPrice(Number(p.price_value), p.price_currency)}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {p.district || ''} · {p.rooms ? `${p.rooms} кімн.` : ''} {p.area_total ? `· ${p.area_total} м²` : ''}
              </div>
            </div>
          ))}
        </div>
        {/* Bottom spacer — clears tab bar + Telegram bottom chrome */}
        <div style={{ height: 'calc(env(safe-area-inset-bottom) + 120px)' }}/>
      </div>
    </div>
  );
}
