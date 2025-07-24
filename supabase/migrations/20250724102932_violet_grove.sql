/*
  # Professional Stripe + Supabase Integration - Clean System

  1. System Cleanup
    - Remove all Whop-related tables and functions
    - Clean up old migration artifacts
    - Reset to clean Stripe-only system

  2. Professional Stripe Tables
    - `stripe_customers` - Customer management
    - `stripe_subscriptions` - Subscription tracking
    - `stripe_products` - Product catalog
    - `stripe_prices` - Pricing tiers
    - `stripe_invoices` - Invoice tracking
    - `stripe_webhooks` - Webhook event log

  3. Enhanced User Management
    - Professional trial system (3 days)
    - Stripe customer linking
    - Subscription status tracking
    - Access control system

  4. Security & Performance
    - Row Level Security on all tables
    - Optimized indexes
    - Professional functions
    - Webhook processing
*/

-- Clean up old Whop system if exists
DROP TABLE IF EXISTS whop_webhooks CASCADE;
DROP TABLE IF EXISTS whop_sync_logs CASCADE;
DROP TABLE IF EXISTS whop_subscribers CASCADE;

-- Remove Whop columns from users table if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'whop_user_id'
  ) THEN
    ALTER TABLE users DROP COLUMN whop_user_id;
  END IF;
END $$;

-- Ensure clean users table structure for Stripe
DO $$
BEGIN
  -- Add Stripe-specific columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'trial_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN trial_expires_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_trial_used'
  ) THEN
    ALTER TABLE users ADD COLUMN is_trial_used boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'free';
  END IF;
END $$;

-- Create professional Stripe customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  phone text,
  address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create professional Stripe subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_price_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  cancellation_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe products table
CREATE TABLE IF NOT EXISTS stripe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  images text[],
  metadata jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe prices table
CREATE TABLE IF NOT EXISTS stripe_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,
  stripe_product_id text NOT NULL,
  unit_amount bigint NOT NULL,
  currency text NOT NULL,
  recurring_interval text,
  recurring_interval_count integer DEFAULT 1,
  trial_period_days integer DEFAULT 0,
  active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe invoices table
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  amount_paid bigint NOT NULL,
  amount_due bigint NOT NULL,
  amount_remaining bigint DEFAULT 0,
  currency text NOT NULL,
  status text NOT NULL,
  invoice_pdf text,
  hosted_invoice_url text,
  number text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe webhooks table for monitoring
CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  data jsonb NOT NULL,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all Stripe tables
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;

-- User policies for Stripe data
CREATE POLICY "Users can read own stripe customers"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own stripe subscriptions"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own stripe invoices"
  ON stripe_invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Public read access for products and prices
CREATE POLICY "Anyone can read stripe products"
  ON stripe_products FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Anyone can read stripe prices"
  ON stripe_prices FOR SELECT
  TO authenticated
  USING (active = true);

-- Admin policies for all tables
CREATE POLICY "Admins can manage stripe customers"
  ON stripe_customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage stripe subscriptions"
  ON stripe_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage stripe webhooks"
  ON stripe_webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Professional subscription management functions
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
  stripe_sub stripe_subscriptions%ROWTYPE;
  result jsonb;
  current_time timestamptz := now();
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = p_user_id;
  
  IF user_record IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'has_access', false,
      'type', 'inactive'
    );
  END IF;
  
  -- Check active Stripe subscription first
  SELECT * INTO stripe_sub 
  FROM stripe_subscriptions 
  WHERE user_id = p_user_id 
  AND status IN ('active', 'trialing')
  AND (current_period_end IS NULL OR current_period_end > current_time)
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF stripe_sub IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'active',
      'has_access', true,
      'type', 'stripe_subscription',
      'subscription_id', stripe_sub.stripe_subscription_id,
      'expires_at', stripe_sub.current_period_end,
      'cancel_at_period_end', stripe_sub.cancel_at_period_end,
      'tier', 'premium'
    );
  END IF;
  
  -- Check trial status
  IF NOT COALESCE(user_record.is_trial_used, false) 
     AND user_record.trial_expires_at IS NOT NULL 
     AND user_record.trial_expires_at > current_time THEN
    RETURN jsonb_build_object(
      'status', 'trial',
      'has_access', true,
      'type', 'trial',
      'expires_at', user_record.trial_expires_at,
      'days_left', EXTRACT(DAY FROM (user_record.trial_expires_at - current_time)),
      'tier', 'trial'
    );
  END IF;
  
  -- Check legacy local subscription
  IF user_record.subscription_active 
     AND (user_record.subscription_expires_at IS NULL OR user_record.subscription_expires_at > current_time) THEN
    RETURN jsonb_build_object(
      'status', 'active',
      'has_access', true,
      'type', 'local_subscription',
      'expires_at', user_record.subscription_expires_at,
      'tier', 'premium'
    );
  END IF;
  
  -- No active subscription
  RETURN jsonb_build_object(
    'status', 'expired',
    'has_access', false,
    'type', 'inactive',
    'tier', 'free'
  );
