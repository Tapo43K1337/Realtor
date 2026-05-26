import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Header, showToast } from '../components';
import { useSession } from '../session';
import { tgHaptic } from '../tg';

export function BookViewingScreen() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
    if (!name.trim() || !phone.trim()) {
      setError('Заповніть імʼя та телефон');
      return;
    }
    setSubmitting(true);
    try {
      await api.createViewing({
        property_id: Number(propertyId),
        // No preferred time — the realtor will call to arrange it.
        scheduled_at: null,
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
          <label className="label">Ваше ім'я</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ім'я"/>
        </div>
        <div className="field">
          <label className="label">Телефон</label>
          <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380…"/>
        </div>
        <div className="field">
          <label className="label">Коментар (необов'язково)</label>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Бажаний час, побажання…"/>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}

        <button className="btn btn-accent" onClick={submit} disabled={submitting}>
          {submitting ? 'Надсилаю…' : 'Записатися'}
        </button>
        <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 14 }}>
          Ріелтор зв'яжеться найближчим часом, щоб узгодити зручний час перегляду.
        </div>
      </div>
    </div>
  );
}
