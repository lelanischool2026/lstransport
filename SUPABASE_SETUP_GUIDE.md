# Supabase Setup & Data Restoration Guide

## Quick Start for lelani-next

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Configure:
   - **Name:** `lelani-school-transport`
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to Kenya (e.g., `eu-west-1` or `ap-southeast-1`)
4. Wait 2-3 minutes for provisioning

### Step 2: Get Your API Keys

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

3. In your `lelani-next` folder, create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Enable Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** provider (toggle ON)
3. Go to **Authentication → Settings**
4. Set minimum password length to 8

### Step 4: Create Database Tables

Go to **SQL Editor → New Query** and run this complete schema:

```sql
-- ============================================
-- LELANI SCHOOL TRANSPORT - COMPLETE SCHEMA
-- ============================================

-- 1. ROUTES TABLE
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  areas TEXT[],
  term TEXT NOT NULL DEFAULT 'Term 1',
  year INTEGER NOT NULL DEFAULT 2026,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_year_term ON routes(year, term);

-- 2. DRIVERS TABLE
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_route_id ON drivers(route_id);
CREATE INDEX idx_drivers_role ON drivers(role);

-- 3. MINDERS TABLE
CREATE TABLE minders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_minders_driver_id ON minders(driver_id);
CREATE INDEX idx_minders_route_id ON minders(route_id);

-- 4. AREAS TABLE
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  pickup_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_areas_route_id ON areas(route_id);

-- 5. LEARNERS TABLE
CREATE TABLE learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT,
  guardian_name TEXT,
  guardian_phone TEXT NOT NULL,
  area TEXT,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  trip_type TEXT DEFAULT 'both' CHECK (trip_type IN ('morning', 'afternoon', 'both')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learners_route_id ON learners(route_id);
CREATE INDEX idx_learners_status ON learners(status);

-- 6. VEHICLES TABLE
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_number TEXT NOT NULL UNIQUE,
  make TEXT,
  model TEXT,
  capacity INTEGER DEFAULT 14,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. SCHOOL SETTINGS TABLE
CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  school_logo TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  current_term TEXT DEFAULT 'Term 1',
  current_year INTEGER DEFAULT 2026,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. SCHOOL CONFIG TABLE (for grades, streams)
CREATE TABLE school_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('grade', 'stream')),
  name TEXT NOT NULL,
  grade TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deactivated', 'reactivated')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_learner_id ON audit_logs(learner_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE minders ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Routes: All authenticated can read, admins can write
CREATE POLICY "routes_select" ON routes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "routes_insert" ON routes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "routes_update" ON routes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "routes_delete" ON routes FOR DELETE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- Drivers: View own + admins see all
CREATE POLICY "drivers_select_own" ON drivers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "drivers_select_admin" ON drivers FOR SELECT USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "drivers_insert" ON drivers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
  OR NOT EXISTS (SELECT 1 FROM drivers) -- Allow first driver
);
CREATE POLICY "drivers_update" ON drivers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- Minders: All can read, admins can write
CREATE POLICY "minders_select" ON minders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "minders_insert" ON minders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "minders_update" ON minders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "minders_delete" ON minders FOR DELETE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- Areas: All can read, admins can write
CREATE POLICY "areas_select" ON areas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "areas_insert" ON areas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "areas_update" ON areas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "areas_delete" ON areas FOR DELETE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- Learners: All can read, drivers can write on their route, admins can write all
CREATE POLICY "learners_select" ON learners FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "learners_insert" ON learners FOR INSERT WITH CHECK (
  route_id = (SELECT route_id FROM drivers WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "learners_update" ON learners FOR UPDATE USING (
  route_id = (SELECT route_id FROM drivers WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- Vehicles: All can read, admins can write
CREATE POLICY "vehicles_select" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- School Settings: All can read, admins can write
CREATE POLICY "school_settings_select" ON school_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "school_settings_insert" ON school_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "school_settings_update" ON school_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- School Config: All can read, admins can write
CREATE POLICY "school_config_select" ON school_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "school_config_insert" ON school_config FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "school_config_update" ON school_config FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "school_config_delete" ON school_config FOR DELETE USING (
  EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND role = 'admin')
);

-- Audit Logs: Read based on role
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER minders_updated_at BEFORE UPDATE ON minders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER learners_updated_at BEFORE UPDATE ON learners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER school_settings_updated_at BEFORE UPDATE ON school_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Step 5: Restore Your Backup Data

After creating the tables, run this SQL to restore your backup data:

```sql
-- ============================================
-- RESTORE BACKUP DATA (from 2026-01-19)
-- ============================================

