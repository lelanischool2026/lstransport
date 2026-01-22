-- Fix Drivers RLS Policy for Admin Access
-- Run this in Supabase SQL Editor

-- First, check existing policies
SELECT * FROM pg_policies WHERE tablename = 'drivers';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "drivers_select_own" ON drivers;
DROP POLICY IF EXISTS "drivers_select_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_insert_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_update_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_delete_policy" ON drivers;

-- Create new open policies for authenticated users
-- SELECT: All authenticated users can see all drivers
CREATE POLICY "drivers_select_all" ON drivers
FOR SELECT
TO authenticated
USING (true);

-- INSERT: All authenticated users can insert (admin creates new drivers)
CREATE POLICY "drivers_insert_all" ON drivers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: All authenticated users can update (admin updates driver details)
CREATE POLICY "drivers_update_all" ON drivers
FOR UPDATE
TO authenticated
USING (true);

-- DELETE: All authenticated users can delete (admin removes drivers)
CREATE POLICY "drivers_delete_all" ON drivers
FOR DELETE
TO authenticated
USING (true);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'drivers';
