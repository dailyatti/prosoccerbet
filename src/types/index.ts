export interface User {
  id: string;
  email: string;
  full_name?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_active: boolean;
  subscription_expires_at?: string;
  trial_expires_at?: string;
  is_trial_used?: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface VipTip {
  id: string;
  title: string;
  content: string;
  sport?: string;
  confidence_level: 'low' | 'medium' | 'high';
  created_at: string;
  created_by: string;
  is_active: boolean;
}

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeProduct {
  id: string;
  stripe_product_id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StripePrice {
  id: string;
  stripe_price_id: string;
  stripe_product_id: string;
  unit_amount: number;
  currency: string;
  recurring_interval?: string;
  recurring_interval_count?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StripeInvoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeWebhook {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  processed_at?: string;
  data: any;
  error_message?: string;
  created_at: string;
}

export interface PromptGeneration {
  id: string;
  user_id: string;
  original_text?: string;
  image_url?: string;
  generated_prompt: string;
  created_at: string;
}