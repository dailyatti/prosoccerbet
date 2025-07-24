/*
  # Add missing trial column to users table

  1. Changes
    - Add `is_trial_used` column to users table
    - Add `trial_expires_at` column to users table 
    - Set default values for existing users
    - Add indexes for performance

  2. Security
    - Maintain existing RLS policies
    - No changes to existing security rules
*/

-- Add missing columns to users table
DO $$
BEGIN
  -- Add is_trial_used column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_trial_used'
  ) THEN
    ALTER TABLE users ADD COLUMN is_trial_used boolean DEFAULT false;
  END IF;

  -- Add trial_expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'trial_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN trial_expires_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Set trial expiry for existing users who haven't used trial yet
UPDATE users 
SET 
  trial_expires_at = created_at + interval '3 days',
  is_trial_used = false
WHERE 
  trial_expires_at IS NULL 
  AND is_trial_used IS NULL 
  AND created_at > now() - interval '1 day';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS users_trial_expires_at_idx ON users (trial_expires_at);
CREATE INDEX IF NOT EXISTS users_is_trial_used_idx ON users (is_trial_used);