/* global React, I, fmt, UA */
// Shared components for the Realty Telegram Mini App

// ─────────── Telegram-style header ───────────
function TgHeader({ title, sub, action, onBack, blur, dark, over }) {
  const cls = ['tg-head', blur && 'blur', dark && 'dark', over && 'over'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {onBack !== false && (
        <button className="tg-back" aria-label="back">
          <I.back s={16} />
        </button>
      )}
      <div className="tg-title">
        {title}
        {sub && <span className="sub">{sub}</span>}
      </div>
      {action ? <button className="tg-action">{action}</button> :
        <button className="tg-back" aria-label="menu"><I.dots s={16}/></button>}
    </div>
  );
}

// ─────────── Tab bar ───────────
function TabBar({ active = 'home' }) {
  const items = [
    { k: 'home', n: 'Огляд', icon: I.home },
    { k: 'map', n: 'Карта', icon: I.map },
    { k: 'fav', n: 'Обране', icon: I.heart },
  ];
  return (
    <div className="tg-tabs">
      {items.map((it) => (
        <button key={it.k} className={'tg-tab ' + (active === it.k ? 'active' : '')}>
          <it.icon s={22} w={active === it.k ? 1.8 : 1.5} />
          <span>{it.n}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────── Price label ───────────
function PriceLabel({ usd, mainCurrency = 'usd', big = false, light = false }) {
  const uah = Math.round(usd * 41.2);
  const main = mainCurrency === 'usd' ? fmt.usd(usd) : fmt.uah(uah);
  const alt  = mainCurrency === 'usd' ? '≈ ' + fmt.uahShort(uah) : '≈ ' + fmt.usd(usd);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems: light ? 'flex-end' : 'flex-start' }}>
      <span className="num-display" style={{ fontSize: big ? 34 : 20, color: light ? '#fff' : 'var(--ink)' }}>{main}</span>
      <span style={{ fontSize: 11, color: light ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginTop: 2 }}>{alt}</span>
    </div>
  );
}

// ─────────── Building image placeholder (synthesized) ───────────
function BldgImage({ variant = 'warm', label, tag, tagColor, height = 220, children, rounded = 16, dark = false, showBldgs = true }) {
  return (
    <div className={'ph ' + variant} style={{ height, borderRadius: rounded, overflow:'hidden', position:'relative' }}>
      {showBldgs && <div className="ph-buildings"/>}
      {variant === 'night' && <div className="ph-window-grid"/>}
      {tag && (
        <div style={{ position:'absolute', top:12, left:12 }}>
          <span className={'tag ' + (tagColor || '')}>{tag}</span>
        </div>
      )}
      {label && <div className="ph-label">{label}</div>}
      {children}
    </div>
  );
}

// ─────────── Stat strip — rooms / area / floor ───────────
function StatStrip({ item, mono, light }) {
  const C = light ? 'rgba(255,255,255,0.85)' : 'var(--muted)';
  const F = light ? '#fff' : 'var(--ink)';
  const Cell = ({ icon: Icon, k, v }) => (
    <div style={{ display:'flex', flexDirection:'column', gap: 4, flex: 1 }}>
      <div style={{ color: C, fontSize: 11, display:'flex', alignItems:'center', gap:5 }}>
        <Icon s={13} w={1.6}/>
        <span>{k}</span>
      </div>
      <div style={{ color: F, fontSize: mono ? 14 : 15, fontWeight: 600, letterSpacing:'-0.01em' }}>{v}</div>
    </div>
  );
  return (
    <div style={{ display:'flex', gap: 14 }}>
      <Cell icon={I.bed} k="Кімнат" v={item.rooms}/>
      <div style={{ width:0.5, background: light ? 'rgba(255,255,255,0.18)' : 'var(--hair)' }}/>
      <Cell icon={I.area} k="Площа" v={fmt.m2(item.area)}/>
      <div style={{ width:0.5, background: light ? 'rgba(255,255,255,0.18)' : 'var(--hair)' }}/>
      <Cell icon={I.floor} k="Поверх" v={item.floor}/>
    </div>
  );
}

// ─────────── Listing card — large (used on feed top) ───────────
function ListingCardLg({ item, mainCurrency }) {
  return (
    <div style={{ position:'relative', borderRadius: 18, overflow:'hidden' }}>
      <BldgImage variant={item.bg} label={item.id} tag={item.tag} tagColor={item.tagColor} height={360} rounded={18}/>
      {/* heart */}
      <button style={{ position:'absolute', top:14, right:14, width:38, height:38, borderRadius: 100, display:'flex', alignItems:'center', justifyContent:'center' }} className="glass">
        <I.heart s={18} c="#14130F" w={1.8}/>
      </button>
      {/* footer overlay */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, padding: 18,
        background: 'linear-gradient(180deg, rgba(20,19,15,0) 0%, rgba(20,19,15,0.55) 100%)',
        color:'#fff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.02em' }}>{item.district} · {UA.city}</div>
            <div className="h-display" style={{ fontSize: 24, marginTop: 4, textWrap: 'balance' }}>{item.title}</div>
          </div>
          <PriceLabel usd={item.usd} mainCurrency={mainCurrency} light/>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop:'0.5px solid rgba(255,255,255,0.2)' }}>
          <StatStrip item={item} light/>
        </div>
      </div>
    </div>
  );
}

