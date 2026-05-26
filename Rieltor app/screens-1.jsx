/* global React, I, fmt, UA, LISTINGS, REALTOR, GALLERY_LABELS,
   TgHeader, TabBar, PriceLabel, BldgImage, StatStrip, ListingCardLg, ListingRow, ListingCard, SectionHeader */

// ═══════════════════════════════════════════════════════════
//   SCREEN 1 — FEED / HOME
// ═══════════════════════════════════════════════════════════
function ScreenFeed({ mainCurrency = 'usd', op = 'buy' }) {
  const featured = LISTINGS[0];
  const newOnes = LISTINGS.slice(1, 4);
  const more = LISTINGS.slice(4);

  return (
    <div className="tg">
      <TgHeader title="Realty" sub={UA.city} action={<I.share s={16}/>} />
      <div className="tg-body" style={{ paddingBottom: 96 }}>

        {/* operation segmented control */}
        <div style={{ padding: '0 16px 4px' }}>
          <div className="segment" style={{ height: 38 }}>
            <button className={op === 'buy'   ? 'on' : ''}>Купити</button>
            <button className={op === 'rent'  ? 'on' : ''}>Орендувати</button>
            <button className={op === 'daily' ? 'on' : ''}>Подобово</button>
          </div>
        </div>

        {/* search bar */}
        <div style={{ padding: '10px 16px 0' }}>
          <div className="input" style={{ borderRadius: 14, height: 48 }}>
            <I.search s={18} c="#9C9890" w={1.8}/>
            <span className="ph-txt">Адреса, ЖК або район</span>
            <span style={{ flex:1 }}/>
            <button style={{ color:'var(--ink)' }}>
              <I.slider s={18} w={1.8}/>
            </button>
          </div>
        </div>

        {/* district chips */}
        <div style={{ marginTop: 14 }}>
          <div className="hscroll">
            <button className="chip solid lg">
              <I.compass s={14} c="#fff"/> Усі райони
            </button>
            {UA.districts.slice(0, 6).map((d) => (
              <button key={d} className="chip lg">{d}</button>
            ))}
          </div>
        </div>

        {/* eyebrow + featured */}
        <div style={{ padding: '24px 20px 12px' }}>
          <div className="eyebrow">Підбірка тижня</div>
          <div className="h-display" style={{ fontSize: 32, marginTop: 6, textWrap:'balance' }}>
            Преміум житло над<br/>правим берегом Дніпра
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <ListingCardLg item={featured} mainCurrency={mainCurrency}/>
        </div>

        {/* New offers */}
        <SectionHeader title="Нові пропозиції" action="Усі 248"/>
        <div className="hscroll">
          {newOnes.map((it) => <ListingCard key={it.id} item={it} mainCurrency={mainCurrency} w={230}/>)}
        </div>

        {/* category tiles */}
        <SectionHeader title="За форматом"/>
        <div style={{ padding: '0 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          {[
            { label: 'Новобудови', count: 84, bg: 'cool' },
            { label: 'Сталінки', count: 21, bg: 'warm' },
            { label: 'Будинки', count: 56, bg: 'clay' },
            { label: 'Оренда', count: 132, bg: 'sand' },
          ].map((c) => (
            <button key={c.label} style={{ position:'relative', height: 110, borderRadius: 14, overflow:'hidden', textAlign:'left' }}>
              <BldgImage variant={c.bg} height={110} rounded={14}/>
              <div style={{ position:'absolute', inset:0, padding: 12, display:'flex', flexDirection:'column', justifyContent:'flex-end', color:'#fff',
                background:'linear-gradient(180deg, rgba(20,19,15,0) 30%, rgba(20,19,15,0.55) 100%)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.01em' }}>{c.label}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{c.count} об'єктів</div>
              </div>
            </button>
          ))}
        </div>

        {/* Editorial / recent list */}
        <SectionHeader title="Свіжі оголошення" action="Сортувати"/>
        <div style={{ padding: '0 16px', display:'flex', flexDirection:'column', gap: 10 }}>
          {more.map((it) => <ListingRow key={it.id} item={it} mainCurrency={mainCurrency}/>)}
        </div>

        {/* Market pulse */}
        <div style={{ padding: '24px 16px 0' }}>
          <div className="card-flat" style={{ padding: 18 }}>
            <div className="eyebrow">Ринок · травень 2026</div>
            <div className="h-display" style={{ fontSize: 24, marginTop: 6 }}>Дніпро · ціни <span style={{ color:'var(--accent)' }}>+3,2%</span> за квартал</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
              Середня вартість квартири на вторинному ринку — $1 280 за м². Найвищий попит — Соборний та Шевченківський райони.
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }}>
              Огляд ринку <I.chev s={12}/>
            </button>
          </div>
        </div>
      </div>
      <TabBar active="home"/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 2 — PROPERTY DETAIL (draggable bottom sheet)
