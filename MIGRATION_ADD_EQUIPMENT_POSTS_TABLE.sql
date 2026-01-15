-- Create equipment_posts table for sales/equipment updates
CREATE TABLE IF NOT EXISTS equipment_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sales', 'equipment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_equipment_posts_category ON equipment_posts(category);
CREATE INDEX IF NOT EXISTS idx_equipment_posts_created_at ON equipment_posts(created_at DESC);

-- Disable RLS by default for simplicity (enable if needed)
ALTER TABLE equipment_posts DISABLE ROW LEVEL SECURITY;
