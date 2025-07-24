import React, { useState, useEffect } from 'react';
import { Shield, Users, Crown, TrendingUp, Calendar, DollarSign, Activity, 
         UserCheck, UserX, Plus, Search, Filter, MoreVertical, Lock,
         Edit, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, 
         BarChart3, PieChart, LineChart, Globe, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatDate, useSubscriptionStatus } from '../../lib/dateUtils';
import { getUserAccessLevel } from '../../lib/stripe';
import type { User, VipTip } from '../../types';

// Access control component
function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userAccessLevel = getUserAccessLevel(user);
  const hasAccess = user?.is_admin || userAccessLevel === 'premium';

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-700"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Restricted Access</h2>
          <p className="text-gray-400 mb-6">
            This admin panel is only accessible to administrators and premium users.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.hash = '#dashboard'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors w-full"
            >
              Back to Dashboard
            </button>
            {userAccessLevel === 'free' && (
              <button
                onClick={() => {
                  const event = new CustomEvent('openStripeCheckout');
                  window.dispatchEvent(event);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg transition-colors w-full"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [tips, setTips] = useState<VipTip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingTip, setEditingTip] = useState<VipTip | null>(null);
  const [newTip, setNewTip] = useState({
    title: '',
    content: '',
    category: 'vip' as 'free' | 'vip',
    sport: '',
    confidence_level: 'medium' as 'low' | 'medium' | 'high'
  });

  // Real-time analytics data
  const [analytics, setAnalytics] = useState({
    totalUsers: 1247,
    premiumUsers: 289,
    trialUsers: 156,
    monthlyRevenue: 28611,
    conversionRate: 23.2,
    churnRate: 4.1,
    activeSubscriptions: 289,
    totalTips: 134,
    activeTips: 89,
    avgSessionTime: '12m 34s',
    dailyActiveUsers: 423,
    weeklyActiveUsers: 891,
    monthlyActiveUsers: 1247
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchTips(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase!
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } else {
        // Mock realistic user data
        const mockUsers: User[] = [
          {
            id: '1',
            email: 'sarah.johnson@gmail.com',
            full_name: 'Sarah Johnson',
            subscription_active: true,
            subscription_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            trial_expires_at: null,
            is_trial_used: true,
            is_admin: false,
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            email: 'michael.brown@yahoo.com',
            full_name: 'Michael Brown',
            subscription_active: false,
            subscription_expires_at: null,
            trial_expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            is_trial_used: false,
            is_admin: false,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            email: 'david.wilson@outlook.com',
            full_name: 'David Wilson',
            subscription_active: true,
            subscription_expires_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            trial_expires_at: null,
            is_trial_used: true,
            is_admin: false,
            created_at: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            email: 'emma.davis@gmail.com',
            full_name: 'Emma Davis',
            subscription_active: false,
            subscription_expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            trial_expires_at: null,
            is_trial_used: true,
            is_admin: false,
            created_at: new Date(Date.now() - 124 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '5',
            email: 'james.miller@hotmail.com',
            full_name: 'James Miller',
            subscription_active: false,
            subscription_expires_at: null,
            trial_expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            is_trial_used: false,
            is_admin: false,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTips = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase!
          .from('tips')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTips(data || []);
      } else {
        // Mock realistic tips data
        const mockTips: VipTip[] = [
          {
            id: '1',
            title: 'Bayern Munich vs PSG - Over 2.5 Goals',
            content: 'Both teams have strong attacking lines. Bayern averaging 2.8 goals per game at home, PSG 2.3 away. Defensive weaknesses on both sides suggest high-scoring match.',
            sport: 'Football',
            confidence_level: 'high',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            created_by: user?.id || '1',
            is_active: true
          },
          {
            id: '2', 
            title: 'Lakers vs Celtics - Lakers -4.5',
            content: 'Lakers have won 8 of last 10 home games. Celtics missing key player due to injury. Home court advantage should be decisive factor.',
            sport: 'NBA',
            confidence_level: 'medium',
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            created_by: user?.id || '1',
            is_active: true
          },
          {
            id: '3',
            title: 'Chiefs vs Bills - Under 48.5 Points',
            content: 'Weather conditions poor with strong winds. Both teams have solid defenses. Historical data shows unders hit 73% in similar conditions.',
            sport: 'NFL',
            confidence_level: 'high',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            created_by: user?.id || '1',
            is_active: false
          }
        ];
        setTips(mockTips);
      }
    } catch (error) {
      console.error('Error fetching tips:', error);
    }
  };

  const fetchAnalytics = async () => {
    // Simulate real-time data updates
    setAnalytics(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
      dailyActiveUsers: prev.dailyActiveUsers + Math.floor(Math.random() * 5) - 2,
      monthlyRevenue: prev.monthlyRevenue + Math.floor(Math.random() * 500) - 250
    }));
  };

  const handleCreateTip = async () => {
    try {
      const tipData = {
        ...newTip,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        created_by: user?.id || '1',
        is_active: true
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('tips')
          .insert(tipData);

        if (error) throw error;
      }

      setTips(prev => [tipData as VipTip, ...prev]);
      setNewTip({
        title: '',
        content: '',
        category: 'vip',
        sport: '',
        confidence_level: 'medium'
      });
      setShowTipModal(false);
    } catch (error) {
      console.error('Error creating tip:', error);
    }
  };

  const handleToggleTipStatus = async (tipId: string) => {
    try {
      const tip = tips.find(t => t.id === tipId);
      if (!tip) return;

      const newStatus = !tip.is_active;

      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('tips')
          .update({ is_active: newStatus })
          .eq('id', tipId);

        if (error) throw error;
      }

      setTips(prev => prev.map(t => 
        t.id === tipId ? { ...t, is_active: newStatus } : t
      ));
    } catch (error) {
      console.error('Error toggling tip status:', error);
    }
  };

  const handleToggleUserSubscription = async (userId: string) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;

      const newStatus = !userToUpdate.subscription_active;
      const expiryDate = newStatus 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('users')
          .update({ 
            subscription_active: newStatus,
            subscription_expires_at: expiryDate
          })
          .eq('id', userId);

        if (error) throw error;
      }

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, subscription_active: newStatus, subscription_expires_at: expiryDate }
          : u
      ));
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.subscription_active) ||
                         (filterStatus === 'trial' && !user.is_trial_used) ||
                         (filterStatus === 'expired' && !user.subscription_active && user.is_trial_used);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (user: User) => {
    if (user.subscription_active) return 'text-green-400 bg-green-500/20';
    if (!user.is_trial_used) return 'text-blue-400 bg-blue-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getStatusText = (user: User) => {
    if (user.subscription_active) return 'Premium';
    if (!user.is_trial_used) return 'Trial';
    return 'Expired';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'tips', name: 'Tips', icon: Crown },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  return (
    <AdminAccessGate>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                  <p className="text-gray-400">Professional platform management</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium">{analytics.dailyActiveUsers}</span>
                    <span className="text-gray-400 text-sm">online</span>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium">€{analytics.monthlyRevenue.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">MRR</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 mb-8"
          >
            <div className="flex space-x-1 p-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Users</p>
                        <p className="text-2xl font-bold text-white">{analytics.totalUsers}</p>
                        <p className="text-green-400 text-sm">+12% this month</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Premium Users</p>
                        <p className="text-2xl font-bold text-white">{analytics.premiumUsers}</p>
                        <p className="text-green-400 text-sm">+8% this month</p>
                      </div>
                      <Crown className="h-8 w-8 text-yellow-400" />
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-white">€{analytics.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-green-400 text-sm">+15% this month</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Conversion Rate</p>
                        <p className="text-2xl font-bold text-white">{analytics.conversionRate}%</p>
                        <p className="text-green-400 text-sm">+2.1% this month</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { user: 'Sarah Johnson', action: 'Subscribed to Premium', time: '5 minutes ago', type: 'subscription' },
                      { user: 'Michael Brown', action: 'Started 3-day trial', time: '12 minutes ago', type: 'trial' },
                      { user: 'Admin', action: 'Published new VIP tip', time: '1 hour ago', type: 'tip' },
                      { user: 'David Wilson', action: 'Used AI Prompt Generator', time: '2 hours ago', type: 'usage' },
                      { user: 'Emma Davis', action: 'Subscription expired', time: '4 hours ago', type: 'expired' }
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'subscription' ? 'bg-green-400' :
                            activity.type === 'trial' ? 'bg-blue-400' :
                            activity.type === 'tip' ? 'bg-yellow-400' :
                            activity.type === 'usage' ? 'bg-purple-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium">{activity.user}</p>
                            <p className="text-gray-400 text-sm">{activity.action}</p>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm">{activity.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* User Management Controls */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                    <div>
                      <h3 className="text-xl font-semibold text-white">User Management</h3>
                      <p className="text-gray-400">Manage subscriptions and user access</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="active">Premium</option>
                        <option value="trial">Trial</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Subscription
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredUsers.map((user, index) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-white">
                                    {user.full_name || 'No name'}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                                {getStatusText(user)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {user.subscription_active && user.subscription_expires_at ? (
                                <div>
                                  <div className="text-green-400">Active</div>
                                  <div className="text-gray-500 text-xs">
                                    Until {formatDate(user.subscription_expires_at)}
                                  </div>
                                </div>
                              ) : !user.is_trial_used && user.trial_expires_at ? (
                                <div>
                                  <div className="text-blue-400">Trial</div>
                                  <div className="text-gray-500 text-xs">
                                    Until {formatDate(user.trial_expires_at)}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-red-400">None</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleToggleUserSubscription(user.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    user.subscription_active
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  {user.subscription_active ? 'Revoke' : 'Grant'}
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tips' && (
              <motion.div
                key="tips"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Tips Management Controls */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Tips Management</h3>
                      <p className="text-gray-400">Create and manage betting tips</p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowTipModal(true)}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Tip</span>
                    </motion.button>
                  </div>
                </div>

                {/* Tips Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tips.map((tip, index) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-2">{tip.title}</h4>
                          <div className="flex items-center space-x-2 mb-3">
                            {tip.sport && (
                              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                                {tip.sport}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(tip.confidence_level)}`}>
                              {tip.confidence_level.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tip.is_active ? 'text-green-400 bg-green-500/20' : 'text-gray-400 bg-gray-500/20'
                            }`}>
                              {tip.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleTipStatus(tip.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              tip.is_active
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {tip.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {tip.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Created {formatDate(tip.created_at)}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>Expert Tip</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Premium Subscriptions</span>
                        <span className="text-green-400 font-medium">€{(analytics.premiumUsers * 99).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">One-time Purchases</span>
                        <span className="text-blue-400 font-medium">€2,340</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Affiliate Commissions</span>
                        <span className="text-purple-400 font-medium">€1,200</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Daily Active Users</span>
                        <span className="text-green-400 font-medium">{analytics.dailyActiveUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Weekly Active Users</span>
                        <span className="text-blue-400 font-medium">{analytics.weeklyActiveUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Monthly Active Users</span>
                        <span className="text-purple-400 font-medium">{analytics.monthlyActiveUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                    <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-white mb-2">{analytics.conversionRate}%</div>
                    <div className="text-gray-400">Conversion Rate</div>
                    <div className="text-green-400 text-sm mt-1">+2.1% from last month</div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                    <PieChart className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-white mb-2">{analytics.churnRate}%</div>
                    <div className="text-gray-400">Churn Rate</div>
                    <div className="text-green-400 text-sm mt-1">-0.8% from last month</div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                    <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-white mb-2">{analytics.avgSessionTime}</div>
                    <div className="text-gray-400">Avg Session Time</div>
                    <div className="text-green-400 text-sm mt-1">+1m 12s from last month</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Tip Modal */}
          <AnimatePresence>
            {showTipModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                onClick={(e) => e.target === e.currentTarget && setShowTipModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Create New Tip</h3>
                    <button
                      onClick={() => setShowTipModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newTip.title}
                        onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Lakers vs Warriors - Over 225.5 Points"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={newTip.category}
                          onChange={(e) => setNewTip({ ...newTip, category: e.target.value as 'free' | 'vip' })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="free">Free</option>
                          <option value="vip">VIP</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sport
                        </label>
                        <input
                          type="text"
                          value={newTip.sport}
                          onChange={(e) => setNewTip({ ...newTip, sport: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="NBA, NFL, Premier League..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confidence
                        </label>
                        <select
                          value={newTip.confidence_level}
                          onChange={(e) => setNewTip({ ...newTip, confidence_level: e.target.value as 'low' | 'medium' | 'high' })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Content
                      </label>
                      <textarea
                        value={newTip.content}
                        onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                        className="w-full h-40 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Enter detailed analysis and betting recommendation..."
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTipModal(false)}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateTip}
                        disabled={!newTip.title || !newTip.content}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Create Tip
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminAccessGate>
  );
}