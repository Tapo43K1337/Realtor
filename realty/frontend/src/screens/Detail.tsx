import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, fmtPrice, fmtM2 } from '../api';
import type { Property } from '../types';
import { Header, Loading, showToast } from '../components';
import { IconHeart, IconHeartFilled, IconShare, IconPhone, IconTelegram, IconCalendar, IconPin, IconBed, IconArea, IconFloor } from '../icons';
import { useSession } from '../session';
import { openTelegramChat, shareViaTelegram, tgConfirm } from '../tg';

export function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [data, setData] = useState<{ property: Property; rate: number } | null>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    api.getProperty(Number(id)).then(setData).catch(() => setData(null));
    if (session?.user.role === 'client') {
      api.listFavorites().then((r) => {
        setFav(r.items.some((i: any) => i.id === Number(id)));
      });
    }
  }, [id, session]);

  if (!data) return <div className="tg"><Header title="Завантаження"/><Loading/></div>;
  const p = data.property;

  const cover = p.photos.find((ph) => ph.is_cover) ?? p.photos[0];

  const toggleFav = async () => {
    if (session?.user.role !== 'client') return;
    if (fav) { await api.removeFavorite(p.id); setFav(false); }
    else { await api.addFavorite(p.id); setFav(true); showToast("Додано в обране"); }
  };

  const shareIt = async () => {
    await api.shareProperty(p.id).catch(() => {});
    const botUsername = (import.meta.env.VITE_BOT_USERNAME as string) || '';
    const url = botUsername
      ? `https://t.me/${botUsername}/app?startapp=property_${p.id}`
      : window.location.href;
    const text = `${p.address} · ${fmtPrice(p.price_value, p.price_currency)}`;
    shareViaTelegram(url, text);
  };

  const writeTelegram = () => {
    if (!p.agent?.tg_username) return;
    const tmpl = `Доброго дня! Цікавить ${p.type === 'house' ? 'будинок' : p.type === 'apartment' ? 'квартира' : "об'єкт"} за адресою ${p.address}, ціна ${fmtPrice(p.price_value, p.price_currency)}. Чи можна дізнатися деталі?`;
    openTelegramChat(p.agent.tg_username, tmpl);
  };

  const closeProperty = async () => {
    const sold = await tgConfirm("Помітити як продано/здано? (інакше — знято з продажу)");
    await api.closeProperty(p.id, sold ? 'sold_rented' : 'withdrawn');
    showToast("Статус оновлено");
    navigate('/dashboard');
  };

  const isOwner = session?.user.role === 'realtor';

  return (
    <div className="tg">
      <Header over title=""/>

      <div className="tg-body" style={{ paddingTop: 0 }}>
        {/* Hero photo */}
        <div style={{ position: 'relative', aspectRatio: '4/3', background: '#cfc7b9' }}
             onClick={() => navigate(`/property/${p.id}/gallery`)}>
          {cover ? <img src={cover.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> :
                   <div className="ph" style={{ width: '100%', height: '100%' }}/>}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
            {session?.user.role === 'client' && (
              <button className="fav" onClick={(e) => { e.stopPropagation(); toggleFav(); }}>
                {fav ? <IconHeartFilled width={18} height={18}/> : <IconHeart width={18} height={18}/>}
              </button>
            )}
            <button className="fav" onClick={(e) => { e.stopPropagation(); shareIt(); }}>
              <IconShare width={18} height={18}/>
            </button>
          </div>
          {p.photos.length > 1 && (
            <div className="glass" style={{
              position: 'absolute', bottom: 14, right: 14, padding: '6px 10px', borderRadius: 100,
              fontSize: 12, fontWeight: 600,
            }}>
              {p.photos.length} фото
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div className="eyebrow">{p.type === 'house' ? 'Будинок' : p.type === 'apartment' ? 'Квартира' : p.type === 'commercial' ? 'Комерція' : 'Земля'}{p.deal === 'rent' ? ' · оренда' : ''}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, marginTop: 4 }}>
            {fmtPrice(p.price_value, p.price_currency)}
          </div>
          {p.price_value_secondary && p.price_currency_secondary && (
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              ≈ {fmtPrice(p.price_value_secondary, p.price_currency_secondary)}
            </div>
          )}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
            <IconPin width={16} height={16}/>
            <span>{p.address}{p.district ? ` · ${p.district}` : ''}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="row-3" style={{ padding: '0 16px' }}>
          {p.rooms != null && <StatBox icon={<IconBed/>} k="Кімнат" v={String(p.rooms)}/>}
          {p.area_total != null && <StatBox icon={<IconArea/>} k="Площа" v={fmtM2(p.area_total)}/>}
          {p.floor != null && p.floors_total != null && <StatBox icon={<IconFloor/>} k="Поверх" v={`${p.floor}/${p.floors_total}`}/>}
        </div>

        {p.description && (
          <div style={{ padding: '20px' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Опис</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
              {p.description}
            </div>
          </div>
        )}

        {!!p.features?.length && (
          <div style={{ padding: '4px 16px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 10, padding: '0 4px' }}>Особливості</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {p.features.map((f) => <span key={f} className="chip">{f}</span>)}
            </div>
          </div>
        )}

        {/* Specs */}
        <div style={{ padding: '0 20px 20px' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Характеристики</div>
          <div className="card-flat" style={{ padding: '4px 16px' }}>
            <Spec k="Тип будинку" v={p.building_type}/>
            <Spec k="Стан" v={p.condition}/>
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
          <div style={{ padding: '0 16px 20px' }}>
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

        {/* Actions */}
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!isOwner && (
            <>
              <button className="btn btn-accent" onClick={() => navigate(`/book/${p.id}`)}>
                <IconCalendar width={18} height={18}/> Записатися на перегляд
              </button>
              {p.agent?.tg_username && (
                <button className="btn btn-secondary" onClick={writeTelegram}>
                  <IconTelegram width={18} height={18}/> Написати в Telegram
                </button>
              )}
              {p.agent?.phone && (
                <a className="btn btn-secondary" href={`tel:${p.agent.phone}`}>
                  <IconPhone width={18} height={18}/> Подзвонити
                </a>
              )}
            </>
          )}
          {isOwner && (
            <>
              <button className="btn btn-primary" onClick={() => navigate(`/edit/${p.id}`)}>Редагувати</button>
              <button className="btn btn-secondary" onClick={closeProperty}>Закрити об'єкт</button>
            </>
          )}
        </div>
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
