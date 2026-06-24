-- ============================================================
-- 旅のしおり - Supabase Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS itineraries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  destination   TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  start_date    DATE,
  end_date      DATE,
  cover_image_url TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id  UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('schedule', 'todo', 'packing', 'memo')),
  title         TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  is_checked    BOOLEAN NOT NULL DEFAULT FALSE,
  position      INTEGER NOT NULL DEFAULT 0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_itineraries_slug ON itineraries(slug);
CREATE INDEX IF NOT EXISTS idx_sections_itinerary_id ON sections(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_sections_position ON sections(itinerary_id, position);
CREATE INDEX IF NOT EXISTS idx_items_section_id ON items(section_id);
CREATE INDEX IF NOT EXISTS idx_items_position ON items(section_id, position);

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE itineraries;
ALTER PUBLICATION supabase_realtime ADD TABLE sections;
ALTER PUBLICATION supabase_realtime ADD TABLE items;

-- ============================================================
-- STORAGE BUCKET (run manually in Supabase dashboard or via API)
-- ============================================================
-- Storage bucket "shiori-images" must be created manually:
--   1. Go to Supabase Dashboard > Storage
--   2. Create bucket named "shiori-images"
--   3. Set it as PUBLIC
--   4. Add policy: allow all uploads (INSERT) for anon role
--   5. Allow SELECT for all (public read)

-- ============================================================
-- ROW LEVEL SECURITY (optional - disable for simplicity)
-- ============================================================
-- For a demo app, RLS can be disabled.
-- Password check is done in the application layer.

ALTER TABLE itineraries DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections    DISABLE ROW LEVEL SECURITY;
ALTER TABLE items       DISABLE ROW LEVEL SECURITY;
