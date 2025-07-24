/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Infinite recursion detected in policy for relation "users"
    - Code 42017: PostgreSQL recursive policy error
    - Policies are referencing each other in a circular manner

  2. Solution
    - Drop ALL existing policies on users table
    - Create simple, non-recursive policies
    - Use auth.uid() directly without additional user lookups
    - Avoid policy dependencies that cause recursion

  3. New Policies
    - Simple SELECT policy for own data
    - Simple INSERT policy for new users
    - Simple UPDATE policy for own data
    - Service role full access (non-recursive)
*/

-- Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_public_signup" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_service_role_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "Users can view their own customer data" ON users;
DROP POLICY IF EXISTS "Enable read access for own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for own data" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive policies
CREATE POLICY "users_select_simple"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_simple"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_simple"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public signup policy (for registration)
CREATE POLICY "users_public_insert"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Service role full access (for admin operations)
CREATE POLICY "users_service_role_access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);