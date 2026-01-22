-- ============================================
-- FIX: OPEN RLS POLICIES FOR DRIVERS TABLE
-- Run this to restore admin access
-- ============================================

-- 1. Drop ALL existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON drivers;
DROP POLICY IF EXISTS "Users can view their own profile" ON drivers;
DROP POLICY IF EXISTS "Admins can manage all drivers" ON drivers;
DROP POLICY IF EXISTS "drivers_select_own" ON drivers;
DROP POLICY IF EXISTS "drivers_select_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_insert_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_update_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_delete_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_select_all" ON drivers;
DROP POLICY IF EXISTS "drivers_insert_all" ON drivers;
DROP POLICY IF EXISTS "drivers_update_all" ON drivers;
DROP POLICY IF EXISTS "drivers_delete_all" ON drivers;

-- 2. Create OPEN policies - all authenticated users can access everything
-- This matches the original behavior where any driver could see all data

-- SELECT: All authenticated users can see ALL drivers
CREATE POLICY "drivers_select_all" ON drivers
FOR SELECT
TO authenticated
USING (true);

-- INSERT: All authenticated users can insert
CREATE POLICY "drivers_insert_all" ON drivers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: All authenticated users can update
CREATE POLICY "drivers_update_all" ON drivers
FOR UPDATE
TO authenticated
USING (true);

-- DELETE: All authenticated users can delete
CREATE POLICY "drivers_delete_all" ON drivers
FOR DELETE
TO authenticated
USING (true);

-- 3. Verify the new policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'drivers';