// ─────────── Listing card — wide list row ───────────
function ListingRow({ item, mainCurrency, saved }) {
  return (
    <div className="card" style={{ display:'flex', gap: 12, padding: 10 }}>
      <BldgImage variant={item.bg} height={104} rounded={12} showBldgs={true} />
      <div style={{ flex: 1, padding: '4px 4px 4px 0', display:'flex', flexDirection:'column', gap: 4, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing:'0.02em' }}>{item.district}</div>
          <button style={{ color: saved ? 'var(--danger)' : 'var(--muted-2)', marginTop:-2 }}>
            {saved ? <I.heartFill s={16}/> : <I.heart s={16}/>}
          </button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, letterSpacing:'-0.01em',
          display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          {item.rooms} кімн. · {item.area} м² · {item.floor}
        </div>
        <div style={{ marginTop: 'auto', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <span className="num-display" style={{ fontSize: 19 }}>{mainCurrency === 'usd' ? fmt.usd(item.usd) : fmt.uah(item.usd * 41.2)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>{fmt.usdShort(item.usd * 41.2 / item.area)}/м²·UAH</span>
        </div>
      </div>
    </div>
  );
}

// ─────────── Listing card — vertical (grid item) ───────────
function ListingCard({ item, mainCurrency, w = 240 }) {
  return (
    <div style={{ width: w, flexShrink: 0 }}>
      <div style={{ position:'relative', borderRadius: 14, overflow:'hidden' }}>
        <BldgImage variant={item.bg} height={170} rounded={14} tag={item.tag} tagColor={item.tagColor}/>
        <button style={{ position:'absolute', top:10, right:10, width:32, height:32, borderRadius: 100, display:'flex', alignItems:'center', justifyContent:'center' }} className="glass">
          <I.heart s={14} c="#14130F" w={1.8}/>
        </button>
      </div>
      <div style={{ padding: '10px 2px 2px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing:'0.02em' }}>{item.district}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4, lineHeight:1.2, letterSpacing:'-0.01em',
          display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden', minHeight: 32 }}>{item.title}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 8 }}>
          <span className="num-display" style={{ fontSize: 18 }}>{mainCurrency === 'usd' ? fmt.usd(item.usd) : fmt.uah(item.usd*41.2)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>{item.rooms}к · {item.area}м²</span>
        </div>
      </div>
    </div>
  );
}

// ─────────── Section header ───────────
function SectionHeader({ title, action }) {
  return (
    <div className="sec-h" style={{ marginTop: 24, marginBottom: 12 }}>
      <div className="t">{title}</div>
      {action && <button className="a" style={{ display:'flex', alignItems:'center', gap:2 }}>
        {action} <I.chev s={12}/>
      </button>}
    </div>
  );
}

Object.assign(window, { TgHeader, TabBar, PriceLabel, BldgImage, StatStrip, ListingCardLg, ListingRow, ListingCard, SectionHeader });
