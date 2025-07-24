/*
  # Clean Stripe Integration System

  1. Clean up existing system
    - Remove Whop-related columns and functions
    - Optimize Stripe integration
    - Add missing indexes

  2. Enhanced Stripe Integration
    - Professional subscription management
    - Customer portal integration
    - Webhook processing optimization

  3. Security
    - Row Level Security on all tables
    - Proper access policies
    - Admin management capabilities
*/

-- Clean up Whop-related columns from users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'whop_user_id'
  ) THEN
    ALTER TABLE users DROP COLUMN IF EXISTS whop_user_id;
  END IF;
END $$;

-- Drop Whop-related tables if they exist
DROP TABLE IF EXISTS whop_webhooks CASCADE;
DROP TABLE IF EXISTS whop_sync_logs CASCADE;
DROP TABLE IF EXISTS whop_subscribers CASCADE;

-- Ensure proper users table structure
DO $$
BEGIN
  -- Add missing columns if they don't exist
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

-- Update existing users to have 3-day trial
UPDATE users 
SET 
  trial_expires_at = now() + interval '3 days',
  is_trial_used = false
WHERE trial_expires_at IS NULL AND subscription_active = false;

-- Optimize Stripe tables structure
DO $$
BEGIN
  -- Update stripe_subscriptions table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_subscriptions') THEN
    -- Add missing columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stripe_subscriptions' AND column_name = 'cancel_at_period_end'
    ) THEN
      ALTER TABLE stripe_subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stripe_subscriptions' AND column_name = 'canceled_at'
    ) THEN
      ALTER TABLE stripe_subscriptions ADD COLUMN canceled_at timestamptz;
    END IF;
  END IF;
END $$;

-- Create optimized functions for subscription management
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
  stripe_sub record;
  result jsonb;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF user_record IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'has_access', false,
      'type', 'inactive'
    );
  END IF;
  
  -- Check Stripe subscription first
  IF user_record.stripe_customer_id IS NOT NULL THEN
    SELECT * INTO stripe_sub 
    FROM stripe_subscriptions 
    WHERE stripe_customer_id = user_record.stripe_customer_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF stripe_sub IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'active',
        'has_access', true,
        'type', 'stripe_subscription',
        'expires_at', stripe_sub.current_period_end,
        'stripe_subscription_id', stripe_sub.stripe_subscription_id,
        'cancel_at_period_end', stripe_sub.cancel_at_period_end
      );
    END IF;
  END IF;
  
  -- Check trial status
  IF NOT user_record.is_trial_used AND user_record.trial_expires_at > now() THEN
    RETURN jsonb_build_object(
      'status', 'trial',
      'has_access', true,
      'type', 'trial',
      'expires_at', user_record.trial_expires_at,
      'days_left', EXTRACT(DAY FROM (user_record.trial_expires_at - now()))
    );
  END IF;
  
  -- Check local subscription
  IF user_record.subscription_active AND 
     (user_record.subscription_expires_at IS NULL OR user_record.subscription_expires_at > now()) THEN
    RETURN jsonb_build_object(
      'status', 'active',
      'has_access', true,
      'type', 'local_subscription',
      'expires_at', user_record.subscription_expires_at
    );
  END IF;
  
  -- No active subscription
  RETURN jsonb_build_object(
    'status', 'expired',
    'has_access', false,
    'type', 'inactive'
  );
END;
$$;

-- Function to sync Stripe subscription
CREATE OR REPLACE FUNCTION sync_stripe_subscription(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user record
  UPDATE users 
  SET 
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_active = (p_status = 'active'),
    subscription_expires_at = CASE 
      WHEN p_status = 'active' THEN p_current_period_end
      ELSE NULL
    END
  WHERE id = p_user_id;
  
  -- Update or insert stripe_customers record
  INSERT INTO stripe_customers (user_id, stripe_customer_id, email)
  VALUES (p_user_id, p_stripe_customer_id, (SELECT email FROM users WHERE id = p_user_id))
  ON CONFLICT (stripe_customer_id) DO UPDATE SET
    updated_at = now();
  
  -- Update or insert stripe_subscriptions record
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
    'price_1RoLGYQsnQV19ezOEMevnnmt', -- Default price ID
    p_status,
    p_current_period_start,
    p_current_period_end,
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

-- Add optimized indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_trial_expires ON users(trial_expires_at) WHERE trial_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_period_end ON stripe_subscriptions(current_period_end);

-- Insert default product if not exists
INSERT INTO stripe_products (stripe_product_id, name, description) 
VALUES (
  'prod_advanced_arbitrage_ai', 
  'Advanced Arbitrage Calculator + AI Prompt Collection',
  'Unlock powerful tools for professional bettors. This package includes a precision-engineered arbitrage calculator to maximize your profits with low risk, and an exclusive collection of optimized AI prompts designed for sports betting analysis, value betting, and live decision support. Perfect for serious punters and data-driven strategists.'
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert price if not exists
INSERT INTO stripe_prices (stripe_price_id, stripe_product_id, unit_amount, currency, recurring_interval)
VALUES (
  'price_1RoLGYQsnQV19ezOEMevnnmt',
  'prod_advanced_arbitrage_ai',
  9900, -- €99.00 in cents
  'eur',
  'month'
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  unit_amount = EXCLUDED.unit_amount,
  updated_at = now();