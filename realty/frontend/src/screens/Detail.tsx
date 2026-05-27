import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, fmtPrice, fmtM2 } from '../api';
import type { Property } from '../types';
import { Loading, showToast } from '../components';
import { I, IconHeart, IconHeartFilled, IconShare, IconPhone, IconTelegram, IconCalendar, IconPin, IconBed, IconArea, IconFloor } from '../icons';
import { useSession } from '../session';
import { openTelegramChat, shareViaTelegram, shareMessage, tgPopup, tg } from '../tg';
import { cap } from '../utils/format';

// Three snap positions for the bottom sheet, expressed as fractions of the
// viewport height. Heights are computed at runtime so it scales to any device.
// peek (0): hero photo dominant ·  mid (1): balanced ·  full (2): sheet covers photo
const SNAP_FRACTIONS = [0.62, 0.42, 0.10] as const;

export function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [data, setData] = useState<{ property: Property; rate: number } | null>(null);
  const [fav, setFav] = useState(false);

  // Sheet state — index into SNAP_FRACTIONS; default to "mid"
  const [snap, setSnap] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Viewport height — recompute on resize / Telegram viewport changes so snap
  // positions stay in sync when the on-screen keyboard or Telegram chrome resize
  // the visible area.
  const [vh, setVh] = useState(() => (tg?.viewportStableHeight || tg?.viewportHeight || window.innerHeight));
  useEffect(() => {
    const onResize = () => setVh(tg?.viewportStableHeight || tg?.viewportHeight || window.innerHeight);
    window.addEventListener('resize', onResize);
    tg?.onEvent?.('viewportChanged', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      tg?.offEvent?.('viewportChanged', onResize);
    };
  }, []);

  // Photo carousel — track current index for the "N / total" pill
  const [photoIdx, setPhotoIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const onHeroScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const w = e.currentTarget.clientWidth;
    if (!w) return;
    const i = Math.round(e.currentTarget.scrollLeft / w);
    if (i !== photoIdx) setPhotoIdx(i);
  };

  useEffect(() => {
    api.getProperty(Number(id)).then(setData).catch(() => setData(null));
    if (session?.user.role === 'client') {
      api.listFavorites().then((r) => {
        setFav(r.items.some((i: any) => i.id === Number(id)));
      }).catch(() => {});
    }
  }, [id, session]);

  if (!data) return <div className="tg"><Loading/></div>;
  const p = data.property;
  const photos = p.photos.length > 0 ? p.photos : [{ id: 0, url: '', thumb_url: null, is_cover: true } as any];

  const toggleFav = async () => {
    if (session?.user.role !== 'client') {
      showToast('Обране доступне лише клієнтам');
      return;
    }
    try {
      if (fav) { await api.removeFavorite(p.id); setFav(false); }
      else { await api.addFavorite(p.id); setFav(true); showToast("Додано в обране"); }
    } catch (err: any) {
      const status = err?.status;
      if (status === 401) showToast('Сесія застаріла, перезайдіть');
      else if (status === 403) showToast('Лише клієнти можуть зберігати об\'єкти');
      else showToast(`Не вдалося оновити обране${status ? ` (${status})` : ''}`);
    }
  };

  const shareIt = async () => {
    api.shareProperty(p.id).catch(() => {});
    try {
      const prep = await api.preparePropertyShare(p.id);
      const ok = await shareMessage(prep.id);
      if (ok) return;
    } catch { /* fall through */ }
    const botUsername = (import.meta.env.VITE_BOT_USERNAME as string) || '';
    const url = botUsername
      ? `https://t.me/${botUsername}/app?startapp=property_${p.id}`
      : window.location.href;
    shareViaTelegram(url, `${p.address} · ${fmtPrice(p.price_value, p.price_currency)}`);
  };

  const writeTelegram = () => {
    if (!p.agent?.tg_username) return;
    const tmpl = `Доброго дня! Цікавить ${p.type === 'house' ? 'будинок' : p.type === 'apartment' ? 'квартира' : "об'єкт"} за адресою ${p.address}, ціна ${fmtPrice(p.price_value, p.price_currency)}. Чи можна дізнатися деталі?`;
    openTelegramChat(p.agent.tg_username, tmpl);
  };

  // tel: URIs only accept digits, +, *, #, comma — strip everything else.
  const telHref = p.agent?.phone
    ? `tel:${p.agent.phone.replace(/[^\d+]/g, '')}`
    : undefined;

  const closeProperty = async () => {
    const choice = await tgPopup({
      title: "Закрити об'єкт",
      message: "Оберіть статус закриття",
      buttons: [
        { id: 'sold', type: 'default', text: p.deal === 'rent' ? 'Успішно здано' : 'Успішно продано' },
        { id: 'withdrawn', type: 'destructive', text: 'Відмова / зняти з продажу' },
        { id: 'cancel', type: 'cancel' },
      ],
    });
    if (!choice || choice === 'cancel') return;
    try {
      await api.closeProperty(p.id, choice === 'sold' ? 'sold_rented' : 'withdrawn');
      showToast("Статус оновлено");
      navigate('/dashboard');
    } catch {
      showToast('Помилка оновлення статусу');
    }
  };

  const isOwner = session?.user.role === 'realtor';

  // Compute pixel snap positions from viewport. Top inset clears Telegram chrome
  // + our glass header so back/share/heart stay tappable at the full snap.
  const topInset = 96;
  const SNAPS = SNAP_FRACTIONS.map((f, i) => i === 2 ? Math.max(topInset, vh * f) : vh * f);
  const baseTop = SNAPS[snap];
  const liveTop = Math.max(topInset, Math.min(vh - 120, baseTop + dragOffset));

  // Hero photo height — large enough to fill behind the lowest snap (peek)
  const heroHeight = Math.max(SNAPS[0] + 80, vh * 0.7);

  // When sheet is fully expanded, fade hero a bit (it's mostly hidden anyway)
  const photoOpacity = snap === 2 && !isDragging ? 0.4 : 1;

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartY.current = e.clientY;
    setDragOffset(0);
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    setDragOffset(e.clientY - dragStartY.current);
  };
  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const moved = dragOffset;
    setDragOffset(0);
    // Tap (no real drag) → ignore
    if (Math.abs(moved) < 6) return;
    // Find nearest snap based on where the sheet ended up
    const target = baseTop + moved;
    let best = 0, bd = Infinity;
    SNAPS.forEach((s, i) => { const d = Math.abs(s - target); if (d < bd) { bd = d; best = i; } });
    setSnap(best);
  };

  const sheetTransition = isDragging ? 'none' : 'top .35s cubic-bezier(.22,.6,.36,1)';

  return (
    <div className="tg" style={{ overflow: 'hidden', height: '100vh', position: 'relative' }}>
      {/* Hero photo carousel — fixed at top, slides cover the full width */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: heroHeight,
          opacity: photoOpacity, transition: 'opacity .25s ease',
          background: '#cfc7b9',
        }}
      >
        <div
          ref={heroRef}
          className="hero-strip"
          onScroll={onHeroScroll}
          onClick={() => navigate(`/property/${p.id}/gallery`)}
          style={{
            display: 'flex',
            width: '100%', height: '100%',
            overflowX: 'auto', overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {photos.map((ph) => (
            <div key={ph.id} style={{ flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
              {ph.url
                ? <img src={ph.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                : <div className="ph" style={{ width: '100%', height: '100%' }}/>
              }
            </div>
          ))}
        </div>
        {/* Top gradient for header legibility */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: 140,
          background: 'linear-gradient(180deg, rgba(20,19,15,0.32) 0%, rgba(20,19,15,0) 100%)',
          pointerEvents: 'none',
        }}/>
      </div>

      {/* Glass header — back / share / favorite. Manual flex layout because we
         need 3-4 action buttons on the right, which doesn't fit .tg-head's
         3-column grid. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'calc(max(env(safe-area-inset-top), var(--tg-safe-top)) + var(--tg-content-top) + 12px) 16px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 6,
        pointerEvents: 'none',
      }}>
        <button className="tg-back" aria-label="back" onClick={() => navigate(-1)} style={{ pointerEvents: 'auto' }}>
          {I.back({ s: 16 })}
        </button>
        <div style={{ flex: 1 }}/>
        <button className="tg-back" aria-label="share" onClick={shareIt} style={{ pointerEvents: 'auto' }}>
          {I.share({ s: 16 })}
        </button>
        {session?.user.role === 'client' && (
          <button className="tg-back" aria-label="favorite" onClick={toggleFav} style={{ pointerEvents: 'auto' }}>
            {fav ? <IconHeartFilled width={16} height={16}/> : <IconHeart width={16} height={16}/>}
          </button>
        )}
      </div>

      {/* Photo counter pill — sits just above sheet's top edge */}
      {photos[0]?.url && (
        <button
          onClick={() => navigate(`/property/${p.id}/gallery`)}
          style={{
            position: 'absolute', right: 16,
            top: Math.max(liveTop - 48, topInset + 60),
            height: 32, padding: '0 12px', borderRadius: 100,
            display: snap === 2 ? 'none' : 'flex',
            alignItems: 'center', gap: 6, color: '#fff', fontSize: 12, fontWeight: 600,
            background: 'rgba(20,19,15,0.55)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            transition: isDragging ? 'none' : 'top .35s cubic-bezier(.22,.6,.36,1)',
            zIndex: 5,
          }}
        >
          {I.expand({ s: 13, c: '#fff' })}
          <span>{photoIdx + 1}</span>
          <span style={{ opacity: 0.7 }}>/ {photos.length}</span>
        </button>
      )}

      {/* BOTTOM SHEET */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: liveTop, bottom: 0,
        background: 'var(--bg)',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -10px 30px rgba(20,19,15,0.12)',
        transition: sheetTransition,
        zIndex: 7,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Drag handle — large hit area, real pointer drag */}
        <div
          style={{
            padding: '10px 0 6px',
            touchAction: 'none', cursor: 'grab', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span style={{
            width: isDragging ? 46 : 38, height: 5, borderRadius: 3,
            background: isDragging ? 'rgba(20,19,15,0.4)' : 'rgba(20,19,15,0.18)',
            transition: 'width .15s, background .15s',
          }}/>
        </div>

        {/* Scrollable content inside the sheet. Bottom padding clears either the
           sticky CTA (client) or the Telegram bottom chrome (realtor without CTA). */}
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          paddingBottom: !isOwner
            ? 'calc(env(safe-area-inset-bottom) + var(--tg-content-bottom) + 110px)'
            : 'calc(env(safe-area-inset-bottom) + var(--tg-content-bottom) + 28px)',
        } as CSSProperties}>
          <div style={{ padding: '6px 20px 0' }}>
            <div className="eyebrow">
              {p.type === 'house' ? 'Будинок' : p.type === 'apartment' ? 'Квартира' : p.type === 'commercial' ? 'Комерція' : 'Земля'}
              {p.deal === 'rent' ? ' · оренда' : ''}
            </div>
            <div className="h-display" style={{ fontSize: 32, lineHeight: 1.05, marginTop: 8 }}>
              {fmtPrice(p.price_value, p.price_currency)}
            </div>
            {p.price_value_secondary && p.price_currency_secondary && (
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                ≈ {fmtPrice(p.price_value_secondary, p.price_currency_secondary)}
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)', fontSize: 13.5 }}>
              <IconPin width={16} height={16}/>
              <span>{p.address}{p.district ? ` · ${p.district}` : ''}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="row-3" style={{ padding: '20px 16px 0' }}>
            {p.rooms != null && <StatBox icon={<IconBed/>} k="Кімнат" v={String(p.rooms)}/>}
            {p.area_total != null && <StatBox icon={<IconArea/>} k="Площа" v={fmtM2(p.area_total)}/>}
            {p.floor != null && p.floors_total != null && <StatBox icon={<IconFloor/>} k="Поверх" v={`${p.floor}/${p.floors_total}`}/>}
          </div>

          {p.description && (
            <div style={{ padding: '24px 20px 0' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Опис</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
                {p.description}
              </div>
            </div>
          )}

          {!!p.features?.length && (
            <div style={{ padding: '24px 20px 0' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Особливості</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.features.map((f) => <span key={f} className="chip">{f}</span>)}
              </div>
            </div>
          )}

          {/* Specs */}
          <div style={{ padding: '24px 20px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Характеристики</div>
            <div className="card-flat" style={{ padding: '4px 16px' }}>
              <Spec k="Тип будинку" v={cap(p.building_type)}/>
              <Spec k="Стан" v={cap(p.condition)}/>
              <Spec k="Рік будівництва" v={p.year_built}/>
              <Spec k="Площа житлова" v={p.area_living ? fmtM2(p.area_living) : null}/>
              <Spec k="Площа кухні" v={p.area_kitchen ? fmtM2(p.area_kitchen) : null}/>
              <Spec k="Опалення" v={p.heating_type}/>
              <Spec k="Балкон" v={p.balcony}/>
              <Spec k="Паркінг" v={p.parking}/>
              <Spec k="Санвузол" v={p.bathroom}/>
              <Spec k="Висота стелі" v={p.ceiling_height ? `${p.ceiling_height} м` : null}/>
              <Spec k="Документи" v={p.documents}/>
              <Spec k="ЖК" v={p.complex_name}/>
              {p.deal === 'rent' && <>
                <Spec k="Меблі" v={p.furniture}/>
                <Spec k="Техніка" v={p.appliances}/>
                <Spec k="Можна з дітьми" v={p.kids_allowed === true ? 'Так' : p.kids_allowed === false ? 'Ні' : null}/>
                <Spec k="Можна з тваринами" v={p.pets_allowed === true ? 'Так' : p.pets_allowed === false ? 'Ні' : null}/>
                <Spec k="Комуналка включена" v={p.utilities_included === true ? 'Так' : p.utilities_included === false ? 'Ні' : null}/>
                <Spec k="Завдаток" v={p.deposit ? fmtPrice(p.deposit, p.price_currency) : null}/>
              </>}
            </div>
          </div>

          {/* Agent */}
          {p.agent && (
            <div style={{ padding: '24px 16px 0' }}>
              <div className="card-flat" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#cfc7b9', overflow: 'hidden', flexShrink: 0 }}>
                  {p.agent.photo && <img src={p.agent.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{p.agent.name}</div>
                  {p.agent.position && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{p.agent.position}</div>}
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                    {p.agent.experience_years ? `Досвід ${p.agent.experience_years} р.` : ''}
                    {p.agent.deals_count ? ` · ${p.agent.deals_count} угод` : ''}
                  </div>
                </div>
              </div>
              {p.agent.bio && (
                <div style={{ fontSize: 13, color: 'var(--ink-2)', padding: '10px 4px 0', lineHeight: 1.5 }}>
                  {p.agent.bio}
                </div>
              )}
            </div>
          )}

          {/* Owner-only actions (realtor controls live inside the scroll so the
             sticky CTA below stays focused on the client lead actions) */}
          {isOwner && (
            <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => navigate(`/edit/${p.id}`)}>Редагувати</button>
              <button className="btn btn-secondary" onClick={closeProperty}>Закрити об'єкт</button>
            </div>
          )}
        </div>

        {/* Sticky CTA at sheet bottom — client lead actions */}
        {!isOwner && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '12px 16px calc(env(safe-area-inset-bottom) + var(--tg-content-bottom) + 14px)',
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '0.5px solid var(--hair-2)',
            display: 'flex', gap: 10,
          }}>
            {telHref && (
              <a className="btn btn-secondary" href={telHref} style={{ width: 50, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-label="call">
                <IconPhone width={20} height={20}/>
              </a>
            )}
            {p.agent?.tg_username && (
              <button className="btn btn-secondary" onClick={writeTelegram} style={{ width: 50, padding: 0 }} aria-label="telegram">
                <IconTelegram width={20} height={20}/>
              </button>
            )}
            <button className="btn btn-accent" onClick={() => navigate(`/book/${p.id}`)} style={{ flex: 1 }}>
              <IconCalendar width={18} height={18}/> Записатися на перегляд
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, k, v }: { icon: any; k: string; v: string }) {
  return (
    <div className="stat" style={{ alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--muted)' }}>{icon}</div>
      <div className="k">{k}</div>
      <div className="v" style={{ fontSize: 20 }}>{v}</div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: any }) {
  if (v == null || v === '') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--hair-2)', fontSize: 13.5 }}>
      <div style={{ color: 'var(--muted)' }}>{k}</div>
      <div style={{ color: 'var(--ink-2)', fontWeight: 500, textAlign: 'right' }}>{v}</div>
    </div>
  );
}
