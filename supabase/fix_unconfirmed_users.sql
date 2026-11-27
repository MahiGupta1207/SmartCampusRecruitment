-- =====================================================================
-- CAMPUSHIRE – FIX EXISTING UNCONFIRMED AUTH USERS
-- =====================================================================
-- Run this in Supabase SQL Editor (uses auth schema, needs elevated role)
--
-- BACKGROUND
-- ----------
-- If "Confirm email" was enabled in Supabase when users registered,
-- their auth.users rows have email_confirmed_at = NULL.
-- Supabase will reject their sign-in attempts with "Email not confirmed".
-- This script bulk-confirms all existing unconfirmed users.
--
-- SAFE TO RUN: only updates NULL email_confirmed_at fields.
-- Does not delete or modify any user data.
-- Idempotent: running it multiple times has no additional effect.
-- =====================================================================

-- Step 1 · Preview: see which accounts are currently unconfirmed
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Step 2 · Confirm all unconfirmed users
-- (Uncomment and run after reviewing Step 1)
/*
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at         = NOW()
WHERE email_confirmed_at IS NULL;
*/

-- Step 3 · Verify no unconfirmed accounts remain
-- SELECT COUNT(*) AS still_unconfirmed
-- FROM auth.users
-- WHERE email_confirmed_at IS NULL;

-- =====================================================================
-- HOW TO PREVENT THIS FROM HAPPENING AGAIN
-- =====================================================================
-- 1. Go to Supabase Dashboard → Authentication → Providers → Email
-- 2. Toggle OFF "Confirm email"
-- 3. Click Save
-- After this, newly registered users can sign in immediately.
-- =====================================================================
