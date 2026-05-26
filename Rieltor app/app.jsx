/* global React, ReactDOM, IOSDevice, DesignCanvas, DCSection, DCArtboard,
   ScreenFeed, ScreenDetail, ScreenGallery, ScreenFilters, ScreenMap, ScreenFavorites, ScreenDashboard,
   useTweaks, TweaksPanel, TweakSection, TweakRadio */

const TWEAKS = /*EDITMODE-BEGIN*/{
  "currency": "usd",
  "accent": "forest",
  "density": "comfortable"
}/*EDITMODE-END*/;

const ACCENTS = {
  forest: { '--accent':'#1F3A2E', '--accent-2':'#355E4B' },
  ink:    { '--accent':'#14130F', '--accent-2':'#2B2A26' },
  clay:   { '--accent':'#9C5232', '--accent-2':'#B26A3F' },
  navy:   { '--accent':'#1B2A47', '--accent-2':'#2F4470' },
};

function Frame({ children, label }) {
  return (
    <div data-screen-label={label} style={{ position:'relative' }}>
      <IOSDevice width={402} height={874}>
        {children}
      </IOSDevice>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAKS);

  // apply accent palette
  React.useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[t.accent] || ACCENTS.forest;
    Object.entries(a).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [t.accent]);

  const cur = t.currency;

  return (
    <>
      <DesignCanvas title="Realty · Telegram Mini App"
        subtitle="Преміум нерухомість · Дніпро · UAH / USD">

        <DCSection id="flow" title="Основний потік"
          subtitle="Огляд → перегляд об'єкта → галерея → запит на перегляд">
          <DCArtboard id="feed" label="01 — Огляд" width={402} height={874}>
            <Frame label="01 Feed"><ScreenFeed mainCurrency={cur}/></Frame>
          </DCArtboard>
          <DCArtboard id="detail" label="02 — Деталі об'єкта" width={402} height={874}>
            <Frame label="02 Detail"><ScreenDetail mainCurrency={cur}/></Frame>
          </DCArtboard>
          <DCArtboard id="gallery" label="03 — Галерея" width={402} height={874}>
            <Frame label="03 Gallery"><ScreenGallery/></Frame>
          </DCArtboard>
        </DCSection>

        <DCSection id="search" title="Пошук та відкриття"
          subtitle="Фільтри та карта міста — два способи звужувати пошук">
          <DCArtboard id="filters" label="04 — Фільтри" width={402} height={874}>
            <Frame label="04 Filters"><ScreenFilters mainCurrency={cur}/></Frame>
          </DCArtboard>
          <DCArtboard id="map" label="05 — Карта Дніпра" width={402} height={874}>
            <Frame label="05 Map"><ScreenMap mainCurrency={cur}/></Frame>
          </DCArtboard>
        </DCSection>

        <DCSection id="personal" title="Особистий простір"
          subtitle="Збережене для клієнта · робочий стіл ріелтора">
          <DCArtboard id="favorites" label="06 — Обране" width={402} height={874}>
            <Frame label="06 Favorites"><ScreenFavorites mainCurrency={cur}/></Frame>
          </DCArtboard>
          <DCArtboard id="dashboard" label="07 — Кабінет ріелтора" width={402} height={874}>
            <Frame label="07 Dashboard"><ScreenDashboard mainCurrency={cur}/></Frame>
          </DCArtboard>
        </DCSection>

      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Валюта"/>
        <TweakRadio label="Основна валюта" value={t.currency}
          options={[{ value:'usd', label:'USD' }, { value:'uah', label:'UAH' }]}
          onChange={(v) => setTweak('currency', v)} />
        <TweakSection label="Акцент"/>
        <TweakRadio label="Колір акценту" value={t.accent}
          options={[
            { value:'forest', label:'Forest' },
            { value:'ink',    label:'Ink' },
            { value:'clay',   label:'Clay' },
            { value:'navy',   label:'Navy' },
          ]}
          onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
