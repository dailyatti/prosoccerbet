import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, CreditCard, Shield, Zap, Users, X, Euro, Calendar, Star } from 'lucide-react';
import { createCheckoutSession, formatCurrency } from '../../lib/stripe';
import { STRIPE_PRODUCTS, getTrialInfo } from '../../stripe-config';
import { useAuth } from '../../contexts/AuthContext';

interface StripeCheckoutProps {
  onClose?: () => void;
  preselectedPlan?: string;
}

export function StripeCheckout({ onClose, preselectedPlan }: StripeCheckoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan || 'monthly');

  const product = STRIPE_PRODUCTS.advanced_arbitrage_ai_prompts;
  const trialInfo = getTrialInfo();

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please log in to subscribe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createCheckoutSession(
        product.priceId, 
        product.mode,
        `${window.location.origin}/#success`,
        `${window.location.origin}/#dashboard`
      );
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
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-gray-900 rounded-3xl p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-gray-700 shadow-2xl relative"
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Crown className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-4">Upgrade to VIP Premium</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of successful bettors who trust our professional tools
          </p>
        </div>

        {/* Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Star className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Start with {trialInfo.duration}-Day Free Trial</h3>
          </div>
          <p className="text-gray-300">
            {trialInfo.description}
          </p>
        </motion.div>

        {/* Product Card */}
        <div className="max-w-3xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl p-8 border-2 border-green-500/50 bg-gradient-to-br from-green-500/5 to-blue-500/5 relative overflow-hidden"
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                🎯 PROFESSIONAL CHOICE
              </span>
            </div>

            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl font-bold text-white mb-4">{product.name}</h3>
              <div className="flex items-center justify-center mb-4">
                <Euro className="h-8 w-8 text-green-400 mr-2" />
                <span className="text-5xl font-bold text-white">
                  {product.price.toFixed(0)}
                </span>
                <div className="ml-3 text-left">
                  <div className="text-gray-400">EUR</div>
                  <div className="text-gray-400 text-sm">/{product.interval}</div>
                </div>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                {product.description}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {product.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Crown className="h-6 w-6" />
              <span>
                {loading ? 'Processing...' : `Start Free Trial - Then ${formatCurrency(product.price, product.currency)}/${product.interval}`}
              </span>
            </motion.button>

            <p className="text-center text-gray-400 text-sm mt-4">
              {trialInfo.duration} days free, then {formatCurrency(product.price, product.currency)} per {product.interval}. Cancel anytime.
            </p>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">Secure Payments</h4>
            <p className="text-gray-400 text-sm">
              Enterprise-grade security with Stripe's industry-leading payment processing
            </p>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">Instant Access</h4>
            <p className="text-gray-400 text-sm">
              Immediate access to all premium features right after subscription
            </p>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">VIP Support</h4>
            <p className="text-gray-400 text-sm">
              Priority customer support and dedicated assistance
            </p>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6"
            >
              <p className="text-red-400 text-center font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-6 border-t border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-4">
            🔒 Secure payment processing • 💳 All major cards accepted • 🔄 Cancel anytime
          </p>
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <CreditCard className="h-4 w-4" />
              <span>Visa • Mastercard • SEPA</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>256-bit SSL Encryption</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}