import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Brain, Calculator, Crown, Shield, TrendingUp, Users, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscriptionStatus, hasPremiumAccess } from '../../lib/dateUtils';
import { CountdownTimer, CompactCountdown } from '../UI/CountdownTimer';
import { NotificationSystem, useCountdownNotifications } from '../UI/NotificationSystem';
import { StripeCheckout } from '../Payment/StripeCheckout';
import { getUserSubscription, formatCurrency, hasStripeAccess } from '../../lib/stripe';
import { STRIPE_PRODUCTS } from '../../stripe-config';

export function Dashboard() {
  const { user } = useAuth();
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [stripeSubscription, setStripeSubscription] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(true);

  const subscriptionStatus = useSubscriptionStatus(user);
  const hasTrialAccess = hasPremiumAccess(user);
  const hasActiveStripe = hasStripeAccess(user);
  const hasAccess = hasTrialAccess || hasActiveStripe;
  const product = STRIPE_PRODUCTS.advanced_arbitrage_ai_prompts;

  // Use countdown notifications
  const { notifications, removeNotification, notifyExpiringSoon, notifyExpired } = useCountdownNotifications();

  // Check Stripe subscription status
  useEffect(() => {
    const checkStripeSubscription = async () => {
      if (user && user.stripe_customer_id) {
        try {
          const subscription = await getUserSubscription();
          setStripeSubscription(subscription);
        } catch (error) {
          console.error('Error checking Stripe subscription:', error);
        }
      }
      setStripeLoading(false);
    };

    checkStripeSubscription();
  }, [user]);

  // Handle subscription expiration and warnings
  useEffect(() => {
    if (!user) return;

    const type = subscriptionStatus.type === 'trial' ? 'trial' : 'subscription';
    
    if (subscriptionStatus.isExpiringSoon && subscriptionStatus.hoursLeft <= 1 && subscriptionStatus.hoursLeft > 0) {
      notifyExpiringSoon(subscriptionStatus.formattedTimeLeft, type);
    }
    
    if (subscriptionStatus.type === 'expired') {
      notifyExpired(type);
    }
  }, [subscriptionStatus, user, notifyExpiringSoon, notifyExpired]);

  const tools = [
    {
      id: 'ai-prompt',
      name: 'AI Prompt Generator',
      description: 'Generate professional prompts from text or images using advanced AI',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      href: 'https://eng-prompt-elemz.netlify.app/',
      external: true
    },
    {
      id: 'arbitrage-calc',
      name: 'Arbitrage Calculator',
      description: 'Find profitable arbitrage opportunities across different bookmakers',
      icon: Calculator,
      color: 'from-green-500 to-teal-500',
      href: 'https://prismatic-meringue-16ade7.netlify.app/',
      external: true
    },
    {
      id: 'vip-tips',
      name: 'VIP Tips',
      description: 'Access exclusive betting tips and professional insights',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      href: '#vip-tips',
      external: false
    }
  ];

  const stats = [
    {
      name: 'Active Users',
      value: '2,847',
      icon: Users,
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Tools Available',
      value: hasAccess ? '3' : '0',
      icon: Shield,
      change: '+1',
      changeType: 'increase'
    },
    {
      name: 'Account Status',
      value: hasActiveStripe ? 'Premium' :
             subscriptionStatus.type === 'trial' ? 'Trial' : 
             subscriptionStatus.type === 'active' ? 'Premium' : 'Free',
      icon: TrendingUp,
      change: hasActiveStripe ? 'Active' : subscriptionStatus.daysLeft > 0 ? `${subscriptionStatus.daysLeft}d` : '',
      changeType: 'increase'
    }
  ];

  const handleSubscriptionExpire = () => {
    const type = subscriptionStatus.type === 'trial' ? 'trial' : 'subscription';
    notifyExpired(type);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
        position="top-right"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.full_name || user?.email}
            </h1>
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${
              hasActiveStripe ? 'from-green-500 to-emerald-500' : subscriptionStatus.color
            } text-white font-medium text-sm`}>
              {hasActiveStripe ? 'Premium Subscriber' : subscriptionStatus.text}
            </div>
          </div>
          <p className="text-gray-400">
            {hasAccess 
              ? 'Access your professional betting tools and maximize your potential' 
              : 'Subscribe to unlock all professional tools'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {stats.map((item, index) => (
            <div key={item.name} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className={`h-8 w-8 ${
                    item.name === 'Account Status' 
                      ? hasActiveStripe ? 'text-green-400'
                        : subscriptionStatus.type === 'trial' ? 'text-blue-400'
                        : subscriptionStatus.type === 'active' ? 'text-green-400'
                        : 'text-red-400'
                      : 'text-blue-400'
                  }`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      {item.name}
                    </dt>
                    <dd className="text-lg font-semibold text-white">
                      {item.value}
                    </dd>
                  </dl>
                </div>
                <div className="ml-5 flex-shrink-0">
                  <span className="text-green-400 text-sm font-medium">
                    {item.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Subscription Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg p-6 border mb-8 ${
            hasActiveStripe
              ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20'
              : subscriptionStatus.type === 'active' 
              ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20'
              : subscriptionStatus.type === 'trial'
              ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20' 
              : 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {hasActiveStripe ? 'Premium Subscription Active' :
                 subscriptionStatus.type === 'trial' ? '3-Day Trial Status' : 
                 subscriptionStatus.type === 'active' ? 'VIP Subscription Status' : 'Subscription Status'}
              </h3>
              <p className="text-gray-400 text-sm">
                {hasActiveStripe 
                  ? `You have full access to ${product.name}`
                  : subscriptionStatus.type === 'active' 
                  ? 'You have full access to all professional tools'
                  : subscriptionStatus.type === 'trial'
                  ? `Enjoy ${subscriptionStatus.daysLeft} more day${subscriptionStatus.daysLeft > 1 ? 's' : ''} of free access`
                  : 'Subscribe to access all professional tools'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!hasActiveStripe && (subscriptionStatus.type === 'expired' || subscriptionStatus.type === 'inactive') && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowStripeCheckout(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Subscribe - {formatCurrency(product.price, product.currency)}/{product.interval}
                </button>
              )}
            </div>
          </div>
          
          {/* Subscription Details */}
          {hasActiveStripe && stripeSubscription && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">
                    {stripeSubscription.subscription?.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Next Billing:</span>
                  <span className="text-white">
                    {stripeSubscription.subscription?.current_period_end 
                      ? new Date(stripeSubscription.subscription.current_period_end * 1000).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Trial/Local Subscription Countdown */}
          {!hasActiveStripe && (subscriptionStatus.type === 'trial' || subscriptionStatus.type === 'active') && (
            <div className="mb-4">
              <CountdownTimer
                expiryDate={subscriptionStatus.type === 'trial' ? user?.trial_expires_at : user?.subscription_expires_at}
                size="lg"
                showProgress={true}
                onExpire={handleSubscriptionExpire}
                className="max-w-md"
              />
            </div>
          )}
          
          {/* Expiring Soon Warning */}
          {!hasActiveStripe && subscriptionStatus.isExpiringSoon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-medium">
                    {subscriptionStatus.type === 'trial' ? 'Trial expiring soon!' : 'Subscription expiring soon!'}
                  </p>
                  <p className="text-orange-300 text-sm">
                    Your access expires in {subscriptionStatus.formattedTimeLeft}. Subscribe now for continuous access.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Trial Upgrade CTA */}
          {!hasActiveStripe && subscriptionStatus.type === 'trial' && (
            <div className="mt-4 pt-4 border-t border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Enjoying your trial?</p>
                  <p className="text-gray-400 text-sm">Upgrade now and never lose access</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowStripeCheckout(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Subscribe - {formatCurrency(product.price, product.currency)}/{product.interval}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Professional Tools</h2>
          
          {hasAccess ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                  <a
                    href={tool.href}
                    target={tool.external ? "_blank" : "_self"}
                    rel={tool.external ? "noopener noreferrer" : undefined}
                    onClick={tool.external ? undefined : (e) => {
                      e.preventDefault();
                      window.location.hash = tool.href;
                    }}
                    className="block cursor-pointer"
                  >
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} group-hover:scale-110 transition-transform duration-200`}>
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {tool.description}
                    </p>
                  </a>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <motion.div
                  key={tool.id}
                  className="group bg-gray-800/50 rounded-lg p-6 border border-gray-700 opacity-50 cursor-not-allowed relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                    <div className="text-center">
                      <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white font-medium">Premium Feature</p>
                      <p className="text-gray-400 text-xs mt-1">Subscribe for access</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color}`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {tool.description}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Stripe Checkout Modal */}
      {showStripeCheckout && (
        <StripeCheckout onClose={() => setShowStripeCheckout(false)} />
      )}
    </div>
  );
}