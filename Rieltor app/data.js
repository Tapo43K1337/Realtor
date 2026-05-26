/* global window */
// Ukrainian real estate data — Dnipro

window.UA = {
  city: 'Дніпро',
  districts: [
    'Соборний', 'Шевченківський', 'Центральний',
    'Чечелівський', 'Новокодацький', 'Самарський',
    'Амур-Нижньодніпровський', 'Індустріальний',
  ],
};

// rate as of design — USD ≈ 41.2 UAH
window.fmt = {
  usd: (n) => '$' + n.toLocaleString('en-US'),
  uah: (n) => (Math.round(n)).toLocaleString('uk-UA').replace(/,/g, ' ') + ' ₴',
  uahShort: (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0','') + ' млн ₴';
    if (n >= 1000) return Math.round(n / 1000) + ' тис ₴';
    return n + ' ₴';
  },
  usdShort: (n) => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2).replace(/\.?0+$/,'') + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + n;
  },
  m2: (n) => n + ' м²',
};

window.LISTINGS = [
  {
    id: 'L-2417',
    title: 'Пентхаус з терасою над Дніпром',
    addr: 'наб. Січеславська 33',
    district: 'Соборний',
    type: 'Пентхаус',
    rooms: 4, area: 186, floor: '24/24', year: 2022,
    usd: 685000,
    bg: 'cool',
    tag: 'Преміум',
    tagColor: 'gold',
    realtor: 'Олена Кравченко',
    realtorFirm: 'Riviera Estate',
    desc: 'Авторський дизайн, панорамне скління 180°, приватна тераса 42 м² з виходом на дах.',
    features: ['Тераса 42 м²', 'Панорама на Дніпро', 'Підземний паркінг', 'Камін'],
    views: 1284, saved: 86, days: 3,
  },
  {
    id: 'L-2408',
    title: 'Класична квартира в історичному центрі',
    addr: 'просп. Дмитра Яворницького 70',
    district: 'Центральний',
    type: 'Квартира',
    rooms: 3, area: 112, floor: '4/5', year: 1953,
    usd: 189000,
    bg: 'warm',
    tag: 'Сталінка',
    realtor: 'Артем Левченко',
    realtorFirm: 'Riviera Estate',
    desc: 'Висота 3,4 м, оригінальний паркет, лоджія з видом на бульвар.',
    features: ['Висота 3,4 м', 'Лоджія', 'Дубовий паркет', 'Капремонт 2023'],
    views: 612, saved: 41, days: 7,
  },
  {
    id: 'L-2402',
    title: 'Двокімнатна біля парку Глоби',
    addr: 'вул. Січових Стрільців 17',
    district: 'Соборний',
    type: 'Квартира',
    rooms: 2, area: 64, floor: '7/16', year: 2019,
    usd: 96500,
    bg: 'sand',
    realtor: 'Артем Левченко',
    realtorFirm: 'Riviera Estate',
    desc: 'Стильний ремонт, кухня-вітальня, два балкони, кімната-гардероб.',
    features: ['Кухня-студія', 'Два балкони', 'Гардероб', 'Меблі'],
    views: 348, saved: 22, days: 2,
  },
  {
    id: 'L-2390',
    title: 'Будинок у Підгородньому',
    addr: 'вул. Перемоги 4, Підгороднє',
    district: 'Передмістя',
    type: 'Будинок',
    rooms: 5, area: 240, floor: '2 поверхи',
    year: 2020, plot: 12,
    usd: 295000,
    bg: 'clay',
    realtor: 'Марина Гнатюк',
    realtorFirm: 'Domus Group',
    desc: 'Цегляний будинок на ділянці 12 соток. Сауна, бесідка, гараж на 2 авто.',
    features: ['Ділянка 12 сот.', 'Сауна', 'Гараж 2 авто', 'Свердловина'],
    views: 502, saved: 31, days: 12,
  },
  {
    id: 'L-2389',
    title: 'Студія в новому ЖК «Софія»',
    addr: 'вул. Лазаряна 8',
    district: 'Шевченківський',
    type: 'Квартира',
    rooms: 1, area: 38, floor: '12/24', year: 2024,
    usd: 52000,
    bg: 'warm',
    tag: 'Новобудова',
    realtor: 'Олена Кравченко',
    realtorFirm: 'Riviera Estate',
    desc: 'Здача в експлуатацію 2024 рік. Документи на власність.',
    features: ['Новобудова', 'Документи готові', 'Закрита територія'],
    views: 287, saved: 18, days: 5,
  },
  {
    id: 'L-2371',
    title: 'Трикімнатна на бульварі Кучеревського',
    addr: 'бул. Кучеревського 7',
    district: 'Соборний',
    type: 'Квартира',
    rooms: 3, area: 96, floor: '9/12', year: 2018,
    usd: 168000,
    bg: 'sand',
    realtor: 'Артем Левченко',
    realtorFirm: 'Riviera Estate',
    desc: 'Авторський ремонт, фірмові меблі, smart-home система.',
    features: ['Smart Home', 'Кондиціонер у кожній кімнаті', 'Паркомісце'],
    views: 421, saved: 26, days: 14,
  },
];

// Realtor for dashboard
window.REALTOR = {
  name: 'Олена Кравченко',
  firm: 'Riviera Estate · Дніпро',
  rating: 4.9, deals: 87, years: 6,
  active: 12, views30: 8420, leads: 34, deals30: 3,
  badges: ['Верифікований', 'Топ-агент 2025'],
};

window.GALLERY_LABELS = [
  'Вітальня', 'Кухня', 'Спальня', 'Тераса', 'Санвузол',
  'Кабінет', 'Гардеробна', 'Будинок зовні', 'Вид з вікна',
];
