/*
  # Whop Integration Enhancement with Professional Date Handling

  1. New Tables
    - `whop_webhooks` - Store incoming webhook data
    - `whop_sync_logs` - Track sync operations
    - `whop_subscribers` - Store subscriber data

  2. New Functions
    - `sync_user_subscription` - Sync user subscription status with proper timezone handling
    - `process_whop_webhook` - Process webhook events
    - `get_user_subscription_status` - Get detailed subscription status
    - `check_subscription_access` - Check if user has access

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies

  4. Date Handling
    - Proper timezone conversion
    - ISO 8601 date format support
    - UTC storage with local timezone display
*/

-- Create whop_webhooks table
CREATE TABLE IF NOT EXISTS whop_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type text NOT NULL,
  webhook_data jsonb NOT NULL,
  whop_user_id text,
  signature text,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create whop_sync_logs table
CREATE TABLE IF NOT EXISTS whop_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  status text NOT NULL,
  users_processed integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  details jsonb,
  admin_user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create whop_subscribers table
CREATE TABLE IF NOT EXISTS whop_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id text UNIQUE,
  email text,
  user_id uuid REFERENCES users(id),
  subscription_status text NOT NULL,
  plan_id text,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  last_payment_date timestamptz,
  next_billing_date timestamptz,
  payment_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE whop_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whop_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whop_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for whop_webhooks (admin only)
CREATE POLICY "Admins can manage webhooks"
  ON whop_webhooks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for whop_sync_logs (admin only)
CREATE POLICY "Admins can manage sync logs"
  ON whop_sync_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for whop_subscribers
CREATE POLICY "Users can read own subscriber data"
  ON whop_subscribers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscribers"
  ON whop_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS whop_webhooks_type_idx ON whop_webhooks(webhook_type);
CREATE INDEX IF NOT EXISTS whop_webhooks_user_id_idx ON whop_webhooks(whop_user_id);
CREATE INDEX IF NOT EXISTS whop_webhooks_processed_idx ON whop_webhooks(processed);
CREATE INDEX IF NOT EXISTS whop_subscribers_user_id_idx ON whop_subscribers(whop_user_id);
CREATE INDEX IF NOT EXISTS whop_subscribers_status_idx ON whop_subscribers(subscription_status);

-- Function to get current UTC time
CREATE OR REPLACE FUNCTION get_utc_now()
RETURNS timestamptz
LANGUAGE sql
AS $$
  SELECT now() AT TIME ZONE 'UTC';
$$;

-- Function to convert timestamp to user timezone
CREATE OR REPLACE FUNCTION format_date_for_user(
  date_value timestamptz,
  timezone text DEFAULT 'UTC'
)
RETURNS text
LANGUAGE sql
AS $$
  SELECT to_char(date_value AT TIME ZONE timezone, 'YYYY-MM-DD HH24:MI:SS TZ');
$$;

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(
  subscription_active boolean,
  subscription_expires_at timestamptz
)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT subscription_active AND (subscription_expires_at IS NULL OR subscription_expires_at > get_utc_now());
$$;

-- Function to check if trial is active
CREATE OR REPLACE FUNCTION is_trial_active(
  is_trial_used boolean,
  trial_expires_at timestamptz
)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT NOT is_trial_used AND trial_expires_at IS NOT NULL AND trial_expires_at > get_utc_now();
$$;

