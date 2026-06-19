-- Settings (total budget + onboarding flag)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  total_budget NUMERIC DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- Categories / Rooms
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🏠',
  planned_budget NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'לרכישה',
  quantity INTEGER DEFAULT 1,
  estimated_price NUMERIC DEFAULT 0,
  actual_price NUMERIC DEFAULT 0,
  store TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'בינונית',
  notes TEXT DEFAULT '',
  purchase_date TEXT DEFAULT '',
  link TEXT DEFAULT '',
  is_essential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (public access — no auth)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_settings"   ON settings   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_items"      ON items      FOR ALL USING (true) WITH CHECK (true);
