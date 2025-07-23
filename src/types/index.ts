export interface User {
  id: string;
  email: string;
  full_name?: string;
  whop_user_id?: string;
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

export interface ArbitrageOpportunity {
  id: string;
  sport: string;
  event_name: string;
  bookmaker1: string;
  bookmaker2: string;
  odds1: number;
  odds2: number;
  profit_percentage: number;
  created_at: string;
}

export interface WhopSubscriber {
  id: string;
  whop_user_id?: string;
  email?: string;
  user_id?: string;
  subscription_status: string;
  plan_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  last_payment_date?: string;
  next_billing_date?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface WhopWebhook {
  id: string;
  webhook_type: string;
  webhook_data: any;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  whop_user_id?: string;
  created_at: string;
}

export interface WhopSyncLog {
  id: string;
  sync_type: string;
  status: string;
  users_processed: number;
  errors_count: number;
  details: any;
  admin_user_id?: string;
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