-- Function to get detailed subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF user_record IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'has_access', false,
      'type', 'inactive'
    );
  END IF;
  
  -- Check trial status first
  IF is_trial_active(user_record.is_trial_used, user_record.trial_expires_at) THEN
    result := jsonb_build_object(
      'status', 'trial',
      'has_access', true,
      'type', 'trial',
      'expires_at', user_record.trial_expires_at,
      'days_left', EXTRACT(DAY FROM (user_record.trial_expires_at - get_utc_now())),
      'formatted_expiry', format_date_for_user(user_record.trial_expires_at)
    );
  -- Check subscription status
  ELSIF is_subscription_active(user_record.subscription_active, user_record.subscription_expires_at) THEN
    result := jsonb_build_object(
      'status', 'active',
      'has_access', true,
      'type', 'subscription',
      'expires_at', user_record.subscription_expires_at,
      'days_left', EXTRACT(DAY FROM (user_record.subscription_expires_at - get_utc_now())),
      'formatted_expiry', format_date_for_user(user_record.subscription_expires_at)
    );
  ELSE
    result := jsonb_build_object(
      'status', 'expired',
      'has_access', false,
      'type', 'inactive',
      'expires_at', COALESCE(user_record.subscription_expires_at, user_record.trial_expires_at),
      'days_left', 0,
      'formatted_expiry', format_date_for_user(COALESCE(user_record.subscription_expires_at, user_record.trial_expires_at))
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION check_subscription_access(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (get_user_subscription_status(user_id)->>'has_access')::boolean;
$$;

-- Function to sync user subscription with professional date handling
CREATE OR REPLACE FUNCTION sync_user_subscription(
  p_whop_user_id text,
  p_email text,
  p_subscription_status text,
  p_plan_id text DEFAULT null,
  p_start_date timestamptz DEFAULT null,
  p_end_date timestamptz DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_subscription_active boolean;
  v_trial_expires_at timestamptz;
  v_current_time timestamptz;
BEGIN
  -- Get current UTC time
  v_current_time := get_utc_now();
  
  -- Determine subscription status
  v_subscription_active := p_subscription_status IN ('active', 'trialing');
  
  -- Find or create user
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = p_email OR whop_user_id = p_whop_user_id
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    -- Create new user with proper timezone handling
    INSERT INTO users (
      email, 
      whop_user_id, 
      subscription_active, 
      subscription_expires_at,
      trial_expires_at,
      is_trial_used,
      created_at
    ) VALUES (
      p_email,
      p_whop_user_id,
      v_subscription_active,
      p_end_date,
      CASE 
        WHEN p_subscription_status = 'trialing' THEN p_end_date
        ELSE null
      END,
      p_subscription_status != 'trialing',
      v_current_time
    ) RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user with proper timezone handling
    UPDATE users SET
      whop_user_id = COALESCE(p_whop_user_id, whop_user_id),
      subscription_active = v_subscription_active,
      subscription_expires_at = p_end_date,
      trial_expires_at = CASE 
        WHEN p_subscription_status = 'trialing' THEN p_end_date
        ELSE trial_expires_at
      END,
      is_trial_used = p_subscription_status != 'trialing'
    WHERE id = v_user_id;
  END IF;
  
  -- Update or create subscriber record with proper timezone handling
  INSERT INTO whop_subscribers (
    whop_user_id,
    email,
    user_id,
    subscription_status,
    plan_id,
    subscription_start_date,
    subscription_end_date,
    payment_status,
    updated_at
  ) VALUES (
    p_whop_user_id,
    p_email,
    v_user_id,
    p_subscription_status,
    p_plan_id,
    p_start_date,
    p_end_date,
    CASE 
      WHEN p_subscription_status IN ('active', 'trialing') THEN 'paid'
      ELSE 'unpaid'
    END,
    v_current_time
  )
  ON CONFLICT (whop_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    user_id = EXCLUDED.user_id,
    subscription_status = EXCLUDED.subscription_status,
    plan_id = EXCLUDED.plan_id,
    subscription_start_date = EXCLUDED.subscription_start_date,
    subscription_end_date = EXCLUDED.subscription_end_date,
    payment_status = EXCLUDED.payment_status,
    updated_at = v_current_time;
    
  -- Log the sync operation
  INSERT INTO whop_sync_logs (
    sync_type,
    status,
    users_processed,
    details
  ) VALUES (
    'subscription_sync',
    'success',
    1,
    jsonb_build_object(
      'whop_user_id', p_whop_user_id,
      'email', p_email,
      'subscription_status', p_subscription_status,
      'user_id', v_user_id,
      'sync_time', v_current_time
    )
  );
END;
$$;

-- Function to process webhook events with professional date handling
CREATE OR REPLACE FUNCTION process_whop_webhook(
  p_webhook_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_type text;
  v_user_id text;
  v_email text;
  v_status text;
  v_result jsonb;
  v_current_time timestamptz;
BEGIN
  v_current_time := get_utc_now();
  v_webhook_type := p_webhook_data->>'type';
  v_user_id := p_webhook_data->'data'->'user'->>'id';
  v_email := p_webhook_data->'data'->'user'->>'email';
  v_status := p_webhook_data->'data'->>'status';
  
  -- Process based on webhook type
  CASE v_webhook_type
    WHEN 'payment.completed', 'subscription.created', 'subscription.updated' THEN
      PERFORM sync_user_subscription(
        v_user_id,
        v_email,
        v_status,
        p_webhook_data->'data'->'product'->>'id',
        CASE 
          WHEN p_webhook_data->'data'->>'current_period_start' IS NOT NULL 
          THEN to_timestamp((p_webhook_data->'data'->>'current_period_start')::bigint)
          ELSE null
        END,
        CASE 
          WHEN p_webhook_data->'data'->>'current_period_end' IS NOT NULL 
          THEN to_timestamp((p_webhook_data->'data'->>'current_period_end')::bigint)
          ELSE null
        END
      );
      
    WHEN 'subscription.cancelled', 'subscription.expired' THEN
      PERFORM sync_user_subscription(
        v_user_id,
        v_email,
        'cancelled'
      );
      
    ELSE
      -- Unhandled webhook type
      v_result := jsonb_build_object(
        'status', 'ignored',
        'message', 'Unhandled webhook type: ' || v_webhook_type,
        'processed_at', v_current_time
      );
      RETURN v_result;
  END CASE;
  
  v_result := jsonb_build_object(
    'status', 'success',
    'message', 'Webhook processed successfully',
    'webhook_type', v_webhook_type,
    'user_id', v_user_id,
    'processed_at', v_current_time
  );
  
  RETURN v_result;
END;
$$;

-- Create a view for easy subscription status queries
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.whop_user_id,
  u.subscription_active,
  u.subscription_expires_at,
  u.trial_expires_at,
  u.is_trial_used,
  u.is_admin,
  u.created_at,
  get_user_subscription_status(u.id) as subscription_status,
  check_subscription_access(u.id) as has_access
FROM users u;

-- Add comments for documentation
COMMENT ON FUNCTION get_utc_now() IS 'Returns current UTC time for consistent timezone handling';
COMMENT ON FUNCTION format_date_for_user(timestamptz, text) IS 'Formats date for user display with timezone conversion';
COMMENT ON FUNCTION is_subscription_active(boolean, timestamptz) IS 'Checks if subscription is active based on status and expiry';
COMMENT ON FUNCTION is_trial_active(boolean, timestamptz) IS 'Checks if trial is active based on usage and expiry';
COMMENT ON FUNCTION get_user_subscription_status(uuid) IS 'Returns detailed subscription status with timezone-aware formatting';
COMMENT ON FUNCTION check_subscription_access(uuid) IS 'Quick check if user has premium access';
COMMENT ON FUNCTION sync_user_subscription(text, text, text, text, timestamptz, timestamptz) IS 'Syncs user subscription with Whop data using UTC timestamps';
COMMENT ON FUNCTION process_whop_webhook(jsonb) IS 'Processes Whop webhook events with professional date handling'; 