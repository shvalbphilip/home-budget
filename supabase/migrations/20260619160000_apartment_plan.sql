-- Apartment plan (single JSONB document: rooms, plan items, style profile, advisor chat)
CREATE TABLE IF NOT EXISTS apartment_plan (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO apartment_plan (id, data) VALUES ('main', '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE apartment_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_apartment_plan" ON apartment_plan
  FOR ALL USING (true) WITH CHECK (true);
