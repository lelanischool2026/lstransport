-- MIGRATION: Restore original learner schema with all fields + house help
-- Run this in Supabase SQL Editor

-- First, drop the existing learners table constraints and recreate with original schema
-- WARNING: This will delete existing learner data

-- Option 1: If you have no data to preserve, drop and recreate
DROP TABLE IF EXISTS learners CASCADE;

CREATE TABLE learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admission_no TEXT,
  class TEXT,
  pickup_area TEXT,
  pickup_time TIME,
  dropoff_area TEXT,
  drop_time TIME,
  father_phone TEXT,
  mother_phone TEXT,
  house_help_phone TEXT,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  trip INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;

-- Create policies for learners
CREATE POLICY "Allow authenticated read access on learners"
  ON learners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on learners"
  ON learners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on learners"
  ON learners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on learners"
  ON learners FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX idx_learners_route_id ON learners(route_id);
CREATE INDEX idx_learners_active ON learners(active);
CREATE INDEX idx_learners_class ON learners(class);
CREATE INDEX idx_learners_pickup_area ON learners(pickup_area);

-- Insert the sample learner from backup
INSERT INTO learners (id, name, admission_no, class, pickup_area, pickup_time, dropoff_area, drop_time, father_phone, mother_phone, route_id, trip, active) VALUES 
('b0bf4d61-4e3a-4e85-b340-ede696e68f3c', 'kevin ken', '20203', 'Grade 4 TULIP', 'RAINBOW', '06:58:00', 'DESTINY', '16:30:00', '0700877236', '0700877236', '00335cdf-da2f-41cd-9c99-133b49927bad', 1, true)
ON CONFLICT (id) DO NOTHING;
