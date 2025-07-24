import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

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
      throw new Error('Failed to fetch subscription status');
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

// Check if user has premium access
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
  const hasTrail = user.trial_expires_at && 
                   !user.is_trial_used && 
                   new Date(user.trial_expires_at) > new Date();
  
  if (hasActive) {
    return {
      status: 'active',
      hasAccess: true,
      type: 'subscription',
      expiresAt: user.subscription_expires_at
    };
  } else if (hasTrail) {
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