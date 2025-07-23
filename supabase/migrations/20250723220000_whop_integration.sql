/*
  # Whop Integration Enhancement

  1. New Tables
    - `whop_webhooks` - Store incoming webhook data
    - `whop_sync_logs` - Track sync operations
    - `whop_subscribers` - Store subscriber data

  2. New Functions
    - `sync_user_subscription` - Sync user subscription status
    - `process_whop_webhook` - Process webhook events

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
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

-- Function to sync user subscription
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
BEGIN
  -- Determine subscription status
  v_subscription_active := p_subscription_status IN ('active', 'trialing');
  
  -- Find or create user
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = p_email OR whop_user_id = p_whop_user_id
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    -- Create new user
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
      now()
    ) RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user
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
  
  -- Update or create subscriber record
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
    now()
  )
  ON CONFLICT (whop_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    user_id = EXCLUDED.user_id,
    subscription_status = EXCLUDED.subscription_status,
    plan_id = EXCLUDED.plan_id,
    subscription_start_date = EXCLUDED.subscription_start_date,
    subscription_end_date = EXCLUDED.subscription_end_date,
    payment_status = EXCLUDED.payment_status,
    updated_at = now();
    
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
      'user_id', v_user_id
    )
  );
END;
$$;

-- Function to process webhook events
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
BEGIN
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
        'message', 'Unhandled webhook type: ' || v_webhook_type
      );
      RETURN v_result;
  END CASE;
  
  v_result := jsonb_build_object(
    'status', 'success',
    'message', 'Webhook processed successfully',
    'webhook_type', v_webhook_type,
    'user_id', v_user_id
  );
  
  RETURN v_result;
END;
$$; 