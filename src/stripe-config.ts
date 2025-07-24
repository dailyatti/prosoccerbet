/**
 * Professional Stripe Product Configuration
 * Single product offering with comprehensive features
 */

export const STRIPE_PRODUCTS = {
  advanced_arbitrage_ai_prompts: {
    priceId: 'price_1RoLGYQsnQV19ezOEMevnnmt',
    name: 'Advanced Arbitrage Calculator + AI Prompt Collection',
    description: 'Unlock powerful tools for professional bettors. This package includes a precision-engineered arbitrage calculator to maximize your profits with low risk, and an exclusive collection of optimized AI prompts designed for sports betting analysis, value betting, and live decision support. Perfect for serious punters and data-driven strategists.',
    mode: 'subscription' as const,
    price: 99.00,
    currency: 'eur',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 0, // We handle trials locally
    features: [
      'Precision-engineered arbitrage calculator',
      'Low-risk profit maximization tools', 
      'Exclusive AI prompts for sports betting',
      'Value betting analysis prompts',
      'Live decision support prompts',
      'Professional betting strategies',
      'Data-driven analysis tools'
    ],
    benefits: [
      'Maximize profits with minimal risk',
      'Access professional-grade tools',
      'AI-powered betting insights',
      'Real-time arbitrage opportunities',
      'Expert-crafted prompt library',
      'Priority customer support',
      'Regular tool updates and improvements'
    ],
    target: 'Professional bettors and data-driven strategists',
    icon: '🎯'
  }
} as const;

export type StripeProduct = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];

// Product categories for organization
export const PRODUCT_CATEGORIES = {
  betting_tools: {
    name: 'Betting Tools',
    description: 'Professional sports betting and arbitrage tools',
    icon: '📊',
    products: ['advanced_arbitrage_ai_prompts']
  }
} as const;

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Limited access', 'Basic support'],
    limitations: ['No premium tools', 'No VIP content']
  },
  trial: {
    name: '3-Day Trial',
    price: 0,
    duration: '3 days',
    features: ['Full access to all tools', 'VIP tips', 'Priority support'],
    limitations: ['Limited time only']
  },
  premium: {
    name: 'VIP Premium',
    price: 99,
    currency: 'eur',
    interval: 'month',
    features: ['Unlimited access', 'All premium tools', 'VIP content', 'Priority support', 'Regular updates'],
    limitations: []
  }
} as const;

// Feature flags for different tiers
export const FEATURE_FLAGS = {
  ai_prompt_generator: ['trial', 'premium'],
  arbitrage_calculator: ['trial', 'premium'],
  vip_tips: ['trial', 'premium'],
  admin_panel: ['admin'],
  customer_portal: ['premium']
} as const;

// Helper functions
export function getProductById(productId: keyof typeof STRIPE_PRODUCTS): StripeProduct {
  return STRIPE_PRODUCTS[productId];
}

export function getAllProducts(): StripeProduct[] {
  return Object.values(STRIPE_PRODUCTS);
}

export function getProductsByCategory(category: keyof typeof PRODUCT_CATEGORIES): StripeProduct[] {
  const categoryData = PRODUCT_CATEGORIES[category];
  return categoryData.products.map(productId => 
    STRIPE_PRODUCTS[productId as keyof typeof STRIPE_PRODUCTS]
  );
}

export function hasFeatureAccess(feature: keyof typeof FEATURE_FLAGS, userTier: string): boolean {
  const allowedTiers = FEATURE_FLAGS[feature];
  return allowedTiers.includes(userTier as any);
}

export function getTrialInfo() {
  return {
    duration: 3,
    unit: 'days',
    fullAccess: true,
    description: 'Get full access to all professional tools for 3 days - no credit card required!'
  };
}