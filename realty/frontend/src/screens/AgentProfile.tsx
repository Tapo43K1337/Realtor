import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { TgHeader, showToast } from '../components';
import { I } from '../icons';
import type { Agent } from '../types';

export function AgentProfileScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [a, setA] = useState<Agent>({
    id: 0,
    name: '',
    position: '',
    experience_years: 0,
    deals_count: 0,
    bio: '',
    phone: '',
    tg_username: '',
    languages: [],
    photo: '',
  });
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.me().then((r: any) => {
      if (r.role === 'realtor' && r.profile) {
        const p = r.profile;
        setA({
          id: p.id,
          name: p.name ?? '',
          position: p.position ?? '',
          experience_years: p.experience_years ?? 0,
          deals_count: p.deals_count ?? 0,
          bio: p.bio ?? '',
          phone: p.phone ?? '',
          tg_username: p.tg_username ?? '',
          languages: p.languages ?? [],
          photo: p.photo ?? '',
        });
        setPhotoUrl(p.photo ?? '');
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateAgentMe({
        name: a.name,
        position: a.position || null,
        experience_years: Number(a.experience_years) || 0,
        deals_count: Number(a.deals_count) || 0,
        bio: a.bio || null,
        phone: a.phone || null,
        tg_username: a.tg_username || null,
        languages: a.languages ?? [],
      });
      showToast('Збережено');
    } catch {
      showToast('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const r = await api.uploadAgentPhoto(f);
      setPhotoUrl(r.photo);
      setA((x) => ({ ...x, photo: r.photo }));
      showToast('Фото оновлено');
    } catch {
      showToast('Помилка завантаження фото');
    }
    // reset input so the same file can be picked again
    e.target.value = '';
  };

  const LANGS = ['Українська', 'English', 'Русский', 'Polski', 'Deutsch'];
  const toggleLang = (l: string) => {
    setA((x) => {
      const has = (x.languages ?? []).includes(l);
      const next = has ? (x.languages ?? []).filter((v) => v !== l) : [...(x.languages ?? []), l];
      return { ...x, languages: next };
    });
  };

  if (loading) return <div className="tg"><TgHeader title="Профіль ріелтора"/><div className="center-state">Завантаження…</div></div>;

  const photoSrc = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : photoUrl) : '';

  return (
    <div className="tg" style={{ position: 'relative' }}>
      <TgHeader title="Профіль ріелтора"/>

      <div className="tg-body" style={{ overflowY: 'auto', paddingBottom: 110 }}>

        {/* Photo */}
        <div style={{ padding: '8px 16px 0' }}>
          <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={onPickFile}
              style={{
                width: 84, height: 84, borderRadius: 100, overflow: 'hidden',
                position: 'relative', flexShrink: 0,
                background: photoSrc ? '#000' : 'var(--bg-2)',
                border: '0.5px solid var(--hair)',
              }}
            >
              {photoSrc ? (
                <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              ) : (
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>Фото</span>
              )}
              <span style={{
                position: 'absolute', right: -2, bottom: -2,
                width: 28, height: 28, borderRadius: 100,
                background: 'var(--ink)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg)',
              }}>{I.plus({ s: 14, c: '#fff' })}</span>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Ваше фото</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
                Натисніть на коло щоб обрати фото. Воно буде показано клієнтам поряд з вашими об'єктами.
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange}/>
          </div>
        </div>

        {/* Identity */}
        <div style={{ padding: '14px 16px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Особисті дані</div>
          <div className="field">
            <label className="label">Ім'я та прізвище</label>
            <input className="input" value={a.name ?? ''} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder="Олена Кравченко"/>
          </div>
          <div className="field">
            <label className="label">Посада</label>
            <input className="input" value={a.position ?? ''} onChange={(e) => setA({ ...a, position: e.target.value })} placeholder="Провідний ріелтор"/>
          </div>
          <div className="row-2">
            <div className="field">
              <label className="label">Досвід (років)</label>
              <input className="input" inputMode="numeric" value={a.experience_years ?? 0} onChange={(e) => setA({ ...a, experience_years: Number(e.target.value) || 0 })}/>
            </div>
            <div className="field">
              <label className="label">Угод проведено</label>
              <input className="input" inputMode="numeric" value={a.deals_count ?? 0} onChange={(e) => setA({ ...a, deals_count: Number(e.target.value) || 0 })}/>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ padding: '6px 16px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Про себе</div>
          <div className="field">
            <textarea
              className="textarea"
              value={a.bio ?? ''}
              onChange={(e) => setA({ ...a, bio: e.target.value })}
              placeholder="Декілька речень про ваш досвід, спеціалізацію, підхід до клієнтів…"
              rows={6}
            />
          </div>
        </div>

        {/* Contact */}
        <div style={{ padding: '6px 16px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Контакти</div>
          <div className="field">
            <label className="label">Телефон</label>
            <input className="input" inputMode="tel" value={a.phone ?? ''} onChange={(e) => setA({ ...a, phone: e.target.value })} placeholder="+380…"/>
          </div>
          <div className="field">
            <label className="label">Telegram username</label>
            <input className="input" value={a.tg_username ?? ''} onChange={(e) => setA({ ...a, tg_username: e.target.value.replace(/^@/, '') })} placeholder="username (без @)"/>
          </div>
        </div>

        {/* Languages */}
        <div style={{ padding: '6px 16px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Мови спілкування</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGS.map((l) => {
              const on = (a.languages ?? []).includes(l);
              return (
                <button
                  key={l}
                  className={'chip ' + (on ? 'solid' : '')}
                  onClick={() => toggleLang(l)}
                >
                  {on && I.check({ s: 12, c: '#fff' })} {l}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 100 }}/>
      </div>

      {/* Sticky save bar */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'var(--tg-content-bottom)',
        padding: '12px 16px calc(env(safe-area-inset-bottom) + 14px)',
        borderTop: '0.5px solid var(--hair)',
        background: 'var(--bg)',
        zIndex: 2000,
        boxShadow: '0 -8px 24px rgba(20,19,15,0.08)',
      }}>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={saving || !a.name} onClick={save}>
          {saving ? 'Зберігаю…' : 'Зберегти зміни'}
        </button>
      </div>
    </div>
  );
}
