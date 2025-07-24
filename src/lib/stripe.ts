import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Get Stripe publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export const stripePromise = loadStripe(stripePublishableKey);

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  currency: 'eur',
  country: 'DE',
} as const;

/**
 * Create Stripe Checkout Session via Supabase Edge Function
 */
export async function createCheckoutSession(
  priceId: string, 
  mode: 'payment' | 'subscription' = 'subscription',
  successUrl?: string,
  cancelUrl?: string
) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        success_url: successUrl || `${window.location.origin}/#success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${window.location.origin}/#dashboard`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create Customer Portal Session via Supabase Edge Function
 */
export async function createPortalSession(returnUrl?: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        return_url: returnUrl || `${window.location.origin}/#profile`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    
    if (url) {
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

/**
 * Get user's subscription status via Supabase Edge Function
 */
export async function getUserSubscriptionStatus() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscription-status`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch subscription status: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Calculate savings for yearly plans
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): {
  monthlyCost: number;
  yearlyCost: number;
  savings: number;
  savingsPercentage: number;
} {
  const monthlyCost = monthlyPrice * 12;
  const savings = monthlyCost - yearlyPrice;
  const savingsPercentage = Math.round((savings / monthlyCost) * 100);
  
  return {
    monthlyCost,
    yearlyCost: yearlyPrice,
    savings,
    savingsPercentage
  };
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(user: any): boolean {
  if (!user) return false;
  
  // Check Stripe subscription
  if (user.subscription_active && user.subscription_expires_at) {
    return new Date(user.subscription_expires_at) > new Date();
  }
  
  return false;
}

/**
 * Check if user has trial access
 */
export function hasTrialAccess(user: any): boolean {
  if (!user) return false;
  
  return !user.is_trial_used && 
         user.trial_expires_at && 
         new Date(user.trial_expires_at) > new Date();
}

/**
 * Get user access level
 */
export function getUserAccessLevel(user: any): 'free' | 'trial' | 'premium' {
  if (!user) return 'free';
  
  if (hasActiveSubscription(user)) return 'premium';
  if (hasTrialAccess(user)) return 'trial';
  return 'free';
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || window.location.hostname === 'localhost';
}

/**
 * Get appropriate Stripe key based on environment
 */
export function getStripeKey(): string {
  const testKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST;
  const liveKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  return isDevelopment() && testKey ? testKey : (liveKey || stripePublishableKey);
}

/**
 * Validate Stripe configuration
 */
export function validateStripeConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!stripePublishableKey) {
    errors.push('Missing Stripe publishable key');
  }
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('Missing Supabase URL');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('Missing Supabase anon key');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}