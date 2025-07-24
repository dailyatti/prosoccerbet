import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  currency: 'usd',
  country: 'US',
};

// Product configurations - you can update these with your actual Price IDs
export const STRIPE_PRODUCTS = {
  vip_monthly: {
    priceId: 'price_1234567890', // Replace with your actual Price ID
    name: 'VIP Monthly Subscription',
    price: 99,
    currency: 'usd',
    interval: 'month',
    description: 'Full access to all professional tools',
    features: [
      'AI Prompt Generator unlimited',
      'Arbitrage Calculator full access',
      'VIP Tips exclusive content',
      'Priority support',
      'Mobile optimized experience'
    ]
  },
  vip_yearly: {
    priceId: 'price_0987654321', // Replace with your actual Price ID
    name: 'VIP Yearly Subscription',
    price: 990,
    currency: 'usd',
    interval: 'year',
    description: 'Annual subscription with 2 months free',
    features: [
      'AI Prompt Generator unlimited',
      'Arbitrage Calculator full access',
      'VIP Tips exclusive content',
      'Priority support',
      'Mobile optimized experience',
      '2 months free (save $198)'
    ]
  }
};

// Create Checkout Session
export async function createCheckoutSession(priceId: string, userEmail?: string) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userEmail,
        successUrl: `${window.location.origin}/#dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/#dashboard`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create Customer Portal Session
export async function createCustomerPortalSession(customerId: string) {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/#dashboard`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

// Check subscription status
export async function checkSubscriptionStatus(userId: string) {
  try {
    const response = await fetch(`/api/subscription-status?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check subscription status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}