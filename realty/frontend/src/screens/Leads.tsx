import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtPrice } from '../api';
import { Header, showToast } from '../components';
import { openTelegramChat, tgConfirm } from '../tg';
import { IconPhone, IconTelegram } from '../icons';

export function LeadsScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'pending' | 'done' | 'cancelled_by_client' | 'all'>('pending');

  const load = () => {
    api.listViewings(status === 'all' ? undefined : status)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  };

  useEffect(load, [status]);

  return (
    <div className="tg">
      <Header title="Заявки"/>
      <div className="tg-body" style={{ padding: '8px 16px' }}>
        <div className="segment" style={{ marginBottom: 14 }}>
          <button className={status === 'pending' ? 'on' : ''} onClick={() => setStatus('pending')}>Нові</button>
          <button className={status === 'done' ? 'on' : ''} onClick={() => setStatus('done')}>Завершені</button>
          <button className={status === 'cancelled_by_client' ? 'on' : ''} onClick={() => setStatus('cancelled_by_client')}>Скасовані</button>
          <button className={status === 'all' ? 'on' : ''} onClick={() => setStatus('all')}>Усі</button>
        </div>

        {items.length === 0 && (
          <div className="center-state">
            <div className="t">Порожньо</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((v) => (
            <div key={v.id} className="card-flat" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {new Date(v.scheduled_at).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <div style={{ fontSize: 12, color: v.status === 'pending' ? 'var(--accent)' : 'var(--muted)' }}>
                  {v.status === 'pending' ? 'НОВА' : v.status === 'done' ? 'ЗАВЕРШЕНО' : 'СКАСОВАНО'}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }} onClick={() => navigate(`/property/${v.property_id}`)}>
                {v.address}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                {fmtPrice(Number(v.price_value), v.price_currency)}
              </div>
              <div style={{ marginTop: 10, fontSize: 14 }}>
                <strong>{v.client_name}</strong>
                <div style={{ color: 'var(--ink-2)' }}>{v.client_phone}</div>
                {v.client_username && <div style={{ color: 'var(--muted)' }}>@{v.client_username}</div>}
                {v.note && <div style={{ color: 'var(--ink-2)', marginTop: 6, fontStyle: 'italic' }}>{v.note}</div>}
              </div>

              {v.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <a className="btn btn-sm btn-secondary" href={`tel:${v.client_phone}`}>
                    <IconPhone width={14} height={14}/> Подзвонити
                  </a>
                  {v.client_username && (
                    <button className="btn btn-sm btn-secondary"
                            onClick={() => openTelegramChat(v.client_username, `Доброго дня! Щодо вашої заявки на перегляд ${v.address}.`)}>
                      <IconTelegram width={14} height={14}/> Telegram
                    </button>
                  )}
                  <button className="btn btn-sm btn-primary"
                          onClick={async () => {
                            await api.markViewingDone(v.id);
                            showToast('Помічено як завершене');
                            load();
                          }}>
                    Завершити
                  </button>
                  <button className="btn btn-sm btn-secondary"
                          onClick={async () => {
                            const ok = await tgConfirm('Скасувати заявку?');
                            if (!ok) return;
                            await api.cancelViewing(v.id);
                            showToast('Скасовано');
                            load();
                          }}>
                    Скасувати
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
