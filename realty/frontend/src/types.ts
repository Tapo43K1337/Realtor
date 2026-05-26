export type Currency = 'USD' | 'UAH';
export type PropertyStatus = 'draft' | 'active' | 'reserved' | 'sold_rented' | 'withdrawn';
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land';
export type DealType = 'sale' | 'rent';

export type Photo = {
  id: number;
  url: string;
  thumb_url: string | null;
  is_cover: boolean;
  sort_order: number;
};

export type Agent = {
  id: number;
  name: string;
  position?: string;
  experience_years?: number;
  deals_count?: number;
  bio?: string;
  phone?: string;
  tg_username?: string;
  languages?: string[];
  photo?: string;
};

export type Property = {
  id: number;
  status: PropertyStatus;
  type: PropertyType;
  deal: DealType;
  price_value: number;
  price_currency: Currency;
  price_value_secondary?: number | null;
  price_currency_secondary?: Currency | null;
  address: string;
  district?: string | null;
  complex_name?: string | null;
  lat?: number | null;
  lng?: number | null;
  area_total?: number | null;
  area_living?: number | null;
  area_kitchen?: number | null;
  rooms?: number | null;
  floor?: number | null;
  floors_total?: number | null;
  year_built?: number | null;
  building_type?: string | null;
  condition?: string | null;
  description?: string | null;
  heating_type?: string | null;
  balcony?: string | null;
  parking?: string | null;
  furniture?: string | null;
  appliances?: string | null;
  kids_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  deposit?: number | null;
  utilities_included?: boolean | null;
  bathroom?: string | null;
  ceiling_height?: number | null;
  documents?: string | null;
  plot_area?: number | null;
  features?: string[];
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  photos: Photo[];
  agent: Agent | null;
};

export type Viewing = {
  id: number;
  scheduled_at: string | null;
  status: 'pending' | 'cancelled_by_client' | 'done';
  client_name: string;
  client_phone: string;
  note?: string | null;
  property_id: number;
  address: string;
  district?: string | null;
  price_value: number;
  price_currency: Currency;
  client_username?: string | null;
};

export type Session = {
  token: string;
  user: {
    role: 'realtor' | 'client';
    tgId: string;
    agentId?: number;
    clientId?: number;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
};

export type Filters = {
  q?: string;
  type?: PropertyType;
  deal?: DealType;
  district?: string;
  rooms_min?: number;
  rooms_max?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  currency?: Currency;
  status?: PropertyStatus;
};
