export const STRIPE_PRODUCTS = {
  advanced_arbitrage_ai_prompts: {
    priceId: 'price_1RoLGYQsnQV19ezOEMevnnmt',
    name: 'Advanced Arbitrage Calculator + AI Prompt Collection',
    description: 'Unlock powerful tools for professional bettors. This package includes a precision-engineered arbitrage calculator to maximize your profits with low risk, and an exclusive collection of optimized AI prompts designed for sports betting analysis, value betting, and live decision support. Perfect for serious punters and data-driven strategists.',
    mode: 'subscription' as const,
    price: 99.00,
    currency: 'eur',
    interval: 'month',
    features: [
      'Precision-engineered arbitrage calculator',
      'Low-risk profit maximization tools', 
      'Exclusive AI prompts for sports betting',
      'Value betting analysis prompts',
      'Live decision support prompts',
      'Professional betting strategies',
      'Data-driven analysis tools'
    ]
  }
} as const;

export type StripeProduct = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];