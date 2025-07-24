/*
  # Fix users table RLS policies

  1. Security Updates
    - Update RLS policies for proper user access
    - Allow users to insert their own profile
    - Allow users to read their own profile
    - Allow users to update their own profile

  2. Changes
    - Drop existing conflicting policies
    - Create new comprehensive policies
    - Ensure proper authentication flow
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user list for admin" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
    OR auth.uid() = id
  );

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Service role can do everything (for webhooks, etc.)
CREATE POLICY "Service role has full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public sign up (create initial user record)
CREATE POLICY "Allow public signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);