import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSubscription } from '../../lib/stripe';
import { STRIPE_PRODUCTS } from '../../stripe-config';

export function SuccessPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    // Wait a moment for webhook processing, then check subscription status
    const timer = setTimeout(async () => {
      try {
        const subData = await getUserSubscription();
        setSubscription(subData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    }, 3000); // Wait 3 seconds for webhook processing

    return () => clearTimeout(timer);
  }, []);

  const getProductInfo = (priceId: string | null) => {
    if (!priceId) return null;
    return Object.values(STRIPE_PRODUCTS).find(p => p.priceId === priceId) || null;
  };

  const productInfo = getProductInfo(subscription?.price_id);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        {loading ? (
          <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700">
            <Loader className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-4">Processing Your Subscription</h2>
            <p className="text-gray-400">
              Please wait while we activate your account...
            </p>
          </div>
        ) : (
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
                Welcome to ProSoft Hub VIP!
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Your subscription has been successfully activated.
              </p>
              
              {productInfo && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Crown className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">{productInfo.name}</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">{productInfo.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {productInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                      {subscription.subscription_status === 'active' ? 'Active' : subscription.subscription_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Billing:</span>
                    <span className="text-white">
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  {subscription.payment_method_brand && subscription.payment_method_last4 && (
                    <div className="flex justify-between md:col-span-2">
                      <span className="text-gray-400">Payment Method:</span>
                      <span className="text-white">
                        {subscription.payment_method_brand.toUpperCase()} ****{subscription.payment_method_last4}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <motion.a
                href="#dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-3"
              >
                <span>Access Your Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </motion.a>
              
              <p className="text-gray-400 text-sm">
                You now have full access to all professional tools and features.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}