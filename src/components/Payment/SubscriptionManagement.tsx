import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CreditCard, Settings, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createCustomerPortalSession, checkSubscriptionStatus, formatCurrency } from '../../lib/stripe';

interface SubscriptionData {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_end: number;
  plan: {
    amount: number;
    currency: string;
    interval: string;
    product_name: string;
  };
  customer_id: string;
  cancel_at_period_end: boolean;
}

export function SubscriptionManagement() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await checkSubscriptionStatus(user.id);
      setSubscription(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription) return;

    setActionLoading(true);
    try {
      await createCustomerPortalSession(subscription.customer_id);
    } catch (err: any) {
      setError(err.message || 'Failed to open subscription management');
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'past_due':
        return 'text-orange-400 bg-orange-500/20';
      case 'canceled':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusText = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) return 'Canceling';
    
    switch (status) {
      case 'active':
        return 'Active';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'incomplete':
        return 'Incomplete';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSubscriptionStatus}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </motion.button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-center py-8">
          <Crown className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Active Subscription</h3>
          <p className="text-gray-400">You don't have an active VIP subscription yet.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">VIP Subscription</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
              {getStatusText(subscription.status, subscription.cancel_at_period_end)}
            </span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleManageSubscription}
          disabled={actionLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>{actionLoading ? 'Loading...' : 'Manage'}</span>
          <ExternalLink className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Details */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CreditCard className="h-5 w-5 text-blue-400" />
            <h4 className="font-medium text-white">Plan Details</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Plan:</span>
              <span className="text-white">{subscription.plan.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white">
                {formatCurrency(subscription.plan.amount, subscription.plan.currency)}/{subscription.plan.interval}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={getStatusColor(subscription.status).split(' ')[0]}>
                {getStatusText(subscription.status, subscription.cancel_at_period_end)}
              </span>
            </div>
          </div>
        </div>

        {/* Billing Cycle */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-5 w-5 text-green-400" />
            <h4 className="font-medium text-white">Billing Cycle</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">
                {subscription.cancel_at_period_end ? 'Expires:' : 'Next Payment:'}
              </span>
              <span className="text-white">
                {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Renewal:</span>
              <span className={subscription.cancel_at_period_end ? 'text-orange-400' : 'text-green-400'}>
                {subscription.cancel_at_period_end ? 'Canceling' : 'Automatic'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Notice */}
      {subscription.cancel_at_period_end && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-400" />
            <div>
              <p className="text-orange-400 font-medium">Subscription Canceling</p>
              <p className="text-orange-300 text-sm">
                Your subscription will end on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}.
                You'll continue to have access until then.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Management Actions */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManageSubscription}
            disabled={actionLoading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm"
          >
            <CreditCard className="h-4 w-4" />
            <span>Update Payment Method</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManageSubscription}
            disabled={actionLoading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm"
          >
            <Calendar className="h-4 w-4" />
            <span>View Billing History</span>
          </motion.button>
        </div>
        
        <p className="text-gray-500 text-xs mt-3">
          All subscription management is handled securely through Stripe's customer portal.
        </p>
      </div>
    </motion.div>
  );
}