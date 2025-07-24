/*
  # Professional Stripe Integration Schema

  1. New Tables
    - `stripe_customers` - Links users to Stripe customers
    - `stripe_subscriptions` - Tracks subscription status and billing
    - `stripe_products` - Product catalog
    - `stripe_prices` - Price tiers and billing intervals
    - `stripe_invoices` - Invoice tracking
    - `stripe_webhooks` - Webhook event log

  2. Enhanced User Management
    - Add Stripe customer ID to users table
    - Trial and subscription tracking
    - Premium access control

  3. Security
    - Row Level Security on all tables
    - Proper access policies
    - Admin management capabilities

  4. Functions
    - Subscription access checking
    - User tier management
    - Webhook processing helpers
*/

-- Add Stripe customer ID to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_subscription_id text UNIQUE;
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
END $$;

-- Create Stripe customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_price_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe products table
CREATE TABLE IF NOT EXISTS stripe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
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
  active boolean DEFAULT true,
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
  currency text NOT NULL,
  status text NOT NULL,
  invoice_pdf text,
  hosted_invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe webhooks table
CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  data jsonb NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create VIP tips table
CREATE TABLE IF NOT EXISTS vip_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  sport text,
  confidence_level text NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_tips ENABLE ROW LEVEL SECURITY;

-- Users can read their own Stripe data
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

-- VIP tips policies
CREATE POLICY "Users can read active vip tips"
  ON vip_tips FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin policies
CREATE POLICY "Admins can manage all data"
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

CREATE POLICY "Admins can manage vip tips"
  ON vip_tips FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Functions for subscription management
CREATE OR REPLACE FUNCTION has_active_subscription(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM stripe_subscriptions 
    WHERE stripe_subscriptions.user_id = $1 
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

CREATE OR REPLACE FUNCTION has_trial_access(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = $1 
    AND is_trial_used = false 
    AND trial_expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION get_user_access_level(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN has_active_subscription($1) THEN 'premium'
    WHEN has_trial_access($1) THEN 'trial'
    ELSE 'free'
  END;
$$;

-- Function to sync user subscription from Stripe
CREATE OR REPLACE FUNCTION sync_stripe_subscription(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_start bigint,
  p_current_period_end bigint,
  p_cancel_at_period_end boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's Stripe IDs
  UPDATE users 
  SET 
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_active = (p_status = 'active'),
    subscription_expires_at = to_timestamp(p_current_period_end)
  WHERE id = p_user_id;

  -- Upsert customer record
  INSERT INTO stripe_customers (user_id, stripe_customer_id, email)
  VALUES (p_user_id, p_stripe_customer_id, (SELECT email FROM users WHERE id = p_user_id))
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
    cancel_at_period_end
  )
  VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    to_timestamp(p_current_period_start),
    to_timestamp(p_current_period_end),
    p_cancel_at_period_end
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_active ON users(subscription_active);

-- Insert your product data
INSERT INTO stripe_products (stripe_product_id, name, description) 
VALUES (
  'prod_advanced_arbitrage_ai', 
  'Advanced Arbitrage Calculator + AI Prompt Collection',
  'Unlock powerful tools for professional bettors. This package includes a precision-engineered arbitrage calculator to maximize your profits with low risk, and an exclusive collection of optimized AI prompts designed for sports betting analysis, value betting, and live decision support. Perfect for serious punters and data-driven strategists.'
) ON CONFLICT (stripe_product_id) DO NOTHING;

-- Insert pricing (you'll need to update this with your actual Stripe price ID)
INSERT INTO stripe_prices (stripe_price_id, stripe_product_id, unit_amount, currency, recurring_interval)
VALUES (
  'price_1RoLGYQsnQV19ezOEMevnnmt',
  'prod_advanced_arbitrage_ai',
  9900, -- €99.00 in cents
  'eur',
  'month'
) ON CONFLICT (stripe_price_id) DO NOTHING;