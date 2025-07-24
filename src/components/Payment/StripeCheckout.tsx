import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, CreditCard, Shield, Zap, Users } from 'lucide-react';
import { createCheckoutSession, STRIPE_PRODUCTS, formatCurrency } from '../../lib/stripe';
import { useAuth } from '../../contexts/AuthContext';

interface StripeCheckoutProps {
  onClose?: () => void;
  selectedPlan?: 'monthly' | 'yearly';
}

export function StripeCheckout({ onClose, selectedPlan = 'monthly' }: StripeCheckoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlanState, setSelectedPlanState] = useState(selectedPlan);
  const [error, setError] = useState('');

  const monthlyPlan = STRIPE_PRODUCTS.vip_monthly;
  const yearlyPlan = STRIPE_PRODUCTS.vip_yearly;

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      setError('Please log in to subscribe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createCheckoutSession(priceId, user.email);
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  const savings = (monthlyPlan.price * 12) - yearlyPlan.price;

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
            Unlock all professional tools and maximize your potential
          </p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-700 rounded-lg p-1 flex">
            <button
              onClick={() => setSelectedPlanState('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                selectedPlanState === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlanState('yearly')}
              className={`px-6 py-2 rounded-md transition-all relative ${
                selectedPlanState === 'yearly'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save ${savings}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Monthly Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-6 border-2 transition-all ${
              selectedPlanState === 'monthly'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Monthly Plan</h3>
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-white">
                  {formatCurrency(monthlyPlan.price * 100)}
                </span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-gray-400 text-sm">{monthlyPlan.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {monthlyPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubscribe(monthlyPlan.priceId)}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                selectedPlanState === 'monthly'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <CreditCard className="h-5 w-5" />
              <span>{loading ? 'Processing...' : 'Choose Monthly'}</span>
            </motion.button>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-6 border-2 transition-all relative ${
              selectedPlanState === 'yearly'
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white text-sm px-4 py-1 rounded-full">
                BEST VALUE
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Yearly Plan</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold text-white">
                  {formatCurrency(yearlyPlan.price * 100)}
                </span>
                <span className="text-gray-400 ml-2">/year</span>
              </div>
              <div className="text-green-400 text-sm mb-4">
                Save ${savings} compared to monthly
              </div>
              <p className="text-gray-400 text-sm">{yearlyPlan.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {yearlyPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubscribe(yearlyPlan.priceId)}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                selectedPlanState === 'yearly'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Crown className="h-5 w-5" />
              <span>{loading ? 'Processing...' : 'Choose Yearly'}</span>
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