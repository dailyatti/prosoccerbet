/*
  # Fix users table RLS permissions

  1. Security Changes
    - Drop existing problematic RLS policies on users table
    - Create simplified, working RLS policies
    - Ensure authenticated users can read their own data
    - Ensure admins can manage all users
    - Allow public user signup

  2. Policy Structure
    - Simple user self-access policy using auth.uid()
    - Admin access policy for user management
    - Public signup policy for new user creation
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow public signup" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Create simple, working policies
CREATE POLICY "users_select_own" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_public_signup" 
  ON users 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "users_admin_all" 
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

CREATE POLICY "users_service_role_all" 
  ON users 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);