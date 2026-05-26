/* global React, I, fmt, UA, LISTINGS, REALTOR,
   TgHeader, TabBar, PriceLabel, BldgImage, StatStrip, ListingCardLg, ListingRow, ListingCard, SectionHeader */

// ═══════════════════════════════════════════════════════════
//   SCREEN 4 — FILTERS SHEET
// ═══════════════════════════════════════════════════════════
function ScreenFilters({ mainCurrency = 'usd' }) {
  const Section = ({ title, count, children }) => (
    <div style={{ padding: '20px 20px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing:'-0.01em' }}>{title}</div>
        {count !== undefined && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{count}</div>}
      </div>
      {children}
    </div>
  );

  // dimmed feed underneath
  return (
    <div className="tg" style={{ background: 'var(--bg)' }}>
      {/* dimmed background mock */}
      <div style={{ position:'absolute', inset: 0, background:'var(--bg)' }}>
        <TgHeader title="Realty" sub={UA.city} />
        <div style={{ padding: '4px 16px 0', opacity: 0.5 }}>
          <div className="input" style={{ borderRadius: 14, height: 48 }}>
            <I.search s={18} c="#9C9890" w={1.8}/>
            <span className="ph-txt">Адреса, ЖК або район</span>
          </div>
        </div>
      </div>
      {/* dim layer */}
      <div style={{ position:'absolute', inset:0, background:'rgba(20,19,15,0.35)', backdropFilter:'blur(2px)' }}/>

      {/* sheet */}
      <div className="sheet" style={{ height: '88%' }}>
        <div className="sheet-handle"/>
        <div className="sheet-h" style={{ padding:'12px 20px 8px' }}>
          <button style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>Очистити</button>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing:'-0.01em' }}>Фільтри</div>
          <button style={{ width: 30, height: 30, borderRadius: 100, background:'rgba(20,19,15,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <I.close s={14}/>
          </button>
        </div>

        <div style={{ flex: 1, overflowY:'auto', overflowX:'hidden' }}>

          {/* operation segment */}
          <div style={{ padding:'4px 20px 0' }}>
            <div style={{ display:'flex', padding: 3, background:'rgba(20,19,15,0.06)', borderRadius: 12 }}>
              {['Купити', 'Орендувати', 'Подобово'].map((t, i) => (
                <button key={t} style={{ flex: 1, height: 36, borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  background: i === 0 ? '#fff' : 'transparent',
                  boxShadow: i === 0 ? '0 1px 3px rgba(20,19,15,0.08)' : 'none',
                  color: i === 0 ? 'var(--ink)' : 'var(--muted)' }}>{t}</button>
              ))}
            </div>
          </div>

          {/* type */}
          <Section title="Тип нерухомості">
            <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
              {[
                { l: 'Квартира', a: true },
                { l: 'Будинок' },
                { l: 'Пентхаус', a: true },
                { l: 'Таунхаус' },
                { l: 'Комерція' },
                { l: 'Ділянка' },
              ].map((c) => (
                <button key={c.l} className={'chip lg ' + (c.a ? 'solid' : '')}>{c.l}</button>
              ))}
            </div>
          </Section>

          {/* price range */}
          <Section title="Ціна" count="USD">
            <div style={{ display:'flex', gap: 10 }}>
              <div className="input" style={{ flex:1, height:48, flexDirection:'column', alignItems:'flex-start', justifyContent:'center', gap:2, padding:'0 14px' }}>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Від</span>
                <span className="num-display" style={{ fontSize: 16 }}>$50 000</span>
              </div>
              <div className="input" style={{ flex:1, height:48, flexDirection:'column', alignItems:'flex-start', justifyContent:'center', gap:2, padding:'0 14px' }}>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>До</span>
                <span className="num-display" style={{ fontSize: 16 }}>$350 000</span>
              </div>
            </div>
            {/* histogram + range */}
            <div style={{ marginTop: 18, position:'relative', height: 60 }}>
              {/* bars */}
              <div style={{ position:'absolute', left:0, right:0, bottom: 16, display:'flex', alignItems:'flex-end', gap: 2, height: 40 }}>
                {[6,9,14,22,28,34,40,38,32,28,24,20,16,14,12,9,7,5,4,3].map((h, i) => {
                  const inRange = i >= 2 && i <= 14;
                  return <div key={i} style={{ flex: 1, height: h, background: inRange ? 'var(--ink)' : 'rgba(20,19,15,0.15)', borderRadius: 2 }}/>;
                })}
              </div>
              {/* track */}
              <div style={{ position:'absolute', left:0, right:0, bottom: 8, height: 4, background:'rgba(20,19,15,0.08)', borderRadius: 100 }}>
                <div style={{ position:'absolute', left: '10%', right: '30%', top:0, bottom:0, background:'var(--ink)', borderRadius: 100 }}/>
              </div>
              {/* handles */}
              <div style={{ position:'absolute', left: '10%', bottom: 0, width: 20, height: 20, borderRadius: 100, background:'#fff', boxShadow:'0 2px 6px rgba(20,19,15,0.2), 0 0 0 1.5px var(--ink)', transform:'translateX(-50%)' }}/>
              <div style={{ position:'absolute', left: '70%', bottom: 0, width: 20, height: 20, borderRadius: 100, background:'#fff', boxShadow:'0 2px 6px rgba(20,19,15,0.2), 0 0 0 1.5px var(--ink)', transform:'translateX(-50%)' }}/>
            </div>
          </Section>

          {/* rooms */}
          <Section title="Кількість кімнат">
            <div style={{ display:'flex', gap: 6 }}>
              {['Студія','1','2','3','4','5+'].map((r, i) => (
                <button key={r} className={'chip lg ' + (i === 2 || i === 3 ? 'solid' : '')} style={{ flex: 1, justifyContent:'center', padding: 0 }}>{r}</button>
              ))}
            </div>
          </Section>

          {/* area */}
          <Section title="Площа" count="м²">
            <div style={{ display:'flex', gap: 10 }}>
              <div className="input" style={{ flex:1, height:44 }}>
                <span style={{ color:'var(--muted)', fontSize: 12 }}>Від</span>
                <span className="num-display" style={{ fontSize: 15, marginLeft:'auto' }}>40</span>
              </div>
              <div className="input" style={{ flex:1, height:44 }}>
                <span style={{ color:'var(--muted)', fontSize: 12 }}>До</span>
                <span className="num-display" style={{ fontSize: 15, marginLeft:'auto' }}>180</span>
              </div>
            </div>
          </Section>

          {/* districts */}
          <Section title="Райони Дніпра" count="3 обрано">
            <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
              {UA.districts.map((d, i) => (
                <button key={d} className={'chip ' + ([0,1,2].includes(i) ? 'solid' : '')}>
                  {[0,1,2].includes(i) && <I.check s={12} c="#fff"/>}
                  {d}
                </button>
              ))}
            </div>
          </Section>

          {/* features */}
          <Section title="Особливості">
            <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
              {[
                ['Балкон/Лоджія', false],
                ['Паркінг', true],
                ['Меблі', true],
                ['Ремонт під ключ', false],
                ['Камін', false],
                ['Тераса', true],
                ['Smart Home', false],
                ['Охорона', false],
                ['Сауна', false],
                ['Власник', false],
              ].map(([l, a]) => (
                <button key={l} className={'chip ' + (a ? 'solid' : '')}>
                  {a && <I.check s={12} c="#fff"/>}
                  {l}
                </button>
              ))}
            </div>
          </Section>

          {/* year, floor */}
          <Section title="Поверх та рік">
            <div style={{ display:'flex', gap: 10 }}>
              <div className="input" style={{ flex:1, height:44, justifyContent:'space-between' }}>
                <span style={{ color:'var(--muted)', fontSize: 12 }}>Не перший</span>
                <span style={{ width: 36, height: 20, borderRadius: 100, background:'var(--ink)', position:'relative' }}>
                  <span style={{ position:'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: 100, background:'#fff' }}/>
                </span>
              </div>
              <div className="input" style={{ flex:1, height:44, justifyContent:'space-between' }}>
                <span style={{ color:'var(--muted)', fontSize: 12 }}>Не останній</span>
                <span style={{ width: 36, height: 20, borderRadius: 100, background:'rgba(20,19,15,0.15)', position:'relative' }}>
                  <span style={{ position:'absolute', left: 2, top: 2, width: 16, height: 16, borderRadius: 100, background:'#fff' }}/>
                </span>
              </div>
            </div>
            <div style={{ marginTop: 10, display:'flex', gap: 8 }}>
              {['Новобудова', 'Здано', 'Сталінка', 'Хрущовка', 'Чешка'].map((y, i) => (
                <button key={y} className={'chip ' + (i === 0 ? 'solid' : '')}>{y}</button>
              ))}
            </div>
          </Section>

          <div style={{ height: 120 }}/>
        </div>

        {/* sticky apply */}
        <div style={{ padding: '12px 16px 28px', borderTop: '0.5px solid var(--hair)', background: 'var(--bg)',
          display: 'flex', alignItems:'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color:'var(--muted)' }}>Знайдено</div>
            <div className="num-display" style={{ fontSize: 22, whiteSpace:'nowrap' }}>248 об'єктів</div>
          </div>
          <button className="btn btn-primary" style={{ flex: '1.4 1 0', minWidth: 0 }}>Показати <I.chev s={14} c="#fff"/></button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 5 — MAP
// ═══════════════════════════════════════════════════════════
function ScreenMap({ mainCurrency = 'usd' }) {
  // pins positioned on a stylised Dnipro map
  const pins = [
    { left: '24%', top: '28%', label: '$96K', cluster: false },
    { left: '52%', top: '36%', label: '$685K', active: true },
    { left: '38%', top: '46%', label: '12', cluster: true },
    { left: '64%', top: '52%', label: '$189K', cluster: false },
    { left: '74%', top: '64%', label: '7', cluster: true },
    { left: '32%', top: '62%', label: '$168K', cluster: false },
    { left: '46%', top: '72%', label: '$52K', cluster: false },
    { left: '82%', top: '34%', label: '4', cluster: true },
  ];
  const item = LISTINGS[0];

  return (
    <div className="tg" style={{ background:'#232823' }}>
      {/* satellite map */}
      <div className="maptile-sat" style={{ position:'absolute', inset: 0 }}>

        {/* district labels — light/airy on dark base */}
        <div style={{ position:'absolute', left:'18%', top:'16%',
          fontFamily:'var(--font-ui)', fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing:'0.16em', textTransform:'uppercase', fontWeight: 600 }}>Соборний</div>
        <div style={{ position:'absolute', left:'68%', top:'14%',
          fontFamily:'var(--font-ui)', fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing:'0.16em', textTransform:'uppercase', fontWeight: 600 }}>Самарський</div>
        <div style={{ position:'absolute', left:'22%', top:'82%',
          fontFamily:'var(--font-ui)', fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing:'0.16em', textTransform:'uppercase', fontWeight: 600 }}>Чечелівський</div>
        <div style={{ position:'absolute', left:'52%', top:'58%', transform:'rotate(-22deg)',
          fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 22, color: 'rgba(255,255,255,0.7)', letterSpacing:'0.04em' }}>р. Дніпро</div>

        {/* pins */}
        {pins.map((p, i) => (
          <div key={i} className={'map-pin ' + (p.cluster ? 'cluster' : '') + (p.active ? ' active' : '')}
               style={{ left: p.left, top: p.top }}>
            {p.label}
          </div>
        ))}
      </div>

      {/* top floating search */}
      <div style={{ position:'absolute', top: 56, left: 16, right: 16, display:'flex', gap: 10, zIndex: 5 }}>
        <button className="tg-back glass" style={{ width: 44, height: 44 }}>
          <I.back s={16}/>
        </button>
        <div className="glass" style={{ flex: 1, height: 44, borderRadius: 12, display:'flex', alignItems:'center', gap: 10, padding:'0 14px' }}>
          <I.search s={18} c="#6B6862" w={1.8}/>
          <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>Дніпро</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>248 об'єктів</span>
        </div>
        <button className="tg-back glass" style={{ width: 44, height: 44 }}>
          <I.slider s={16}/>
        </button>
      </div>

      {/* active filter pills floating */}
      <div style={{ position:'absolute', top: 112, left: 0, right: 0, zIndex: 5 }}>
        <div className="hscroll">
          <button className="chip glass" style={{ display:'flex' }}>
            <I.tag s={13}/>$50K–$350K
          </button>
          <button className="chip glass">2–3 кімнати</button>
          <button className="chip glass">Соборний +2</button>
          <button className="chip glass">Паркінг</button>
        </div>
      </div>

      {/* right side controls */}
      <div style={{ position:'absolute', right: 16, top: 220, zIndex: 5, display:'flex', flexDirection:'column', gap: 8 }}>
        <button className="glass" style={{ width: 44, height: 44, borderRadius: 12, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <I.layers s={18}/>
        </button>
        <button className="glass" style={{ width: 44, height: 44, borderRadius: 12, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <I.compass s={18}/>
        </button>
        <button className="glass" style={{ width: 44, height: 44, borderRadius: 12, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <I.pin s={18}/>
        </button>
      </div>

      {/* List toggle pill */}
      <button style={{ position:'absolute', left:'50%', top: 470, transform:'translateX(-50%)', zIndex:5,
        height: 40, padding:'0 18px', borderRadius: 100, background:'var(--ink)', color:'#fff', fontSize:13, fontWeight: 600, display:'flex', alignItems:'center', gap:8,
        boxShadow:'0 4px 14px rgba(20,19,15,0.25)' }}>
        <I.layers s={14} c="#fff"/> Списком
      </button>

      {/* bottom mini-card carousel */}
      <div style={{ position:'absolute', bottom: 92, left: 0, right: 0, zIndex: 5 }}>
        <div className="hscroll">
          {LISTINGS.slice(0, 4).map((it, i) => (
            <div key={it.id} className="card" style={{ width: 280, padding: 10, display:'flex', gap: 10, alignItems:'center',
              boxShadow: i === 0 ? '0 6px 22px rgba(20,19,15,0.18), 0 1px 2px rgba(20,19,15,0.06)' : undefined }}>
              <BldgImage variant={it.bg} height={70} rounded={10} showBldgs={true}/>
              <div style={{ flex:1, minWidth:0, paddingRight: 4 }}>
                <div style={{ fontSize: 10.5, color:'var(--muted)' }}>{it.district}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: 1.2,
                  display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{it.title}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 4 }}>
                  <span className="num-display" style={{ fontSize: 16 }}>{mainCurrency === 'usd' ? fmt.usd(it.usd) : fmt.uah(it.usd*41.2)}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>{it.rooms}к · {it.area}м²</span>
                </div>
              </div>
            </div>
          ))}
          {/* must mirror width to allow last card alignment */}
          <div style={{ width: 4 }}/>
        </div>
      </div>

      <TabBar active="map"/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 6 — FAVORITES
// ═══════════════════════════════════════════════════════════
function ScreenFavorites({ mainCurrency = 'usd' }) {
  // all favorites + one extra so the screen feels populated
  const fav = [...LISTINGS.slice(0, 4), LISTINGS[5]];
  return (
    <div className="tg">
      <TgHeader title="Обране" sub={fav.length + " об'єктів"}/>

      <div className="tg-body" style={{ paddingBottom: 96 }}>

        {/* sort/filter strip */}
        <div style={{ padding: '4px 20px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div className="h-display" style={{ fontSize: 26 }}>Збережене</div>
          <button style={{ display:'flex', alignItems:'center', gap: 4, fontSize: 12.5, color:'var(--muted)', fontWeight: 500 }}>
            <I.filter s={14} c="var(--muted)"/> Дата додавання
          </button>
        </div>

        {/* favorites list — full cards with photos */}
        <div style={{ padding: '0 16px', display:'flex', flexDirection:'column', gap: 12 }}>
          {fav.map((it, i) => {
            const labels = ['Зниження ціни', null, 'Заплановано перегляд', null, null];
            const labelStyle = i === 0 ? 'accent' : i === 2 ? '' : '';
            return (
              <div key={it.id} className="card" style={{ overflow:'hidden' }}>
                {/* photo */}
                <div style={{ position:'relative' }}>
                  <BldgImage variant={it.bg} height={180} rounded={0} tag={it.tag} tagColor={it.tagColor}/>
                  <button style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius: 100, display:'flex', alignItems:'center', justifyContent:'center' }} className="glass">
                    <I.heartFill s={16} c="var(--danger)"/>
                  </button>
                  {labels[i] && (
                    <div style={{ position:'absolute', bottom:12, left:12 }}>
                      <span className={'tag ' + labelStyle} style={{ fontSize: 10 }}>
                        {i === 0 && <span style={{ marginRight: 4 }}>−$5 000</span>}
                        {labels[i]}
                      </span>
                    </div>
                  )}
                </div>
                {/* meta */}
                <div style={{ padding: 14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing:'0.02em' }}>{it.district} · {UA.city}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>Додано {i+1}д тому</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25, letterSpacing:'-0.01em', marginTop: 6, textWrap:'balance' }}>{it.title}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop: 10 }}>
                    <span style={{ fontSize: 12, color:'var(--muted)' }}>{it.rooms} кімн. · {it.area} м² · {it.floor}</span>
                    <span className="num-display" style={{ fontSize: 22 }}>{mainCurrency === 'usd' ? fmt.usd(it.usd) : fmt.uah(it.usd*41.2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* compare cta */}
        <div style={{ padding: '20px 16px 0' }}>
          <div className="card-flat" style={{ padding: 16, display:'flex', alignItems:'center', gap: 12 }}>
            <div className="ph deep" style={{ width: 44, height: 44, borderRadius: 12 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Порівняти 3 об'єкти</div>
              <div style={{ fontSize: 12, color:'var(--muted)', marginTop: 2 }}>Площа, ціна, поверх, інфраструктура</div>
            </div>
            <I.chev s={14} c="var(--muted)"/>
          </div>
        </div>
      </div>

      <TabBar active="fav"/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   SCREEN 7 — REALTOR DASHBOARD
// ═══════════════════════════════════════════════════════════
function ScreenDashboard({ mainCurrency = 'usd' }) {
  const r = REALTOR;

  return (
    <div className="tg">
      <TgHeader title="Кабінет ріелтора"/>

      <div className="tg-body" style={{ paddingBottom: 32 }}>

        {/* identity card */}
        <div style={{ padding: '4px 16px 0' }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display:'flex', gap: 14, alignItems:'center' }}>
              <div className="ph clay" style={{ width: 58, height: 58, borderRadius: 100, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing:'-0.01em' }}>{r.name}</div>
                <div style={{ fontSize: 12, color:'var(--muted)', marginTop: 2 }}>{r.firm}</div>
              </div>
              <button style={{ width: 36, height: 36, borderRadius: 100, background:'rgba(20,19,15,0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink)' }}>
                <I.dots s={16}/>
              </button>
            </div>
          </div>
        </div>

        {/* stats grid */}
        <div style={{ padding: '14px 16px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          <div className="stat">
            <div className="k">Активних оголошень</div>
            <div className="v">{r.active}</div>
            <div className="d" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <I.trend s={12} c="var(--accent)"/> +2 цього тижня
            </div>
          </div>
          <div className="stat">
            <div className="k">Перегляди · 30 днів</div>
            <div className="v">{r.views30.toLocaleString('uk-UA').replace(/,/g,' ')}</div>
            <div className="d" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <I.trend s={12} c="var(--accent)"/> +18,4%
            </div>
          </div>
          <div className="stat">
            <div className="k">Заявок · 30 днів</div>
            <div className="v">{r.leads}</div>
            <div className="d" style={{ color: 'var(--warm)', display:'flex', alignItems:'center', gap:4 }}>
              <span>12 у роботі</span>
            </div>
          </div>
          <div className="stat">
            <div className="k">Угод · травень</div>
            <div className="v">{r.deals30}</div>
            <div className="d" style={{ color: 'var(--muted)' }}>$84 200 комісія</div>
          </div>
        </div>

        {/* chart card */}
        <div style={{ padding: '14px 16px 0' }}>
          <div className="card-flat" style={{ padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="eyebrow">Перегляди оголошень</div>
                <div className="num-display" style={{ fontSize: 30, marginTop: 6 }}>8 420</div>
                <div style={{ fontSize: 11.5, color:'var(--accent)', fontWeight: 600, marginTop: 2 }}>+1 312 vs минулий місяць</div>
              </div>
              <div style={{ display:'flex', gap: 4, padding: 3, background:'rgba(20,19,15,0.06)', borderRadius: 8 }}>
                {['7д','30д','90д'].map((t, i) => (
                  <button key={t} style={{ padding:'4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                    background: i === 1 ? '#fff' : 'transparent', color: i === 1 ? 'var(--ink)' : 'var(--muted)' }}>{t}</button>
                ))}
              </div>
            </div>
            {/* simple line chart */}
            <svg viewBox="0 0 300 80" style={{ width:'100%', height: 80, marginTop: 14, display:'block' }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F3A2E" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#1F3A2E" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 60 L20 52 L40 56 L60 42 L80 46 L100 32 L120 38 L140 22 L160 26 L180 18 L200 30 L220 24 L240 14 L260 22 L280 12 L300 18 L300 80 L0 80 Z" fill="url(#g1)"/>
              <path d="M0 60 L20 52 L40 56 L60 42 L80 46 L100 32 L120 38 L140 22 L160 26 L180 18 L200 30 L220 24 L240 14 L260 22 L280 12 L300 18" stroke="#1F3A2E" strokeWidth="1.6" fill="none"/>
              <circle cx="280" cy="12" r="3" fill="#1F3A2E"/>
              <circle cx="280" cy="12" r="6" fill="#1F3A2E" fillOpacity="0.2"/>
            </svg>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 10, color:'var(--muted-2)', marginTop: 4 }}>
              <span>1 трав</span><span>10</span><span>20</span><span>30</span>
            </div>
          </div>
        </div>

        {/* listings management */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'24px 20px 12px' }}>
          <div className="h-display" style={{ fontSize: 22 }}>Мої оголошення</div>
          <button style={{ fontSize: 13, fontWeight: 600, color:'var(--accent)', display:'flex', alignItems:'center', gap: 4 }}>
            <I.plus s={14} c="var(--accent)" w={2}/> Додати
          </button>
        </div>

        <div style={{ padding: '0 16px', display:'flex', flexDirection:'column', gap: 10 }}>
          {LISTINGS.slice(0,3).map((it, i) => (
            <div key={it.id} className="card" style={{ padding: 12 }}>
              <div style={{ display:'flex', gap: 12 }}>
                <BldgImage variant={it.bg} height={70} rounded={10}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing:'-0.01em', lineHeight: 1.2,
                      display:'-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{it.title}</div>
                    <button style={{ color:'var(--muted)' }}><I.dots s={16}/></button>
                  </div>
                  <div style={{ fontSize: 11, color:'var(--muted)', marginTop: 2 }}>{it.id} · {it.district}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop: 6 }}>
                    <span className="num-display" style={{ fontSize: 15 }}>{fmt.usd(it.usd)}</span>
                    <span className={'tag ' + (i === 0 ? 'accent' : i === 2 ? 'gold' : '')} style={{ fontSize: 9, background: i === 1 ? 'rgba(20,19,15,0.06)' : undefined, color: i === 1 ? 'var(--ink-2)' : undefined }}>
                      {i === 0 ? 'Активне' : i === 1 ? 'На модерації' : 'Топ'}
                    </span>
                  </div>
                </div>
              </div>
              {/* metric strip */}
              <div style={{ display:'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--hair)', fontSize: 11.5 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 5, color:'var(--ink-2)' }}>
                  <I.eye s={13} c="var(--muted)" w={1.8}/>
                  <span className="num-display" style={{ fontSize: 13 }}>{it.views}</span>
                  <span style={{ color:'var(--muted)' }}>переглядів</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 5 }}>
                  <I.heart s={13} c="var(--muted)" w={1.8}/>
                  <span className="num-display" style={{ fontSize: 13 }}>{it.saved}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 5, marginLeft:'auto' }}>
                  <I.chat s={13} c="var(--muted)" w={1.8}/>
                  <span className="num-display" style={{ fontSize: 13 }}>{Math.round(it.saved/4)}</span>
                  <span style={{ color:'var(--muted)' }}>заявок</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* recent activity */}
        <div style={{ padding: '24px 20px 12px' }}>
          <div className="h-display" style={{ fontSize: 22 }}>Свіжі заявки</div>
        </div>
        <div style={{ padding: '0 16px', display:'flex', flexDirection:'column', gap: 0 }}>
          <div className="card-flat" style={{ padding: 0 }}>
            {[
              { n: 'Дмитро К.', a: 'Запит на перегляд', l: 'наб. Січеславська 33', t: '12 хв', icon: I.calendar },
              { n: 'Анна М.', a: 'Зберегла в обране', l: 'просп. Яворницького 70', t: '38 хв', icon: I.heart },
              { n: 'Сергій П.', a: 'Дзвінок', l: 'вул. Лазаряна 8', t: '1 год', icon: I.phone },
              { n: 'Юлія В.', a: 'Повідомлення', l: 'бул. Кучеревського 7', t: '3 год', icon: I.chat },
            ].map((a, i, arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '0.5px solid var(--hair)' : 'none' }}>
                <div className={'ph ' + ['warm','sand','clay','cool'][i]} style={{ width: 36, height: 36, borderRadius: 100, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.n}</div>
                  <div style={{ fontSize: 11.5, color:'var(--muted)', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    <a.icon s={11} c="var(--muted)"/> {a.a} · {a.l}
                  </div>
                </div>
                <div style={{ fontSize: 11, color:'var(--muted-2)' }}>{a.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenFilters = ScreenFilters;
window.ScreenMap = ScreenMap;
window.ScreenFavorites = ScreenFavorites;
window.ScreenDashboard = ScreenDashboard;
