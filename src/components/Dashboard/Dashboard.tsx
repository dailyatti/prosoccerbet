import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Brain, Calculator, Crown, Shield, TrendingUp, Users, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CancellationFlow } from './CancellationFlow';
import { useState, useEffect } from 'react';
import { useSubscriptionStatus, hasPremiumAccess } from '../../lib/dateUtils';
import { CountdownTimer, CompactCountdown, DetailedCountdown } from '../UI/CountdownTimer';
import { NotificationSystem, useCountdownNotifications } from '../UI/NotificationSystem';

export function Dashboard() {
  const { user } = useAuth();
  const [showCancellation, setShowCancellation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Professzionális valós idejű előfizetés státusz hook
  const subscriptionStatus = useSubscriptionStatus(user);
  const hasAccess = hasPremiumAccess(user);

  // Use countdown notifications
  const { notifications, removeNotification, notifyExpiringSoon, notifyExpired } = useCountdownNotifications();

  // Update current time every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for real-time countdown

    return () => clearInterval(interval);
  }, []);

  // Handle subscription expiration and warnings
  useEffect(() => {
    if (!user) return;

    const type = subscriptionStatus.type === 'trial' ? 'trial' : 'subscription';
    
    // Notify when expiring soon (within 1 hour)
    if (subscriptionStatus.isExpiringSoon && subscriptionStatus.hoursLeft <= 1 && subscriptionStatus.hoursLeft > 0) {
      notifyExpiringSoon(subscriptionStatus.formattedTimeLeft, type);
    }
    
    // Notify when expired
    if (subscriptionStatus.type === 'expired') {
      notifyExpired(type);
    }
  }, [subscriptionStatus, user, notifyExpiringSoon, notifyExpired]);

  const tools = [
    {
      id: 'prompt-generator',
      name: 'AI Prompt Generator',
      description: 'Generate professional prompts from text or images using advanced AI',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      href: 'https://eng-prompt-elemz.netlify.app/',
      external: true
    },
    {
      id: 'arbitrage',
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
      value: subscriptionStatus.type === 'trial' ? 'Trial' : 
             subscriptionStatus.type === 'active' ? 'Premium' : 'Free',
      icon: TrendingUp,
      change: subscriptionStatus.daysLeft > 0 ? `${subscriptionStatus.daysLeft}d` : '',
      changeType: 'increase'
    }
  ];

  // Handle subscription expiration
  const handleSubscriptionExpire = () => {
    const type = subscriptionStatus.type === 'trial' ? 'trial' : 'subscription';
    notifyExpired(type);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Notification System */}
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
              Üdvözlünk újra, {user?.full_name || user?.email}
            </h1>
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${subscriptionStatus.color} text-white font-medium text-sm`}>
              {subscriptionStatus.text}
            </div>
          </div>
          <p className="text-gray-400">
            {hasAccess 
              ? 'Használd a professzionális eszközöket és maximalizáld a potenciálod' 
              : '3 napos VIP trial-t kapsz minden új regisztrációhoz'}
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
                      ? subscriptionStatus.type === 'trial' ? 'text-blue-400'
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

        {/* Real-time Subscription Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg p-6 border mb-8 ${
            subscriptionStatus.type === 'active' 
              ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20'
              : subscriptionStatus.type === 'trial'
              ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20' 
              : 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {subscriptionStatus.type === 'trial' ? '3 Napos VIP Trial Státusz' : 'VIP Előfizetés Státusz'}
              </h3>
              <p className="text-gray-400 text-sm">
                {subscriptionStatus.type === 'active' 
                  ? 'Teljes hozzáférésed van minden professzionális eszközhöz'
                  : subscriptionStatus.type === 'trial'
                  ? `Élvezd még ${subscriptionStatus.daysLeft} nap ingyenes hozzáférést minden funkcióhoz`
                  : 'Iratkozz fel az összes eszköz eléréséhez'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {subscriptionStatus.type === 'active' && user?.subscription_active && (
                <button
                  data-cancel-subscription
                  onClick={() => setShowCancellation(true)}
                  className="text-red-400 hover:text-red-300 text-sm underline transition-colors"
                >
                  Előfizetés lemondása
                </button>
              )}
              
              {(subscriptionStatus.type === 'expired' || subscriptionStatus.type === 'inactive') && (
                <a
                  href="https://whop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  VIP Előfizetés Aktiválása
                </a>
              )}
            </div>
          </div>
          
          {/* Real-time Countdown Timer */}
          <div className="mb-4">
            <CountdownTimer
              expiryDate={subscriptionStatus.type === 'trial' ? user?.trial_expires_at : user?.subscription_expires_at}
              size="lg"
              showProgress={true}
              onExpire={handleSubscriptionExpire}
              className="max-w-md"
            />
          </div>
          
          {/* Detailed Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Lejárat</p>
                <p className="text-white font-medium">{subscriptionStatus.formattedExpiry}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Hátralévő Idő</p>
                <p className="text-white font-medium">
                  {subscriptionStatus.formattedTimeLeft}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar with Real-time Updates */}
          {(subscriptionStatus.type === 'trial' || subscriptionStatus.type === 'active') && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Haladás</span>
                <span>{subscriptionStatus.progressPercentage.toFixed(1)}% felhasználva</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    subscriptionStatus.isExpiringSoon 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : subscriptionStatus.type === 'trial'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${subscriptionStatus.progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
          
          {/* Expiring Soon Warning */}
          {subscriptionStatus.isExpiringSoon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-medium">
                    {subscriptionStatus.type === 'trial' ? '3 Napos VIP Trial hamarosan lejár!' : 'VIP Előfizetés hamarosan lejár!'}
                  </p>
                  <p className="text-orange-300 text-sm">
                    A {subscriptionStatus.type === 'trial' ? '3 napos VIP trial-od' : 'VIP előfizetésed'} {subscriptionStatus.formattedTimeLeft} múlva lejár. 
                    Újítsd meg most a folyamatos hozzáférésért.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Trial Upgrade CTA */}
          {subscriptionStatus.type === 'trial' && (
            <div className="mt-4 pt-4 border-t border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Tetszik a 3 napos VIP trial?</p>
                  <p className="text-gray-400 text-sm">Frissíts most és soha ne veszítsd el a hozzáférést</p>
                </div>
                <a
                  href="https://whop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  VIP Előfizetés Aktiválása
                </a>
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
          <h2 className="text-2xl font-bold text-white mb-6">Available Tools</h2>
          <h2 className="text-2xl font-bold text-white mb-6">Elérhető Eszközök</h2>
          
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
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  className="group bg-gray-800/50 rounded-lg p-6 border border-gray-700 opacity-50 cursor-not-allowed relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                    <div className="text-center">
                      <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white font-medium">
                        {subscriptionStatus.type === 'expired' 
                          ? '3 Napos VIP Trial Lejárt' 
                          : 'VIP Funkció'}
                      </p>
                      {subscriptionStatus.type === 'expired' && (
                        <p className="text-gray-400 text-xs mt-1">Frissíts a hozzáférésért</p>
                      )}
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
      
      {/* Cancellation Flow Modal */}
      {showCancellation && (
        <CancellationFlow onClose={() => setShowCancellation(false)} />
      )}
    </div>
  );
}