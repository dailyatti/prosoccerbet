import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe with your publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51QktGpQsnQV19ezOheZXwgbVNx3KfIkS93RVVnqQymDym0oN9TYi9GXdfnz1RVIwUMpg0XBpGTIsYhq3SIFNj1g300d7WJKJxl';

export const stripePromise = loadStripe(stripePublishableKey);

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  currency: 'eur',
  country: 'DE',
};

// Create Checkout Session
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

    const { sessionId, url } = await response.json();
    
    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
      return;
    }
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create Customer Portal Session
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

// Get user's subscription status
export async function getUserSubscription() {
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
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

// Check if user has premium access via Stripe
export function hasStripeAccess(user: any): boolean {
  if (!user) return false;
  
  return user.subscription_active && 
         user.subscription_expires_at && 
         new Date(user.subscription_expires_at) > new Date();
}

// Get subscription status details
export function getStripeSubscriptionStatus(user: any) {
  if (!user) return { status: 'none', hasAccess: false };
  
  const hasActive = hasStripeAccess(user);
  const hasTrialTime = user.trial_expires_at && 
                      !user.is_trial_used && 
                      new Date(user.trial_expires_at) > new Date();
  
  if (hasActive) {
    return {
      status: 'active',
      hasAccess: true,
      type: 'subscription',
      expiresAt: user.subscription_expires_at
    };
  } else if (hasTrialTime) {
    return {
      status: 'trial',
      hasAccess: true,
      type: 'trial',
      expiresAt: user.trial_expires_at
    };
  } else {
    return {
      status: 'expired',
      hasAccess: false,
      type: 'none',
      expiresAt: null
    };
  }
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development';
}

// Get Stripe publishable key based on environment
export function getStripePublishableKey(): string {
  const devKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST;
  const prodKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  return isDevelopment() && devKey ? devKey : (prodKey || stripePublishableKey);
}