-- ============================================================================
-- Migration: 001_profiles.sql
-- Purpose: Create the profiles table to extend Supabase Auth users with
--          application-specific data like display names and preferences.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES TABLE
-- ----------------------------------------------------------------------------
-- This table extends the built-in auth.users table from Supabase Auth.
-- Instead of modifying auth.users directly (which we can't do), we create
-- a linked profiles table that stores additional user data.
--
-- The id column references auth.users(id), ensuring:
-- 1. Every profile belongs to a valid auth user
-- 2. When a user is deleted from auth, their profile is also deleted (CASCADE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key that matches the user's auth ID (UUID format)
  -- This creates a 1-to-1 relationship with auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User's chosen display name (optional, can be shown in UI instead of email)
  display_name TEXT,

  -- JSONB column for flexible user preferences storage
  -- Examples: { "theme": "dark", "notifications": true, "language": "en" }
  -- Using JSONB (binary JSON) for faster queries and indexing capabilities
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Timestamps for auditing when the profile was created and last modified
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- RLS is Supabase's way of securing data at the database level.
-- When enabled, users can only access rows that match the policy conditions.
-- This is more secure than application-level checks because it's enforced
-- even if someone bypasses the API and queries the database directly.
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT (read) their own profile
-- auth.uid() returns the currently authenticated user's ID from the JWT token
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can only INSERT a profile for themselves
-- WITH CHECK is used for INSERT/UPDATE to validate the new row data
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- AUTO-CREATE PROFILE TRIGGER
-- ----------------------------------------------------------------------------
-- This function runs automatically whenever a new user signs up.
-- It creates a corresponding profile row so the user doesn't have to
-- manually create one. This ensures every auth user has a profile.
--
-- SECURITY DEFINER means this function runs with the privileges of the
-- user who created it (superuser), bypassing RLS. This is necessary because
-- the trigger fires before the user has a valid session.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile with just the user ID
  -- Other fields (display_name, preferences) use their defaults
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Return NEW to allow the original INSERT to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the function to auth.users INSERT events
-- FOR EACH ROW means it fires once per inserted row
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ----------------------------------------------------------------------------
-- This function automatically updates the updated_at column whenever
-- a row is modified. This is useful for:
-- 1. Knowing when data was last changed
-- 2. Caching invalidation
-- 3. Sync conflict resolution
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the updated_at column to the current timestamp
  NEW.updated_at = NOW();

  -- Return the modified row
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to profiles table - fires BEFORE UPDATE so we can modify NEW
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
