import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Header, showToast } from '../components';
import { useSession } from '../session';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [viewings, setViewings] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user.role !== 'client') return;
    api.me().then((r) => {
      setName(r.profile.name ?? `${r.profile.first_name ?? ''} ${r.profile.last_name ?? ''}`.trim());
      setPhone(r.profile.phone ?? '');
    });
    api.myViewings().then((r) => setViewings(r.items)).catch(() => {});
  }, [session]);

  const save = async () => {
    try {
      await api.saveProfile(name, phone);
      showToast('Збережено');
    } catch {
      showToast('Помилка збереження');
    }
  };

  return (
    <div className="tg">
      <header className="tg-head">
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Профіль</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
            {session?.user.firstName ?? 'Гість'}
          </div>
        </div>
      </header>
      <div className="tg-body" style={{ padding: '8px 16px' }}>
        <div style={{ padding: '12px 4px 8px' }} className="eyebrow">Контактні дані для записів</div>
        <div className="field">
          <label className="label">Ваше ім'я</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ім'я та прізвище"/>
        </div>
        <div className="field">
          <label className="label">Телефон</label>
          <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380…"/>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!name || !phone}>Зберегти</button>

        <div style={{ padding: '24px 4px 8px' }} className="eyebrow">Мої записи на перегляд</div>
        {viewings.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13.5, padding: '8px 4px' }}>
            Поки немає
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {viewings.map((v) => (
            <div key={v.id} className="card-flat" style={{ padding: 14 }} onClick={() => navigate(`/property/${v.property_id}`)}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {new Date(v.scheduled_at).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                {v.status === 'cancelled_by_client' && ' · скасовано'}
                {v.status === 'done' && ' · завершено'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{v.address}</div>
              {v.status === 'pending' && (
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ marginTop: 10 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const { tgConfirm } = await import('../tg');
                    const ok = await tgConfirm('Скасувати перегляд?');
                    if (!ok) return;
                    await api.cancelViewing(v.id);
                    setViewings((arr) => arr.map((x) => x.id === v.id ? { ...x, status: 'cancelled_by_client' } : x));
                    showToast('Перегляд скасовано');
                  }}
                >
                  Скасувати
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
