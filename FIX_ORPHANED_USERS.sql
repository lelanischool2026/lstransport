-- ============================================
-- FIX: CREATE DRIVER RECORDS FOR ORPHANED AUTH USERS
-- ============================================

-- Step 1: Find auth users without driver records
SELECT 
  au.id as user_id,
  au.email,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'phone' as phone,
  au.created_at
FROM auth.users au
LEFT JOIN drivers d ON d.user_id = au.id
WHERE d.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Create driver records for orphaned users
-- Run this AFTER reviewing the results from Step 1
INSERT INTO drivers (user_id, name, email, phone, role, status)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'Unknown Driver'),
  au.email,
  COALESCE(au.raw_user_meta_data->>'phone', '+254700000000'),
  'driver',
  'active'
FROM auth.users au
LEFT JOIN drivers d ON d.user_id = au.id
WHERE d.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify all users now have driver records
SELECT 
  au.email,
  d.name,
  d.role,
  d.status
FROM auth.users au
LEFT JOIN drivers d ON d.user_id = au.id
ORDER BY au.created_at DESC;
