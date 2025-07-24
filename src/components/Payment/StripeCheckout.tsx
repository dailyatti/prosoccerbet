import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, CreditCard, Shield, Zap, Users } from 'lucide-react';
import { createCheckoutSession, formatCurrency } from '../../lib/stripe';
import { STRIPE_PRODUCTS } from '../../stripe-config';
import { useAuth } from '../../contexts/AuthContext';

interface StripeCheckoutProps {
  onClose?: () => void;
}

export function StripeCheckout({ onClose }: StripeCheckoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const product = STRIPE_PRODUCTS.advanced_arbitrage_ai_prompts;

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please log in to subscribe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createCheckoutSession(product.priceId, product.mode);
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Upgrade to VIP</h2>
          <p className="text-gray-400">
            {product.description}
          </p>
        </div>

        {/* Product Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-xl p-8 border-2 border-blue-500 bg-blue-500/10 relative"
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white text-sm px-4 py-1 rounded-full">
                PROFESSIONAL TOOLS
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-white mb-4">{product.name}</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold text-white">
                  {formatCurrency(product.price, product.currency)}
                </span>
                <span className="text-gray-400 ml-2">/{product.interval}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <Crown className="h-5 w-5" />
              <span>{loading ? 'Processing...' : `Subscribe for ${formatCurrency(product.price, product.currency)}/${product.interval}`}</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h4 className="text-white font-medium mb-2">Secure Payments</h4>
            <p className="text-gray-400 text-sm">
              Industry-standard encryption and security
            </p>
          </div>
          <div className="text-center">
            <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <h4 className="text-white font-medium mb-2">Instant Access</h4>
            <p className="text-gray-400 text-sm">
              Immediate access to all premium features
            </p>
          </div>
          <div className="text-center">
            <Users className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h4 className="text-white font-medium mb-2">Premium Support</h4>
            <p className="text-gray-400 text-sm">
              Priority customer support and assistance
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">
            Cancel anytime. No hidden fees. Secure payment processing by Stripe.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}