-- 1. INSERT ROUTES
INSERT INTO routes (id, name, vehicle_no, areas, term, year, status) VALUES
  ('fead92d5-114d-4926-984e-641984789e5c', 'Route B', 'KCT 607M', ARRAY['KARUGURU INTERIOR', 'MSAFIRI', '5TH AVENUE', 'OMNI', 'WANARUONA & MASHINANI'], 'Term 1', 2026, 'active'),
  ('00335cdf-da2f-41cd-9c99-133b49927bad', 'Route C', 'KCL 784C', ARRAY['VISION PARK', 'DESTINY', 'MITIKENDA', 'KARUGURU INTERIOR', 'BOOSTER'], 'Term 1', 2026, 'active'),
  ('8aee501d-a7ee-456a-ae01-2701711ce667', 'Route A', 'KDK 070J', ARRAY['OJ', 'MEMBLY', 'KIHUNGURO', 'THE VILLAGE', 'RAINBOW', 'KWA CHIEF', 'BAMBOO', 'DANJOSE', 'VARSITY', 'GREENSPOT', 'NAIVAS', '3 RINGS', 'DESTINY', 'MITIKENDA'], 'Term 1', 2026, 'active'),
  ('d4c84a01-a635-4cb6-8675-f8550f12d737', 'Route D', 'KCS 614J', ARRAY['UNIVERSITY', 'RAINBOW', 'KWA CHIEF', 'BAMBOO STREET', 'KARUGURU', '2ND AVENUE', '3RD AVENUE', 'MSAFIRI', 'DISCIPLES GARDEN', '5TH AVENUE', 'MASHINANI'], 'Term 1', 2026, 'active'),
  ('752838f8-c435-461a-80b0-ddefcabbb9df', 'Route E', 'KCB 298A', ARRAY['GIKUMARI', 'KIRATINA', 'KIBENDERA', 'SEWAGE', 'TIVERTON', 'MOSQUE AREA'], 'Term 1', 2026, 'active'),
  ('bb8bcd3b-91f7-44e8-8fda-d647c4271a1f', 'Route F', 'KCN 390F', ARRAY['KIRATINA', 'KWA KAMANGU', 'GREEN VALLEY & SILICON VALLEY'], 'Term 1', 2026, 'active'),
  ('ffb4b2c8-cd7f-412a-b5d2-c105e9da5109', 'Route G', 'KCJ 907U', ARRAY['NDURURUMO', 'KARIA', 'KWA TOM'], 'Term 1', 2026, 'active'),
  ('dde8c7b8-746a-4ea1-b30b-32493cc6799b', 'Route I', 'KCX 091E', ARRAY['HOSPITAL RD', 'NEEMA OASIS', 'GACHAGI', 'PALM GARDEN'], 'Term 1', 2026, 'active'),
  ('6354ab89-bb20-45eb-8a17-31e6370f4817', 'Route J', 'KCM 160W', ARRAY['MURERA', 'JABEZU', 'NGOMA TUPU', 'KWA TOM'], 'Term 1', 2026, 'active'),
  ('e8d531ad-44fe-4ff5-bc43-b9df0df30b99', 'ROUTE K', 'KCH 940L', ARRAY['KARUGURU.5TH AVENUE', 'MSAFIRI', 'GREEN VALLEY', 'SILICON VALLEY'], 'Term 1', 2026, 'active'),
  ('4c79c1ae-4a52-42a2-8f5b-f281423c9c93', 'Route H', 'KCM 159W', ARRAY['HOSPITAL ROAD', 'MUTONYA', 'NEEMA OASIS', 'LANDMARK', 'WISDOM TOWERS'], 'Term 1', 2026, 'active');

