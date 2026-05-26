-- Realty Mini App initial schema

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Agents (realtors) ───
CREATE TABLE IF NOT EXISTS agents (
  id            SERIAL PRIMARY KEY,
  tg_id         BIGINT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  position      TEXT,
  experience_years INT DEFAULT 0,
  deals_count   INT DEFAULT 0,
  bio           TEXT,
  phone         TEXT,
  tg_username   TEXT,
  languages     TEXT[] DEFAULT ARRAY['Українська'],
  photo         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Clients ───
CREATE TABLE IF NOT EXISTS clients (
  id            SERIAL PRIMARY KEY,
  tg_id         BIGINT UNIQUE NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  tg_username   TEXT,
  phone         TEXT,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Properties ───
CREATE TABLE IF NOT EXISTS properties (
  id            SERIAL PRIMARY KEY,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','reserved','sold_rented','withdrawn')),
  type          TEXT NOT NULL
                CHECK (type IN ('apartment','house','commercial','land')),
  deal          TEXT NOT NULL
                CHECK (deal IN ('sale','rent')),

  price_value   NUMERIC(14,2) NOT NULL,
  price_currency TEXT NOT NULL CHECK (price_currency IN ('USD','UAH')),
  price_value_secondary NUMERIC(14,2),
  price_currency_secondary TEXT CHECK (price_currency_secondary IN ('USD','UAH')),

  address       TEXT NOT NULL,
  district      TEXT,
  complex_name  TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,

  area_total    NUMERIC(8,2),
  area_living   NUMERIC(8,2),
  area_kitchen  NUMERIC(8,2),

  rooms         INT,
  floor         INT,
  floors_total  INT,
  year_built    INT,

  building_type TEXT,
  condition     TEXT,
  description   TEXT,

  -- Optional
  heating_type      TEXT,
  balcony           TEXT,
  parking           TEXT,
  furniture         TEXT,
  appliances        TEXT,
  kids_allowed      BOOLEAN,
  pets_allowed      BOOLEAN,
  deposit           NUMERIC(14,2),
  utilities_included BOOLEAN,
  bathroom          TEXT,
  ceiling_height    NUMERIC(4,2),
  documents         TEXT,
  plot_area         NUMERIC(8,2),

  features      TEXT[] DEFAULT '{}',

  created_by    INT NOT NULL REFERENCES agents(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at   TIMESTAMPTZ
);

CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type_deal ON properties(type, deal);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_price ON properties(price_value);
CREATE INDEX idx_properties_search ON properties USING gin (
  (coalesce(address,'') || ' ' || coalesce(complex_name,'') || ' ' || coalesce(district,'')) gin_trgm_ops
);

-- ─── Property Photos ───
CREATE TABLE IF NOT EXISTS property_photos (
  id            SERIAL PRIMARY KEY,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  thumb_filename TEXT,
  is_cover      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_property ON property_photos(property_id, sort_order);

-- ─── Viewings (appointments) ───
CREATE TABLE IF NOT EXISTS viewings (
  id            SERIAL PRIMARY KEY,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id     INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_id      INT NOT NULL REFERENCES agents(id),

  scheduled_at  TIMESTAMPTZ NOT NULL,
  client_name   TEXT NOT NULL,
  client_phone  TEXT NOT NULL,
  note          TEXT,

  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','cancelled_by_client','done')),

  reminder_day_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_hour_sent BOOLEAN NOT NULL DEFAULT FALSE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ
);

CREATE INDEX idx_viewings_property ON viewings(property_id);
CREATE INDEX idx_viewings_client ON viewings(client_id);
CREATE INDEX idx_viewings_status_scheduled ON viewings(status, scheduled_at);

-- ─── Favorites ───
CREATE TABLE IF NOT EXISTS favorites (
  client_id     INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, property_id)
);

-- ─── Property Views ───
CREATE TABLE IF NOT EXISTS property_views (
  id            SERIAL PRIMARY KEY,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id     INT REFERENCES clients(id) ON DELETE SET NULL,
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_views_property_date ON property_views(property_id, viewed_at);

-- ─── Shares ───
CREATE TABLE IF NOT EXISTS shares (
  id            SERIAL PRIMARY KEY,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id     INT REFERENCES clients(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Exchange Rates (NBU) ───
CREATE TABLE IF NOT EXISTS exchange_rates (
  date          DATE PRIMARY KEY,
  usd_uah       NUMERIC(10,4) NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Migration tracker ───
CREATE TABLE IF NOT EXISTS schema_migrations (
  version       TEXT PRIMARY KEY,
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
