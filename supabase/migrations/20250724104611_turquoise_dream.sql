/*
  # Fix RLS Policies to Prevent Infinite Recursion

  1. Drop existing problematic policies on users table
  2. Create clean, non-recursive RLS policies
  3. Ensure policies work correctly without circular references

  Note: This migration fixes the "infinite recursion detected in policy" error
  by removing circular references in RLS policies.
*/

-- Drop all existing policies on users table to start clean
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Admins can read all data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create simple, non-recursive policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create admin policies using auth.jwt() to avoid recursion
CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read basic user info for admin functions
-- but avoid recursive policy checks by using simple auth.uid() checks
CREATE POLICY "Authenticated users can read user list for admin"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow if the requesting user has is_admin = true
    -- Use a simple subquery without recursion
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'is_admin' = 'true'
    )
    OR auth.uid() = id  -- Always allow reading own data
  );