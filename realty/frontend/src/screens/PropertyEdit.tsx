import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { Header, showToast } from '../components';
import { tgConfirm, tgHaptic } from '../tg';
import { IconPlus, IconTrash, IconPin } from '../icons';
import { cap } from '../utils/format';
import type { Currency, PropertyType, DealType, Photo } from '../types';

const DNIPRO: [number, number] = [48.4647, 35.0462];

const DISTRICTS = [
  'Соборний', 'Шевченківський', 'Центральний',
  'Чечелівський', 'Новокодацький', 'Самарський',
  'Амур-Нижньодніпровський', 'Індустріальний',
];
const BUILDING_TYPES = ['новобудова', 'вторинка', 'сталінка', 'хрущовка', 'чешка', 'інше'];
const CONDITIONS = ['дизайн-ремонт', 'євроремонт', 'жиле', 'під ремонт', 'без ремонту'];

const pinIcon = L.divIcon({
  className: 'pin-marker-wrap',
  html: `<div style="font-size:28px;color:var(--accent)">📍</div>`,
  iconSize: [28, 28], iconAnchor: [14, 28],
});

function PickPoint({ value, onChange }: { value: [number, number] | null; onChange: (v: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return value ? <Marker position={value} icon={pinIcon}/> : null;
}

type Form = {
  type: PropertyType;
  deal: DealType;
  status: 'draft' | 'active';
  price_value: string;
  price_currency: Currency;
  price_value_secondary: string;
  manual_secondary: boolean;
  address: string;
  district: string;
  complex_name: string;
  lat: number | null;
  lng: number | null;
  area_total: string;
  area_living: string;
  area_kitchen: string;
  rooms: string;
  floor: string;
  floors_total: string;
  year_built: string;
  building_type: string;
  condition: string;
  description: string;
  heating_type: string;
  balcony: string;
  parking: string;
  furniture: string;
  appliances: string;
  kids_allowed: boolean | null;
  pets_allowed: boolean | null;
  deposit: string;
  utilities_included: boolean | null;
  bathroom: string;
  ceiling_height: string;
  documents: string;
  plot_area: string;
  features: string[];
};

const empty: Form = {
  type: 'apartment', deal: 'sale', status: 'draft',
  price_value: '', price_currency: 'USD', price_value_secondary: '', manual_secondary: false,
  address: '', district: '', complex_name: '',
  lat: null, lng: null,
  area_total: '', area_living: '', area_kitchen: '',
  rooms: '', floor: '', floors_total: '', year_built: '',
  building_type: '', condition: '', description: '',
  heating_type: '', balcony: '', parking: '', furniture: '', appliances: '',
  kids_allowed: null, pets_allowed: null, deposit: '', utilities_included: null,
  bathroom: '', ceiling_height: '', documents: '', plot_area: '',
  features: [],
};

export function PropertyEditScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialEditing = !!(id && id !== 'new');
  // When the user is on /edit/new and uploads a photo before saving, we auto-
  // create a draft and remember the id locally so subsequent photo ops & the
  // final save target the same row (no navigation needed).
  const [createdId, setCreatedId] = useState<number | null>(null);
  const propId: number | null = initialEditing ? Number(id) : createdId;
  const isEditing = propId != null;
  const [form, setForm] = useState<Form>(empty);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [featureInput, setFeatureInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  // After ensureDraft → navigate(replace), we don't want the useEffect to refetch
  // the property and clobber form state the user may have kept typing into.
  const justCreated = useRef(false);

  useEffect(() => {
    api.usdRate().then((r) => setRate(r.usd_uah)).catch(() => {});
  }, []);

  useEffect(() => {
    if (justCreated.current) {
      // Fresh draft just created in-place — keep current form/photo state.
      justCreated.current = false;
      return;
    }
    if (initialEditing) {
      api.getProperty(Number(id)).then(({ property: p }) => {
        setForm({
          type: p.type, deal: p.deal, status: p.status === 'draft' ? 'draft' : 'active',
          price_value: String(p.price_value ?? ''),
          price_currency: p.price_currency,
          price_value_secondary: p.price_value_secondary != null ? String(p.price_value_secondary) : '',
          manual_secondary: false,
          address: p.address ?? '',
          district: p.district ?? '',
          complex_name: p.complex_name ?? '',
          lat: p.lat ?? null, lng: p.lng ?? null,
          area_total: p.area_total != null ? String(p.area_total) : '',
          area_living: p.area_living != null ? String(p.area_living) : '',
          area_kitchen: p.area_kitchen != null ? String(p.area_kitchen) : '',
          rooms: p.rooms != null ? String(p.rooms) : '',
          floor: p.floor != null ? String(p.floor) : '',
          floors_total: p.floors_total != null ? String(p.floors_total) : '',
          year_built: p.year_built != null ? String(p.year_built) : '',
          building_type: p.building_type ?? '',
          condition: p.condition ?? '',
          description: p.description ?? '',
          heating_type: p.heating_type ?? '',
          balcony: p.balcony ?? '',
          parking: p.parking ?? '',
          furniture: p.furniture ?? '',
          appliances: p.appliances ?? '',
          kids_allowed: p.kids_allowed ?? null,
          pets_allowed: p.pets_allowed ?? null,
          deposit: p.deposit != null ? String(p.deposit) : '',
          utilities_included: p.utilities_included ?? null,
          bathroom: p.bathroom ?? '',
          ceiling_height: p.ceiling_height != null ? String(p.ceiling_height) : '',
          documents: p.documents ?? '',
          plot_area: p.plot_area != null ? String(p.plot_area) : '',
          features: p.features ?? [],
        });
        setPhotos(p.photos);
      });
    }
  }, [id]);

  // Auto-compute secondary price when primary changes (if not manually set)
  useEffect(() => {
    if (form.manual_secondary || !rate) return;
    const v = Number(form.price_value);
    if (!v) { setForm((f) => ({ ...f, price_value_secondary: '' })); return; }
    const sc: Currency = form.price_currency === 'USD' ? 'UAH' : 'USD';
    const converted = form.price_currency === 'USD' ? v * rate : v / rate;
    setForm((f) => ({ ...f, price_value_secondary: String(Math.round(converted * 100) / 100) }));
    void sc;
  }, [form.price_value, form.price_currency, rate, form.manual_secondary]);

  const upd = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const buildBody = (publish: boolean) => {
    const num = (s: string) => s ? Number(s) : null;
    return {
      type: form.type,
      deal: form.deal,
      status: publish ? 'active' : form.status,
      price_value: Number(form.price_value),
      price_currency: form.price_currency,
      price_value_secondary: form.price_value_secondary ? Number(form.price_value_secondary) : null,
      price_currency_secondary: form.price_currency === 'USD' ? 'UAH' : 'USD',
      address: form.address.trim(),
      district: form.district || null,
      complex_name: form.complex_name || null,
      lat: form.lat, lng: form.lng,
      area_total: num(form.area_total),
      area_living: num(form.area_living),
      area_kitchen: num(form.area_kitchen),
      rooms: num(form.rooms),
      floor: num(form.floor),
      floors_total: num(form.floors_total),
      year_built: num(form.year_built),
      building_type: form.building_type || null,
      condition: form.condition || null,
      description: form.description || null,
      heating_type: form.heating_type || null,
      balcony: form.balcony || null,
      parking: form.parking || null,
      furniture: form.furniture || null,
      appliances: form.appliances || null,
      kids_allowed: form.kids_allowed,
      pets_allowed: form.pets_allowed,
      deposit: num(form.deposit),
      utilities_included: form.utilities_included,
      bathroom: form.bathroom || null,
      ceiling_height: num(form.ceiling_height),
      documents: form.documents || null,
      plot_area: num(form.plot_area),
      features: form.features,
    } as any;
  };

  // Lazily create a draft so the user can add photos before explicitly saving.
  // Stays on the same screen — just remembers the new id locally.
  const ensureDraft = async (): Promise<number | null> => {
    if (propId != null) return propId;
    if (!form.price_value || !form.address) {
      showToast('Спочатку вкажіть адресу і ціну — тоді можна додавати фото');
      return null;
    }
    try {
      const r = await api.createProperty(buildBody(false));
      setCreatedId(r.id);
      // Reflect the new id in the URL via React Router so back/refresh work,
      // and flag the next useEffect run to skip refetching (we already have
      // the freshest form state in memory).
      justCreated.current = true;
      navigate(`/edit/${r.id}`, { replace: true });
      showToast('Чорнетку створено');
      return r.id;
    } catch (e: any) {
      showToast(e?.message ?? 'Не вдалося створити чорнетку');
      return null;
    }
  };

  const save = async (publish = false) => {
    if (!form.price_value || !form.address) {
      showToast('Заповніть адресу та ціну');
      return;
    }
    setSaving(true);
    try {
      const body = buildBody(publish);
      let pid: number;
      if (propId != null) {
        await api.updateProperty(propId, body);
        pid = propId;
      } else {
        const r = await api.createProperty(body);
        pid = r.id;
      }
      tgHaptic('success');
      showToast(publish ? 'Об\'єкт опубліковано' : 'Збережено');
      navigate(`/property/${pid}`);
    } catch (e: any) {
      tgHaptic('error');
      showToast(e.message ?? 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pid = await ensureDraft();
    if (!pid) return;
    setUploading(true);
    try {
      const r = await api.uploadPhotos(pid, Array.from(files));
      setPhotos((prev) => [...prev, ...r.photos]);
      tgHaptic('success');
    } catch (e: any) {
      showToast(e.message ?? 'Не вдалося завантажити');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId: number) => {
    if (propId == null) return;
    const ok = await tgConfirm('Видалити це фото?');
    if (!ok) return;
    try {
      await api.deletePhoto(propId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      showToast('Фото видалено');
    } catch (err: any) {
      showToast(`Не вдалося видалити${err?.status ? ` (${err.status})` : ''}`);
    }
  };

  const setCover = async (photoId: number) => {
    if (propId == null) return;
    // Optimistic update so the user sees the change instantly
    const prev = photos;
    setPhotos((arr) => arr.map((p) => ({ ...p, is_cover: p.id === photoId })));
    try {
      await api.setCover(propId, photoId);
      tgHaptic('success');
      showToast('Встановлено як обкладинку');
    } catch (err: any) {
      setPhotos(prev); // revert
      showToast(`Не вдалося встановити обкладинку${err?.status ? ` (${err.status})` : ''}`);
    }
  };

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v || form.features.includes(v)) return;
    upd('features', [...form.features, v]);
    setFeatureInput('');
  };

  const removeFeature = (f: string) => upd('features', form.features.filter((x) => x !== f));

  const remove = async () => {
    if (propId == null) return;
    const ok = await tgConfirm('Видалити об\'єкт повністю?');
    if (!ok) return;
    await api.deleteProperty(propId);
    showToast('Видалено');
    navigate('/dashboard');
  };

  return (
    <div className="tg">
      <Header title={isEditing ? "Редагувати об'єкт" : "Новий об'єкт"}/>
      <div className="tg-body" style={{ padding: '8px 16px 24px' }}>

        <div className="eyebrow" style={{ padding: '12px 4px' }}>Тип</div>
        <div className="row-2">
          <select className="input" value={form.type} onChange={(e) => upd('type', e.target.value as PropertyType)}>
            <option value="apartment">Квартира</option>
            <option value="house">Будинок</option>
            <option value="commercial">Комерція</option>
            <option value="land">Земля</option>
          </select>
          <select className="input" value={form.deal} onChange={(e) => upd('deal', e.target.value as DealType)}>
            <option value="sale">Продаж</option>
            <option value="rent">Оренда</option>
          </select>
        </div>

        <div className="eyebrow" style={{ padding: '20px 4px 8px' }}>Ціна</div>
        <div className="row-2">
          <input className="input" inputMode="numeric" placeholder="Ціна" value={form.price_value}
                 onChange={(e) => upd('price_value', e.target.value)}/>
          <select className="input" value={form.price_currency}
                  onChange={(e) => upd('price_currency', e.target.value as Currency)}>
            <option value="USD">USD</option>
            <option value="UAH">UAH</option>
          </select>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label className="label">
            Друга валюта ({form.price_currency === 'USD' ? 'UAH' : 'USD'}) {rate && `· курс ${rate}`}
          </label>
          <input className="input" inputMode="numeric"
                 value={form.price_value_secondary}
                 onChange={(e) => setForm((f) => ({ ...f, price_value_secondary: e.target.value, manual_secondary: true }))}
                 placeholder="Авто-розрахунок за курсом НБУ"/>
          {form.manual_secondary && (
            <button className="btn btn-sm btn-ghost" style={{ marginTop: 6, padding: 0, width: 'auto' }}
                    onClick={() => setForm((f) => ({ ...f, manual_secondary: false }))}>
              Повернути авто-розрахунок
            </button>
          )}
        </div>

        <div className="eyebrow" style={{ padding: '20px 4px 8px' }}>Адреса</div>
        <div className="field">
          <input className="input" value={form.address} onChange={(e) => upd('address', e.target.value)}
                 placeholder="Вулиця, будинок"/>
        </div>
        <div className="field">
          <label className="label">Район</label>
          <select className="input" value={form.district} onChange={(e) => upd('district', e.target.value)}>
            <option value="">— оберіть —</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Назва ЖК (необов'язково)</label>
          <input className="input" value={form.complex_name} onChange={(e) => upd('complex_name', e.target.value)}/>
        </div>

        <div className="eyebrow" style={{ padding: '12px 4px 8px' }}>
          Точка на карті {form.lat && form.lng && (
            <span style={{ color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>
              · {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </span>
          )}
        </div>
        <div style={{ height: 280, borderRadius: 14, overflow: 'hidden', border: '0.5px solid var(--hair)' }}>
          <MapContainer center={form.lat && form.lng ? [form.lat, form.lng] : DNIPRO}
                        zoom={form.lat ? 15 : 12} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            <PickPoint
              value={form.lat && form.lng ? [form.lat, form.lng] : null}
              onChange={([lat, lng]) => setForm((f) => ({ ...f, lat, lng }))}
            />
          </MapContainer>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', padding: '6px 4px' }}>
          <IconPin width={11} height={11} style={{ display: 'inline', verticalAlign: 'middle' }}/> Натисніть на карту, щоб позначити місцезнаходження
        </div>

        <div className="eyebrow" style={{ padding: '20px 4px 8px' }}>Параметри</div>
        <div className="row-3">
          <div>
            <label className="label">Кімнат</label>
            <input className="input" inputMode="numeric" value={form.rooms} onChange={(e) => upd('rooms', e.target.value)}/>
          </div>
          <div>
            <label className="label">Поверх</label>
            <input className="input" inputMode="numeric" value={form.floor} onChange={(e) => upd('floor', e.target.value)}/>
          </div>
          <div>
            <label className="label">Поверхів</label>
            <input className="input" inputMode="numeric" value={form.floors_total} onChange={(e) => upd('floors_total', e.target.value)}/>
          </div>
        </div>
        <div className="row-3" style={{ marginTop: 10 }}>
          <div>
            <label className="label">Загальна м²</label>
            <input className="input" inputMode="decimal" value={form.area_total} onChange={(e) => upd('area_total', e.target.value)}/>
          </div>
          <div>
            <label className="label">Житлова м²</label>
            <input className="input" inputMode="decimal" value={form.area_living} onChange={(e) => upd('area_living', e.target.value)}/>
          </div>
          <div>
            <label className="label">Кухня м²</label>
            <input className="input" inputMode="decimal" value={form.area_kitchen} onChange={(e) => upd('area_kitchen', e.target.value)}/>
          </div>
        </div>
        <div className="row-2" style={{ marginTop: 10 }}>
          <div>
            <label className="label">Рік будівництва</label>
            <input className="input" inputMode="numeric" value={form.year_built} onChange={(e) => upd('year_built', e.target.value)}/>
          </div>
          <div>
            <label className="label">Висота стелі, м</label>
            <input className="input" inputMode="decimal" value={form.ceiling_height} onChange={(e) => upd('ceiling_height', e.target.value)}/>
          </div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Тип будинку</label>
          <select className="input" value={form.building_type} onChange={(e) => upd('building_type', e.target.value)}>
            <option value="">—</option>
            {BUILDING_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Стан</label>
          <select className="input" value={form.condition} onChange={(e) => upd('condition', e.target.value)}>
            <option value="">—</option>
            {CONDITIONS.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label">Опалення</label>
          <input className="input" value={form.heating_type} onChange={(e) => upd('heating_type', e.target.value)} placeholder="централізоване / індивідуальне"/>
        </div>
        <div className="field">
          <label className="label">Балкон</label>
          <input className="input" value={form.balcony} onChange={(e) => upd('balcony', e.target.value)} placeholder="балкон / лоджія / немає"/>
        </div>
        <div className="field">
          <label className="label">Паркінг</label>
          <input className="input" value={form.parking} onChange={(e) => upd('parking', e.target.value)} placeholder="підземний / двір / немає"/>
        </div>
        <div className="field">
          <label className="label">Санвузол</label>
          <input className="input" value={form.bathroom} onChange={(e) => upd('bathroom', e.target.value)} placeholder="суміщений / роздільний"/>
        </div>
        <div className="field">
          <label className="label">Документи</label>
          <input className="input" value={form.documents} onChange={(e) => upd('documents', e.target.value)} placeholder="свідоцтво / новобуд від забудовника"/>
        </div>

        {form.deal === 'rent' && (
          <>
            <div className="eyebrow" style={{ padding: '12px 4px 8px' }}>Оренда</div>
            <div className="field">
              <label className="label">Меблі</label>
              <input className="input" value={form.furniture} onChange={(e) => upd('furniture', e.target.value)}/>
            </div>
            <div className="field">
              <label className="label">Техніка</label>
              <input className="input" value={form.appliances} onChange={(e) => upd('appliances', e.target.value)}/>
            </div>
            <div className="row-2">
              <div>
                <label className="label">Завдаток</label>
                <input className="input" inputMode="numeric" value={form.deposit} onChange={(e) => upd('deposit', e.target.value)}/>
              </div>
              <div>
                <label className="label">Комуналка включена</label>
                <select className="input" value={form.utilities_included == null ? '' : String(form.utilities_included)}
                        onChange={(e) => upd('utilities_included', e.target.value === '' ? null : e.target.value === 'true')}>
                  <option value="">—</option>
                  <option value="true">Так</option>
                  <option value="false">Ні</option>
                </select>
              </div>
            </div>
            <div className="row-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">З дітьми</label>
                <select className="input" value={form.kids_allowed == null ? '' : String(form.kids_allowed)}
                        onChange={(e) => upd('kids_allowed', e.target.value === '' ? null : e.target.value === 'true')}>
                  <option value="">—</option>
                  <option value="true">Так</option>
                  <option value="false">Ні</option>
                </select>
              </div>
              <div>
                <label className="label">З тваринами</label>
                <select className="input" value={form.pets_allowed == null ? '' : String(form.pets_allowed)}
                        onChange={(e) => upd('pets_allowed', e.target.value === '' ? null : e.target.value === 'true')}>
                  <option value="">—</option>
                  <option value="true">Так</option>
                  <option value="false">Ні</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="eyebrow" style={{ padding: '20px 4px 8px' }}>Опис</div>
        <textarea className="textarea" value={form.description} onChange={(e) => upd('description', e.target.value)}
                  placeholder="Розкажіть про об'єкт…" rows={5}/>

        <div className="eyebrow" style={{ padding: '20px 4px 8px' }}>Особливості</div>
        <div className="field" style={{ display: 'flex', gap: 8 }}>
          <input className="input" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                 placeholder="Smart Home, Камін…"/>
          <button className="btn btn-sm btn-secondary" onClick={addFeature} style={{ width: 50, padding: 0 }}>
            <IconPlus width={16} height={16}/>
          </button>
        </div>
        {form.features.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -6 }}>
            {form.features.map((f) => (
              <button key={f} className="chip" onClick={() => removeFeature(f)} title="Видалити">
                {f} <span style={{ color: 'var(--muted)' }}>×</span>
              </button>
            ))}
          </div>
        )}

        <div className="eyebrow" style={{ padding: '24px 4px 8px' }}>
          Фото {photos.length > 0 && <span style={{ color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>· {photos.length} / 50</span>}
        </div>
        {!isEditing && (
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '0 4px 10px' }}>
            Завантажте перше фото — чорнетка створиться автоматично.
          </div>
        )}
        {isEditing && photos.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '0 4px 8px' }}>
            Натисніть «Обкладинка», щоб обрати головне фото оголошення.
          </div>
        )}
        <div className="photo-grid" style={{ padding: 0 }}>
          {photos.map((p) => (
            <div key={p.id} className={`cell ${p.is_cover ? 'cover' : ''}`}>
              <img src={p.thumb_url ?? p.url} alt=""/>
              <button className="remove" onClick={() => removePhoto(p.id)}><IconTrash width={12} height={12}/></button>
              {p.is_cover ? (
                <div className="cover-badge active">✓ Обкладинка</div>
              ) : (
                <button className="cover-badge" onClick={() => setCover(p.id)}>📌 Обкладинка</button>
              )}
            </div>
          ))}
          {photos.length < 50 && (
            <button className="add" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <IconPlus width={28} height={28}/>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
               onChange={(e) => onFiles(e.target.files)}/>
        {uploading && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 10, fontSize: 13 }}>Завантаження…</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          <button className="btn btn-accent" onClick={() => save(true)} disabled={saving}>
            {form.status === 'active' ? 'Зберегти зміни' : 'Опублікувати'}
          </button>
          <button className="btn btn-secondary" onClick={() => save(false)} disabled={saving}>
            Зберегти як чорнетку
          </button>
          {isEditing && (
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={remove}>
              Видалити об'єкт
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