//   3 snap positions: peek (hero dominant) · half · full (hides photo)
// ═══════════════════════════════════════════════════════════
function ScreenDetail({ id = 'L-2417', mainCurrency = 'usd' }) {
  const item = LISTINGS.find((l) => l.id === id) || LISTINGS[0];

  // 0 = hidden (peek), 1 = middle, 2 = expanded
  const SNAPS = [620, 360, 90];
  const [snap, setSnap] = React.useState(1);
  const [drag, setDrag] = React.useState({ active: false, startY: 0, offset: 0 });

  const currentTop = SNAPS[snap] + (drag.active ? drag.offset : 0);
  const top = Math.max(70, Math.min(700, currentTop));

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ active: true, startY: e.clientY, offset: 0 });
  };
  const onMove = (e) => {
    if (!drag.active) return;
    setDrag((d) => ({ ...d, offset: e.clientY - d.startY }));
  };
  const onUp = () => {
    if (!drag.active) return;
    const moved = Math.abs(drag.offset);
    if (moved < 6) {
      // tap on handle = no-op (per spec: only drag changes position)
    } else {
      // snap to closest of the three positions
      const target = SNAPS[snap] + drag.offset;
      let best = 0, bd = Infinity;
      SNAPS.forEach((s, i) => { const d = Math.abs(s - target); if (d < bd) { bd = d; best = i; } });
      setSnap(best);
    }
    setDrag({ active: false, startY: 0, offset: 0 });
  };

  const heroHeight = SNAPS[0] + 80;
  const photoOpacity = snap === 2 && !drag.active ? 0.35 : 1;

  // Hero photo carousel — horizontal scroll-snap, tap to open fullscreen gallery
  const photos = [
    { bg: item.bg, label: 'Вітальня' },
    { bg: 'sand', label: 'Кухня-студія' },
    { bg: 'warm', label: 'Спальня' },
    { bg: 'clay', label: 'Тераса 42 м²' },
    { bg: 'deep', label: 'Вид з вікна' },
    { bg: 'cool', label: 'Санвузол' },
  ];
  const totalPhotos = 18;
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const heroRef = React.useRef(null);
  const onHeroScroll = (e) => {
    const w = e.currentTarget.clientWidth;
    const i = Math.round(e.currentTarget.scrollLeft / w);
    if (i !== photoIdx) setPhotoIdx(i);
  };

  return (
    <div className="tg" style={{ overflow:'hidden' }}>
      {/* hero photo carousel — swipable, fades when sheet expanded */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height: heroHeight,
        transition: 'opacity .25s ease',
        opacity: photoOpacity }}>
        <div
          ref={heroRef}
          onScroll={onHeroScroll}
          style={{
            display:'flex',
            width: '100%', height: '100%',
            overflowX: 'auto', overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}>
          {photos.map((p, i) => (
            <div key={i} style={{ flex:'0 0 100%', height:'100%', scrollSnapAlign:'start', position:'relative' }}>
              <BldgImage variant={p.bg} height={heroHeight} rounded={0}
                tag={i === 0 ? item.tag : null} tagColor={item.tagColor}/>
            </div>
          ))}
        </div>
        {/* gradient at bottom for handle legibility */}
        <div style={{ position:'absolute', left:0, right:0, bottom:0, height: 120,
          background:'linear-gradient(180deg, rgba(20,19,15,0) 0%, rgba(20,19,15,0.22) 100%)',
          pointerEvents:'none' }}/>
        {/* pagination dots */}
        <div style={{ position:'absolute', left:0, right:0, bottom: 14, display:'flex', justifyContent:'center', gap: 5, pointerEvents:'none' }}>
          {photos.map((_, i) => (
            <span key={i} style={{
              width: i === photoIdx ? 16 : 5, height: 5, borderRadius: 100,
              background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'width .25s, background .2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}/>
          ))}
        </div>
      </div>

      {/* glass header — sits on photo */}
      <div className="tg-head over">
        <button className="tg-back glass"><I.back s={16}/></button>
        <div style={{ flex:1 }}/>
        <button className="tg-back glass"><I.share s={16}/></button>
        <button className="tg-back glass" style={{ marginLeft: 8 }}><I.heart s={16}/></button>
      </div>

      {/* photo counter pill — tap to open fullscreen gallery */}
      <button style={{ position:'absolute', right: 16,
        top: Math.max(top - 50, 70),
        height: 32, padding:'0 12px', borderRadius:100,
        display: snap === 2 ? 'none' : 'flex',
        alignItems:'center', gap:6, color:'#fff', fontSize:12, fontWeight:600,
        transition: drag.active ? 'none' : 'top .35s cubic-bezier(.22,.6,.36,1)', zIndex: 3 }} className="glass dark">
        <I.expand s={13} c="#fff"/>
        <span className="num-display" style={{ fontSize: 13, color:'#fff' }}>{photoIdx + 1}</span>
        <span style={{ opacity: 0.7 }}>/ {totalPhotos}</span>
      </button>

      {/* BOTTOM SHEET */}
      <div style={{
        position:'absolute', left:0, right:0, top, bottom:0,
        background: 'var(--bg)',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -10px 30px rgba(20,19,15,0.12)',
        transition: drag.active ? 'none' : 'top .35s cubic-bezier(.22,.6,.36,1)',
        zIndex: 4,
        display: 'flex', flexDirection: 'column',
        overflow:'hidden',
        touchAction: 'none',
      }}>
        {/* drag handle — large hit area, real pointer drag */}
        <div
          className="drag-handle"
          style={{ padding: '10px 0 8px', touchAction:'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <span style={{ background: drag.active ? 'rgba(20,19,15,0.4)' : undefined,
            width: drag.active ? 46 : undefined }}/>
        </div>

        <div style={{ flex:1, overflowY:'auto', paddingBottom: 110 }}>
          <div style={{ padding: '6px 20px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <I.pin s={13} c="var(--muted)" w={1.8}/>
              <span>{item.addr} · {item.district}</span>
            </div>
            <div className="h-display" style={{ fontSize: 28, marginTop: 8, textWrap:'balance', lineHeight: 1.05 }}>{item.title}</div>

            {/* price block */}
            <div style={{ marginTop: 14, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Ціна продажу</div>
                <div className="num-display" style={{ fontSize: 34, marginTop: 6 }}>
                  {mainCurrency === 'usd' ? fmt.usd(item.usd) : fmt.uah(item.usd*41.2)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {mainCurrency === 'usd' ? '≈ ' + fmt.uah(item.usd*41.2) : '≈ ' + fmt.usd(item.usd)}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="eyebrow" style={{ fontSize: 10 }}>Ціна за м²</div>
                <div className="num-display" style={{ fontSize: 18, marginTop: 6 }}>{fmt.usd(Math.round(item.usd/item.area))}</div>
              </div>
            </div>

            {/* stat strip card */}
            <div className="card-flat" style={{ marginTop: 14, padding: 16 }}>
              <StatStrip item={item}/>
            </div>
          </div>

          {/* about */}
          <div style={{ padding: '22px 20px 0' }}>
            <div className="eyebrow">Про об'єкт</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 10, textWrap:'pretty' }}>
              {item.desc} Будинок 2022 року, ліфт Schindler, охорона 24/7, закрита територія з ландшафтним озелененням.
            </div>
          </div>

          {/* features */}
          <div style={{ padding: '20px 20px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Особливості</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
              {item.features.map((f, i) => (
                <span key={i} className="chip">{f}</span>
              ))}
              <span className="chip"><I.balcony s={14}/> Лоджія</span>
              <span className="chip"><I.car s={14}/> Паркомісце</span>
              <span className="chip"><I.shield s={14}/> Охорона 24/7</span>
            </div>
          </div>

          {/* map snippet */}
          <div style={{ padding: '22px 20px 0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12 }}>
              <div className="eyebrow">Локація</div>
              <button style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>Маршрут</button>
            </div>
            <div className="maptile-sat" style={{ height: 160, borderRadius: 14, overflow:'hidden', position:'relative', border: '0.5px solid var(--hair)' }}>
              <div className="map-pin active" style={{ left:'50%', top:'52%' }}>
                <span style={{ fontFamily:'var(--font-display)' }}>{fmt.usdShort(item.usd)}</span>
              </div>
              <div className="map-pin cluster" style={{ left:'24%', top:'38%' }}>3</div>
              <div className="map-pin cluster" style={{ left:'78%', top:'66%' }}>$215K</div>
            </div>
            <div style={{ marginTop: 10, display:'flex', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
              <span>Метро Музейна — 4 хв</span>
              <span>·</span>
              <span>Набережна — 250 м</span>
            </div>
          </div>

          {/* Realtor */}
          <div style={{ padding: '22px 20px 0' }}>
            <div className="card" style={{ padding: 16, display:'flex', alignItems:'center', gap: 14 }}>
              <div className="ph clay" style={{ width: 52, height: 52, borderRadius: 100, flexShrink:0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.realtor}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <I.star s={11} c="var(--gold)"/>
                  <span>4.9 · {item.realtorFirm}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: 38, padding: 0 }}>
                <I.chat s={16}/>
              </button>
              <button className="btn btn-primary btn-sm" style={{ width: 38, padding: 0 }}>
                <I.phone s={16} c="#fff"/>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <SectionHeader title="Схожі об'єкти"/>
            <div className="hscroll">
              {LISTINGS.slice(1,4).map((it) => <ListingCard key={it.id} item={it} mainCurrency={mainCurrency} w={210}/>)}
            </div>
          </div>
        </div>

        {/* sticky CTA inside sheet */}
        <div style={{ position:'absolute', bottom: 0, left:0, right:0,
          padding: '12px 16px 28px',
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '0.5px solid var(--hair-2)',
          display:'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ width: 50, padding: 0 }}>
            <I.chat s={20}/>
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }}>Записатись на перегляд</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 3 — FULLSCREEN GALLERY
// ═══════════════════════════════════════════════════════════
function ScreenGallery({ id = 'L-2417' }) {
  const item = LISTINGS.find((l) => l.id === id) || LISTINGS[0];
  const variants = ['cool', 'warm', 'clay', 'sand', 'deep', 'fog', 'night'];
  return (
    <div className="tg dark">
      {/* hero image */}
      <div style={{ position:'absolute', inset: 0 }}>
        <BldgImage variant="deep" height={874} rounded={0} showBldgs={true}/>
      </div>

      {/* top bar */}
      <div className="tg-head over">
        <button className="tg-back glass dark"><I.close s={16} c="#fff"/></button>
        <div className="tg-title" style={{ color: '#fff' }}>
          3 / 18
          <span className="sub" style={{ color: 'rgba(255,255,255,0.65)' }}>{GALLERY_LABELS[2]}</span>
        </div>
        <button className="tg-back glass dark"><I.share s={16} c="#fff"/></button>
      </div>

      {/* footer: thumbs + chrome */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        padding: '16px 12px 28px',
        background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 80%)' }}>

        {/* progress */}
        <div style={{ padding:'0 6px 14px', display:'flex', gap:3 }}>
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} style={{ flex:1, height: 2, borderRadius: 2,
              background: i === 2 ? '#fff' : 'rgba(255,255,255,0.3)' }}/>
          ))}
        </div>

        {/* thumbnail strip */}
        <div style={{ display:'flex', gap: 6, overflowX:'auto', padding: '0 6px' }}>
          {Array.from({length: 10}).map((_, i) => (
            <div key={i} style={{
              width: 58, height: 58, borderRadius: 8, flexShrink:0, position:'relative',
              boxShadow: i === 2 ? '0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,0.4)' : 'none',
            }}>
              <BldgImage variant={variants[i % variants.length]} height={58} rounded={8} showBldgs={i % 3 !== 0}/>
            </div>
          ))}
        </div>

        {/* caption pill */}
        <div style={{ marginTop: 18, padding:'0 6px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', color: '#fff' }}>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ color:'rgba(255,255,255,0.65)' }}>{GALLERY_LABELS[2]}</div>
            <div className="h-display" style={{ fontSize: 22, marginTop: 6, color:'#fff', textWrap:'balance' }}>{item.title}</div>
          </div>
          <button className="glass dark" style={{ height:36, padding:'0 14px', borderRadius:100, color:'#fff', fontSize: 12.5, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
            <I.layers s={14} c="#fff"/> Усі фото
          </button>
        </div>
      </div>
    </div>
  );
}

window.ScreenFeed = ScreenFeed;
window.ScreenDetail = ScreenDetail;
window.ScreenGallery = ScreenGallery;
