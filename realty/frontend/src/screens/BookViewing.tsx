import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Header, showToast } from '../components';
import { useSession } from '../session';
import { tgHaptic } from '../tg';

const MIN_HOURS = 2;

function minDateTimeLocal(): string {
  const now = new Date(Date.now() + MIN_HOURS * 3600 * 1000);
  now.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function BookViewingScreen() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [when, setWhen] = useState(minDateTimeLocal());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.role !== 'client') return;
    api.me().then((r) => {
      setName(r.profile.name ?? `${r.profile.first_name ?? ''} ${r.profile.last_name ?? ''}`.trim());
      setPhone(r.profile.phone ?? '');
    });
  }, [session]);

  const submit = async () => {
    setError(null);
    const at = new Date(when);
    const hours = (at.getTime() - Date.now()) / 36e5;
    if (hours < MIN_HOURS) {
      setError(`Оберіть час щонайменше за ${MIN_HOURS} години від зараз`);
      tgHaptic('error');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError('Заповніть імʼя та телефон');
      return;
    }
    setSubmitting(true);
    try {
      await api.createViewing({
        property_id: Number(propertyId),
        scheduled_at: at.toISOString(),
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim() || undefined,
        remember_profile: true,
      });
      tgHaptic('success');
      showToast('Заявку надіслано');
      navigate('/profile');
    } catch (e: any) {
      setError(e.message ?? 'Помилка');
      tgHaptic('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (session?.user.role !== 'client') {
    return (
      <div className="tg">
        <Header title="Запис на перегляд"/>
        <div className="center-state">
          <div className="t">Тільки для клієнтів</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tg">
      <Header title="Запис на перегляд"/>
      <div className="tg-body" style={{ padding: '16px' }}>
        <div className="field">
          <label className="label">Бажаний час</label>
          <input className="input" type="datetime-local" value={when} min={minDateTimeLocal()}
                 onChange={(e) => setWhen(e.target.value)}/>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
            Мінімум за {MIN_HOURS} години від поточного моменту
          </div>
        </div>
        <div className="field">
          <label className="label">Ваше ім'я</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ім'я"/>
        </div>
        <div className="field">
          <label className="label">Телефон</label>
          <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380…"/>
        </div>
        <div className="field">
          <label className="label">Коментар (необов'язково)</label>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Додаткові побажання"/>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}

        <button className="btn btn-accent" onClick={submit} disabled={submitting}>
          {submitting ? 'Надсилаю…' : 'Записатися'}
        </button>
        <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 14 }}>
          Рієлтор зв'яжеться найближчим часом для підтвердження.
        </div>
      </div>
    </div>
  );
}
