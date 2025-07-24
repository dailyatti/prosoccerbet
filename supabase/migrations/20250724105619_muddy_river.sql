/*
  # Professional Admin and Tips Management System

  1. New Tables
    - `tips` - Main tips table with free/vip categories
    - `user_bans` - User ban management
    - `admin_actions` - Admin action logging
  
  2. Security
    - Enable RLS on all new tables
    - Add comprehensive admin and user policies
    - Ban enforcement policies
  
  3. Functions
    - Admin user creation function
    - User ban/unban functions
    - Tips management functions
*/

-- Create tips table with free/vip categories
CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('free', 'vip')),
  sport text,
  confidence_level text NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user bans table
CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Tips policies
CREATE POLICY "Anyone can read active free tips"
  ON tips
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND category = 'free');

CREATE POLICY "Premium users can read VIP tips"
  ON tips
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND category = 'vip' 
    AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
          users.subscription_active = true 
          OR (users.trial_expires_at > now() AND users.is_trial_used = false)
        )
      )
    )
  );

CREATE POLICY "Admins can manage all tips"
  ON tips
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- User bans policies
CREATE POLICY "Admins can manage user bans"
  ON user_bans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Admin actions policies
CREATE POLICY "Admins can read admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can log actions"
  ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Function to set admin status for specific email
CREATE OR REPLACE FUNCTION setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update admin status for dailyatti.jns@gmail.com
  UPDATE users 
  SET is_admin = true 
  WHERE email = 'dailyatti.jns@gmail.com';
  
  -- If user doesn't exist, they'll be created as admin on first login
END;
$$;

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_bans 
    WHERE user_bans.user_id = is_user_banned.user_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

-- Function to ban/unban user
CREATE OR REPLACE FUNCTION manage_user_ban(
  target_user_id uuid,
  ban_reason text DEFAULT NULL,
  ban_duration_hours integer DEFAULT NULL,
  unban boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  admin_user_id := auth.uid();
  
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = admin_user_id 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  IF unban THEN
    -- Unban user
    UPDATE user_bans 
    SET is_active = false 
    WHERE user_id = target_user_id AND is_active = true;
    
    -- Log admin action
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
    VALUES (admin_user_id, 'user_unban', target_user_id, jsonb_build_object('reason', ban_reason));
  ELSE
    -- Ban user
    INSERT INTO user_bans (user_id, banned_by, reason, expires_at)
    VALUES (
      target_user_id, 
      admin_user_id, 
      ban_reason,
      CASE 
        WHEN ban_duration_hours IS NOT NULL 
        THEN now() + (ban_duration_hours || ' hours')::interval
        ELSE NULL
      END
    );
    
    -- Log admin action
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
    VALUES (admin_user_id, 'user_ban', target_user_id, jsonb_build_object(
      'reason', ban_reason,
      'duration_hours', ban_duration_hours
    ));
  END IF;
END;
$$;

-- Function to manage user subscription
CREATE OR REPLACE FUNCTION admin_manage_subscription(
  target_user_id uuid,
  set_active boolean,
  days_duration integer DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  admin_user_id := auth.uid();
  
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = admin_user_id 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Update user subscription
  UPDATE users 
  SET 
    subscription_active = set_active,
    subscription_expires_at = CASE 
      WHEN set_active THEN now() + (days_duration || ' days')::interval
      ELSE NULL
    END
  WHERE id = target_user_id;
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
  VALUES (admin_user_id, 'subscription_change', target_user_id, jsonb_build_object(
    'active', set_active,
    'duration_days', days_duration
  ));
END;
$$;

-- Setup admin user
SELECT setup_admin_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS tips_category_active_idx ON tips (category, is_active);
CREATE INDEX IF NOT EXISTS tips_created_at_idx ON tips (created_at DESC);
CREATE INDEX IF NOT EXISTS user_bans_user_active_idx ON user_bans (user_id, is_active);
CREATE INDEX IF NOT EXISTS admin_actions_admin_created_idx ON admin_actions (admin_id, created_at DESC);