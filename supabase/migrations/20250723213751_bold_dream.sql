/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `full_name` (text, optional)
      - `whop_user_id` (text, optional)
      - `subscription_active` (boolean, default false)
      - `subscription_expires_at` (timestamptz, optional)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to read their own data
    - Add policies for admins to manage all users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  whop_user_id text,
  subscription_active boolean DEFAULT false,
  subscription_expires_at timestamptz,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for admins to read all data
CREATE POLICY "Admins can read all data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy for admins to manage all users
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy for inserting new users (for registration)
CREATE POLICY "Allow user creation"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_whop_user_id_idx ON users(whop_user_id);
CREATE INDEX IF NOT EXISTS users_subscription_active_idx ON users(subscription_active);
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON users(is_admin);