-- 2. INSERT VEHICLES
INSERT INTO vehicles (id, reg_number, make, model, capacity, status, photo_url) VALUES
  ('a9435104-4886-45c9-bd1b-8bb027c09302', 'KCL 784C', 'nissan', 'coaster', 30, 'active', 'https://unofiwsocigosisdciwl.supabase.co/storage/v1/object/public/vehicle-images/vehicle_mkjth7u7vgkly783c5b_1768745626351.png');

-- 3. INSERT SCHOOL SETTINGS
INSERT INTO school_settings (id, school_name, contact_phone, contact_email, address, school_logo) VALUES
  ('f4d417ec-dfc2-4868-9492-df968f89c057', 'Lelani School', '+254 705 190061', 'lelanischool254@gmail.com', 'Ruiru, Kiambu, Kenya', 'https://unofiwsocigosisdciwl.supabase.co/storage/v1/object/public/school-assets/logo_1768743459408.png');

-- 4. INSERT SCHOOL CONFIG (grades and streams)
INSERT INTO school_config (type, name, grade) VALUES
  ('grade', 'Play Group', NULL),
  ('grade', 'PP1', NULL),
  ('grade', 'PP2', NULL),
  ('grade', 'Grade 1', NULL),
  ('grade', 'Grade 2', NULL),
  ('grade', 'Grade 3', NULL),
  ('grade', 'Grade 4', NULL),
  ('grade', 'Grade 5', NULL),
  ('grade', 'Grade 6', NULL),
  ('grade', 'Grade 7', NULL),
  ('grade', 'Grade 8', NULL),
  ('grade', 'Grade 9', NULL),
  ('stream', 'ORCHID', 'Grade 4'),
  ('stream', 'TULIP', 'Grade 4'),
  ('stream', 'ORCHID', 'Grade 5'),
  ('stream', 'TULIP', 'Grade 5');

-- 5. INSERT LEARNERS (sample)
INSERT INTO learners (id, name, grade, guardian_phone, area, route_id, trip_type, status) VALUES
  ('b0bf4d61-4e3a-4e85-b340-ede696e68f3c', 'kevin ken', 'Grade 4 TULIP', '0700877236', 'RAINBOW', '00335cdf-da2f-41cd-9c99-133b49927bad', 'both', 'active');
```

### Step 6: Create Your Admin Account

Since user_id references auth.users, you need to:

1. **Register through the app** - Go to `/register` in your Next.js app
2. **Or create via Supabase Dashboard:**
   - Go to **Authentication → Users → Add User**
   - Email: `kevinmugo359@gmail.com`
   - Password: Set a new password
   - Copy the User ID

3. **Then insert the driver record:**
```sql
-- Replace 'YOUR_USER_ID' with the actual UUID from auth.users
INSERT INTO drivers (user_id, name, email, phone, role, status) VALUES
  ('YOUR_USER_ID', 'Kevin Mugo', 'kevinmugo359@gmail.com', '+254700000000', 'admin', 'active');
```

### Step 7: Run Your App

```bash
cd lelani-next
npm install
npm run dev
```

Open http://localhost:3000 and login with your admin credentials!

---

## Summary Checklist

- [ ] Created Supabase project
- [ ] Copied API URL and anon key to `.env.local`
- [ ] Enabled Email authentication
- [ ] Ran the complete schema SQL
- [ ] Ran the backup restore SQL
- [ ] Created admin user via Authentication
- [ ] Inserted admin driver record
- [ ] Started the app with `npm run dev`
