import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  currency: 'usd',
  country: 'US',
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
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
      return;
    }
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Get user's subscription status
export async function getUserSubscription() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// Get user's order history
export async function getUserOrders() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}