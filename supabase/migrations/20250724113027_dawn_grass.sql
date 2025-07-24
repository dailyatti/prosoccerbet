/*
  # Create missing database tables

  1. New Tables
    - `user_bans` - User ban management system
    - `tips` - Free and VIP betting tips system
    - `vip_tips` - VIP exclusive tips (renamed from existing structure)

  2. Features
    - Full ban management with expiry dates
    - Tip categorization (free/vip) 
    - Confidence levels and sports categorization
    - Admin management capabilities

  3. Security
    - Enable RLS on all new tables
    - Admin-only access to user_bans
    - Public read access to active free tips
    - Authenticated access to VIP tips
*/

-- Create user_bans table
CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  reason text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create tips table (both free and VIP)
CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('free', 'vip')),
  sport text,
  confidence_level text NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_bans_user_id_idx ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS user_bans_is_active_idx ON user_bans(is_active);
CREATE INDEX IF NOT EXISTS user_bans_expires_at_idx ON user_bans(expires_at);

CREATE INDEX IF NOT EXISTS tips_category_idx ON tips(category);
CREATE INDEX IF NOT EXISTS tips_is_active_idx ON tips(is_active);
CREATE INDEX IF NOT EXISTS tips_created_at_idx ON tips(created_at);
CREATE INDEX IF NOT EXISTS tips_confidence_level_idx ON tips(confidence_level);

-- Enable RLS
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- User bans policies (admin only)
CREATE POLICY "Admin can manage user bans"
  ON user_bans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Tips policies
CREATE POLICY "Anyone can read active free tips"
  ON tips
  FOR SELECT
  USING (is_active = true AND category = 'free');

CREATE POLICY "Authenticated users can read active VIP tips"
  ON tips
  FOR SELECT
  TO authenticated
  USING (is_active = true AND category = 'vip');

CREATE POLICY "Admins can manage all tips"
  ON tips
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can create tips"
  ON tips
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Admin functions for user management
CREATE OR REPLACE FUNCTION admin_manage_subscription(
  target_user_id uuid,
  set_active boolean,
  days_duration integer DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin rights required';
  END IF;

  -- Update user subscription
  UPDATE users 
  SET 
    subscription_active = set_active,
    subscription_expires_at = CASE 
      WHEN set_active THEN now() + (days_duration || ' days')::interval
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- User ban management function
CREATE OR REPLACE FUNCTION manage_user_ban(
  target_user_id uuid,
  ban_reason text DEFAULT 'Administrative action',
  ban_duration_hours integer DEFAULT NULL,
  unban boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin rights required';
  END IF;

  IF unban THEN
    -- Unban user - deactivate all active bans
    UPDATE user_bans 
    SET is_active = false
    WHERE user_id = target_user_id AND is_active = true;
  ELSE
    -- Ban user
    INSERT INTO user_bans (
      user_id, 
      reason, 
      expires_at, 
      created_by
    ) VALUES (
      target_user_id,
      ban_reason,
      CASE 
        WHEN ban_duration_hours IS NOT NULL 
        THEN now() + (ban_duration_hours || ' hours')::interval
        ELSE NULL
      END,
      auth.uid()
    );
  END IF;
END;
$$;