END;
$$;

-- Function to sync Stripe subscription data
CREATE OR REPLACE FUNCTION sync_stripe_subscription(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean DEFAULT false,
  p_canceled_at timestamptz DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's Stripe references and subscription status
  UPDATE users 
  SET 
    stripe_customer_id = p_stripe_customer_id,
    subscription_active = (p_status IN ('active', 'trialing')),
    subscription_expires_at = CASE 
      WHEN p_status IN ('active', 'trialing') THEN p_current_period_end
      ELSE NULL
    END,
    subscription_tier = CASE 
      WHEN p_status IN ('active', 'trialing') THEN 'premium'
      ELSE 'free'
    END
  WHERE id = p_user_id;

  -- Upsert customer record
  INSERT INTO stripe_customers (user_id, stripe_customer_id, email, name)
  VALUES (
    p_user_id, 
    p_stripe_customer_id, 
    (SELECT email FROM users WHERE id = p_user_id),
    (SELECT full_name FROM users WHERE id = p_user_id)
  )
  ON CONFLICT (stripe_customer_id) DO UPDATE SET
    updated_at = now();

  -- Upsert subscription record
  INSERT INTO stripe_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    canceled_at
  )
  VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_canceled_at
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    canceled_at = EXCLUDED.canceled_at,
    updated_at = now();
END;
$$;

-- Function to initialize new user with trial
CREATE OR REPLACE FUNCTION initialize_user_trial(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET 
    trial_expires_at = now() + interval '3 days',
    is_trial_used = false,
    subscription_tier = 'trial'
  WHERE id = p_user_id 
  AND trial_expires_at IS NULL;
END;
$$;

-- Function to check premium access
CREATE OR REPLACE FUNCTION has_premium_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (get_user_subscription_status(p_user_id)->>'has_access')::boolean;
$$;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_trial_expires ON users(trial_expires_at) WHERE trial_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_active ON users(subscription_active) WHERE subscription_active = true;
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type ON stripe_webhooks(event_type);

-- Insert default product
INSERT INTO stripe_products (
  stripe_product_id, 
  name, 
  description,
  active
) VALUES (
  'prod_advanced_arbitrage_ai', 
  'Advanced Arbitrage Calculator + AI Prompt Collection',
  'Unlock powerful tools for professional bettors. This package includes a precision-engineered arbitrage calculator to maximize your profits with low risk, and an exclusive collection of optimized AI prompts designed for sports betting analysis, value betting, and live decision support. Perfect for serious punters and data-driven strategists.',
  true
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert default pricing
INSERT INTO stripe_prices (
  stripe_price_id, 
  stripe_product_id, 
  unit_amount, 
  currency, 
  recurring_interval,
  active
) VALUES (
  'price_1RoLGYQsnQV19ezOEMevnnmt',
  'prod_advanced_arbitrage_ai',
  9900, -- €99.00 in cents
  'eur',
  'month',
  true
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  unit_amount = EXCLUDED.unit_amount,
  updated_at = now();

-- Update existing users to have trial if they don't have subscription
UPDATE users 
SET 
  trial_expires_at = now() + interval '3 days',
  is_trial_used = false,
  subscription_tier = 'trial'
WHERE trial_expires_at IS NULL 
AND subscription_active = false;

-- Create secure view for user subscription data
CREATE OR REPLACE VIEW user_subscription_view 
WITH (security_invoker = true) AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.stripe_customer_id,
  u.subscription_active,
  u.subscription_expires_at,
  u.trial_expires_at,
  u.is_trial_used,
  u.subscription_tier,
  get_user_subscription_status(u.id) as status_info,
  has_premium_access(u.id) as has_access
FROM users u
WHERE u.id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_subscription_view TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_user_subscription_status(uuid) IS 'Get comprehensive subscription status for user with timezone handling';
COMMENT ON FUNCTION sync_stripe_subscription(uuid, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz) IS 'Sync user subscription data from Stripe webhooks';
COMMENT ON FUNCTION initialize_user_trial(uuid) IS 'Initialize 3-day trial for new users';
COMMENT ON FUNCTION has_premium_access(uuid) IS 'Quick check if user has premium access';