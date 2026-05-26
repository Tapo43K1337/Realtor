export const UA = {
  city: 'Дніпро',
  districts: [
    'Соборний', 'Шевченківський', 'Центральний',
    'Чечелівський', 'Новокодацький', 'Самарський',
    'Амур-Нижньодніпровський', 'Індустріальний',
  ],
};

// Stable visual-variant picker for property covers when no photo is uploaded yet.
const VARIANTS = ['cool', 'warm', 'sand', 'clay', 'deep', 'fog', 'night'] as const;
export type CoverVariant = typeof VARIANTS[number];
export function coverVariant(propertyId: number | string): CoverVariant {
  const n = typeof propertyId === 'number' ? propertyId : propertyId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return VARIANTS[Math.abs(n) % VARIANTS.length];
}

// Type label for property type code
export function typeLabel(t: 'apartment' | 'house' | 'commercial' | 'land'): string {
  return ({ apartment: 'Квартира', house: 'Будинок', commercial: 'Комерція', land: 'Ділянка' })[t];
}

// Deal label
export function dealLabel(d: 'sale' | 'rent'): string {
  return d === 'sale' ? 'Продаж' : 'Оренда';
}

// Derive a display title from a Property (used until you write your own marketing copy)
export function deriveTitle(p: {
  complex_name?: string | null;
  description?: string | null;
  type: 'apartment' | 'house' | 'commercial' | 'land';
  rooms?: number | null;
  area_total?: number | null;
  address: string;
}): string {
  if (p.complex_name && p.complex_name.length > 2) return p.complex_name;
  if (p.description) {
    const first = p.description.split(/\.|\n/)[0].trim();
    if (first.length > 8 && first.length < 90) return first;
  }
  const t = typeLabel(p.type);
  const rooms = p.rooms ? `${p.rooms}к` : '';
  const area = p.area_total ? `${p.area_total}м²` : '';
  return [t, rooms, area].filter(Boolean).join(' · ') || p.address;
}
