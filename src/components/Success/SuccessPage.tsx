import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, ArrowRight, Loader, Users, Shield, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSubscription } from '../../lib/stripe';
import { STRIPE_PRODUCTS } from '../../stripe-config';

export function SuccessPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Refresh user data first
        await refreshUser();
        
        // Wait a moment for webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const subData = await getUserSubscription();
        setSubscription(subData);
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message || 'Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, refreshUser]);

  const product = STRIPE_PRODUCTS.advanced_arbitrage_ai_prompts;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700">
            <Loader className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-4">Processing Your Subscription</h2>
            <p className="text-gray-400">
              Please wait while we activate your VIP access...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Processing Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = 'dashboard'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to ProSoft Hub VIP! 🎉
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Your subscription has been successfully activated. You now have full access to all professional tools.
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Crown className="h-6 w-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">{product.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Subscription Details */}
          {subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-700/50 rounded-lg p-6 mb-8"
            >
              <h4 className="text-white font-semibold mb-4">Subscription Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">Monthly Subscription</span>
                </div>
                {subscription.current_period_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Billing:</span>
                    <span className="text-white">
                      {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">€99.00/month</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">Secure Access</h4>
              <p className="text-gray-400 text-sm">
                Your subscription is protected with enterprise-level security
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">Instant Tools</h4>
              <p className="text-gray-400 text-sm">
                Access all professional tools immediately
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">VIP Support</h4>
              <p className="text-gray-400 text-sm">
                Priority support for all your questions
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = 'dashboard'}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-3"
            >
              <span>Access Your Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
            
            <p className="text-gray-400 text-sm">
              You now have full access to all professional tools and features.
            </p>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 pt-8 border-t border-gray-700"
          >
            <p className="text-gray-500 text-sm">
              Need help? Contact our support team or manage your subscription in your profile settings.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}