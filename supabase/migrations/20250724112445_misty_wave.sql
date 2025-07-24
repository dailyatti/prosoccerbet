/*
  # Fix users table RLS policies

  1. Security Changes
    - Drop existing restrictive policies
    - Add simple policy allowing authenticated users to read their own data
    - Add policy allowing users to insert their own profile
    - Add policy allowing users to update their own profile
  
  2. Notes
    - Ensures authenticated users can access their profile data
    - Fixes "permission denied for table users" error
    - Maintains security by restricting access to own data only
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Authenticated users can read user list for admin" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, clear policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to read all user data
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
  );