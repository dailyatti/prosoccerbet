import React, { useState, useEffect } from 'react';
import { Settings, Users, Crown, TrendingUp, Plus, Edit, Trash2, Save, X, Eye, Ban, UserCheck, UserX, Calendar, Euro, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, VipTip } from '../../types';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  bannedUsers: number;
  totalTips: number;
  freeTips: number;
  vipTips: number;
  todayRevenue: number;
}

interface UserWithBan extends User {
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
}

interface TipWithCategory {
  id: string;
  title: string;
  content: string;
  category: 'free' | 'vip';
  sport?: string;
  confidence_level: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
  created_by: string;
}

// Mock data for demo mode
const mockUsers: UserWithBan[] = [
  {
    id: '1',
    email: 'user1@example.com',
    full_name: 'John Smith',
    subscription_active: true,
    subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_admin: false,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false
  },
  {
    id: '2', 
    email: 'user2@example.com',
    full_name: 'Sarah Johnson',
    subscription_active: false,
    subscription_expires_at: null,
    is_admin: false,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: true,
    ban_reason: 'Violation of terms'
  }
];

const mockTips: TipWithCategory[] = [
  {
    id: '1',
    title: 'Ingyenes Napi Tipp - Lakers vs Warriors',
    content: '🏀 INGYENES TIPP\n\nLakers vs Warriors meccs elemzés...\nAjánlott fogadás: Over 225.5 pont',
    category: 'free',
    sport: 'NBA',
    confidence_level: 'medium',
    is_active: true,
    created_at: new Date().toISOString(),
    created_by: 'admin'
  },
  {
    id: '2',
    title: 'VIP Premium - Chiefs vs Bills Részletes Elemzés',
    content: '🏈 VIP EXKLUZÍV\n\nRészletes elemzés minden statisztikával...\nProfi ajánlás 3 különböző fogadással',
    category: 'vip',
    sport: 'NFL', 
    confidence_level: 'high',
    is_active: true,
    created_at: new Date().toISOString(),
    created_by: 'admin'
  }
];

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tips' | 'bans'>('overview');
  const [users, setUsers] = useState<UserWithBan[]>([]);
  const [tips, setTips] = useState<TipWithCategory[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    bannedUsers: 0,
    totalTips: 0,
    freeTips: 0,
    vipTips: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTip, setEditingTip] = useState<TipWithCategory | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithBan | null>(null);
  const [tipForm, setTipForm] = useState({
    title: '',
    content: '',
    category: 'free' as 'free' | 'vip',
    sport: '',
    confidence_level: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await Promise.all([
          fetchUsers(),
          fetchTips(),
          fetchStats()
        ]);
      } else {
        // Use mock data
        setUsers(mockUsers);
        setTips(mockTips);
        setStats({
          totalUsers: mockUsers.length,
          activeSubscriptions: mockUsers.filter(u => u.subscription_active).length,
          bannedUsers: mockUsers.filter(u => u.is_banned).length,
          totalTips: mockTips.length,
          freeTips: mockTips.filter(t => t.category === 'free').length,
          vipTips: mockTips.filter(t => t.category === 'vip').length,
          todayRevenue: 2847.50
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase!
        .from('users')
        .select(`
          *,
          user_bans!inner(
            is_active,
            reason,
            expires_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const usersWithBans = data?.map(userData => ({
        ...userData,
        is_banned: userData.user_bans?.some((ban: any) => ban.is_active),
        ban_reason: userData.user_bans?.find((ban: any) => ban.is_active)?.reason,
        ban_expires_at: userData.user_bans?.find((ban: any) => ban.is_active)?.expires_at
      })) || [];
      
      setUsers(usersWithBans);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase!
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: usersData } = await supabase!.from('users').select('*');
      const { data: tipsData } = await supabase!.from('tips').select('*');
      const { data: bansData } = await supabase!.from('user_bans').select('*').eq('is_active', true);

      setStats({
        totalUsers: usersData?.length || 0,
        activeSubscriptions: usersData?.filter(u => u.subscription_active).length || 0,
        bannedUsers: bansData?.length || 0,
        totalTips: tipsData?.length || 0,
        freeTips: tipsData?.filter(t => t.category === 'free').length || 0,
        vipTips: tipsData?.filter(t => t.category === 'vip').length || 0,
        todayRevenue: 2847.50 // This would be calculated from actual payment data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSupabaseConfigured()) {
        if (editingTip) {
          const { error } = await supabase!
            .from('tips')
            .update(tipForm)
            .eq('id', editingTip.id);
          
          if (error) throw error;
          
          setTips(tips.map(t => t.id === editingTip.id ? { ...t, ...tipForm } : t));
        } else {
          const { data, error } = await supabase!
            .from('tips')
            .insert([{
              ...tipForm,
              created_by: user?.id
            }])
            .select()
            .single();
          
          if (error) throw error;
          
          setTips([data, ...tips]);
        }
      } else {
        // Demo mode
        const newTip: TipWithCategory = {
          id: Date.now().toString(),
          ...tipForm,
          is_active: true,
          created_at: new Date().toISOString(),
          created_by: user?.id || 'admin'
        };
        
        if (editingTip) {
          setTips(tips.map(t => t.id === editingTip.id ? { ...t, ...tipForm } : t));
        } else {
          setTips([newTip, ...tips]);
        }
      }
      
      setShowTipModal(false);
      setEditingTip(null);
      resetTipForm();
    } catch (error) {
      console.error('Error saving tip:', error);
    }
  };

  const resetTipForm = () => {
    setTipForm({
      title: '',
      content: '',
      category: 'free',
      sport: '',
      confidence_level: 'medium'
    });
  };

  const deleteTip = async (tipId: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('tips')
          .delete()
          .eq('id', tipId);
        
        if (error) throw error;
      }
      
      setTips(tips.filter(t => t.id !== tipId));
    } catch (error) {
      console.error('Error deleting tip:', error);
    }
  };

  const toggleTipStatus = async (tipId: string, currentStatus: boolean) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('tips')
          .update({ is_active: !currentStatus })
          .eq('id', tipId);
        
        if (error) throw error;
      }
      
      setTips(tips.map(t => t.id === tipId ? { ...t, is_active: !currentStatus } : t));
    } catch (error) {
      console.error('Error updating tip status:', error);
    }
  };

  const manageUserSubscription = async (userId: string, active: boolean, days: number = 30) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .rpc('admin_manage_subscription', {
            target_user_id: userId,
            set_active: active,
            days_duration: days
          });
        
        if (error) throw error;
      }
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        subscription_active: active,
        subscription_expires_at: active ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null
      } : u));
      
      setShowUserModal(false);
    } catch (error) {
      console.error('Error managing subscription:', error);
    }
  };

  const banUser = async (userId: string, reason: string, hours?: number) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .rpc('manage_user_ban', {
            target_user_id: userId,
            ban_reason: reason,
            ban_duration_hours: hours,
            unban: false
          });
        
        if (error) throw error;
      }
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        is_banned: true,
        ban_reason: reason,
        ban_expires_at: hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : undefined
      } : u));
      
      setShowUserModal(false);
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .rpc('manage_user_ban', {
            target_user_id: userId,
            unban: true
          });
        
        if (error) throw error;
      }
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        is_banned: false,
        ban_reason: undefined,
        ban_expires_at: undefined
      } : u));
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const openTipModal = (tip?: TipWithCategory) => {
    if (tip) {
      setEditingTip(tip);
      setTipForm({
        title: tip.title,
        content: tip.content,
        category: tip.category,
        sport: tip.sport || '',
        confidence_level: tip.confidence_level
      });
    } else {
      setEditingTip(null);
      resetTipForm();
    }
    setShowTipModal(true);
  };

  const openUserModal = (userData: UserWithBan) => {
    setSelectedUser(userData);
    setShowUserModal(true);
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Hozzáférés megtagadva</h2>
          <p className="text-gray-400">Nincs admin jogosultságod a panel eléréséhez.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                <p className="text-gray-400 mt-1">Teljes rendszer irányítás</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                🔑 Super Admin
              </div>
              <div className="text-gray-400 text-sm">
                Bejelentkezve: {user.email}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Összes Felhasználó</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Aktív Előfizetők</p>
                <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Összes Tipp</p>
                <p className="text-2xl font-bold text-white">{stats.totalTips}</p>
                <p className="text-gray-500 text-xs">Ingyenes: {stats.freeTips} | VIP: {stats.vipTips}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <Euro className="h-8 w-8 text-purple-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Mai Bevétel</p>
                <p className="text-2xl font-bold text-white">€{stats.todayRevenue}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-1 mb-8 border border-gray-700 inline-flex"
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Áttekintés</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Felhasználók</span>
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'tips'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>Tippek</span>
          </button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Recent Activities */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Mai Aktivitások</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300">Új felhasználó regisztrált</span>
                    </div>
                    <span className="text-gray-400 text-sm">2 órája</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-300">Új VIP előfizetés</span>
                    </div>
                    <span className="text-gray-400 text-sm">3 órája</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-gray-300">Ingyenes tipp publikálva</span>
                    </div>
                    <span className="text-gray-400 text-sm">5 órája</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Gyors Műveletek</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => openTipModal()}
                      className="w-full flex items-center space-x-3 p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Új Tipp Hozzáadása</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full flex items-center space-x-3 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span>Felhasználók Kezelése</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Rendszer Állapot</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Szerver Állapot</span>
                      <span className="text-green-400 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Supabase</span>
                      <span className={`flex items-center space-x-1 ${isSupabaseConfigured() ? 'text-green-400' : 'text-orange-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                        <span>{isSupabaseConfigured() ? 'Csatlakozva' : 'Demo Mód'}</span>
                      </span>
                    </div>
                  </div>
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
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Felhasználó Kezelés</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Felhasználó
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Előfizetés
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Állapot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Regisztrált
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Műveletek
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((userData) => (
                      <tr key={userData.id} className={`hover:bg-gray-700/50 ${userData.is_banned ? 'bg-red-900/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {userData.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">{userData.email}</div>
                            {userData.is_banned && (
                              <div className="text-xs text-red-400 mt-1">
                                🚫 Letiltva: {userData.ban_reason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userData.subscription_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userData.subscription_active ? 'Aktív' : 'Inaktív'}
                          </span>
                          {userData.subscription_expires_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              Lejár: {new Date(userData.subscription_expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userData.is_banned ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Letiltva</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Aktív</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openUserModal(userData)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium mr-2 transition-colors"
                          >
                            Kezelés
                          </button>
                          {userData.is_banned ? (
                            <button
                              onClick={() => unbanUser(userData.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Feloldás
                            </button>
                          ) : (
                            <button
                              onClick={() => banUser(userData.id, 'Admin döntés')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Tiltás
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              key="tips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Tipp Kezelés</h3>
                <div className="flex space-x-4">
                  <div className="text-sm text-gray-400">
                    Ingyenes: {tips.filter(t => t.category === 'free' && t.is_active).length} |
                    VIP: {tips.filter(t => t.category === 'vip' && t.is_active).length}
                  </div>
                  <button
                    onClick={() => openTipModal()}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Új Tipp</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {tips.map((tip) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-800 rounded-xl p-6 border ${
                      tip.category === 'vip' ? 'border-yellow-500/50' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">{tip.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tip.category === 'vip' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {tip.category === 'vip' ? '👑 VIP' : '🆓 INGYENES'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            tip.confidence_level === 'high' ? 'bg-green-500/20 text-green-400' :
                            tip.confidence_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {tip.confidence_level.toUpperCase()}
                          </span>
                        </div>
                        {tip.sport && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
                            {tip.sport}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleTipStatus(tip.id, tip.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            tip.is_active
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openTipModal(tip)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTip(tip.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{tip.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip Modal */}
        <AnimatePresence>
          {showTipModal && (
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
                className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {editingTip ? 'Tipp Szerkesztése' : 'Új Tipp Hozzáadása'}
                  </h3>
                  <button
                    onClick={() => setShowTipModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleTipSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategória *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setTipForm({ ...tipForm, category: 'free' })}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          tipForm.category === 'free'
                            ? 'border-green-500 bg-green-500/10 text-green-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">🆓</div>
                          <div className="font-medium">INGYENES</div>
                          <div className="text-xs mt-1">Napi 1 tipp</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipForm({ ...tipForm, category: 'vip' })}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          tipForm.category === 'vip'
                            ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">👑</div>
                          <div className="font-medium">VIP</div>
                          <div className="text-xs mt-1">Több napi tipp</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cím *
                    </label>
                    <input
                      type="text"
                      value={tipForm.title}
                      onChange={(e) => setTipForm({ ...tipForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Tipp címe..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sport
                    </label>
                    <input
                      type="text"
                      value={tipForm.sport}
                      onChange={(e) => setTipForm({ ...tipForm, sport: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="pl. NBA, NFL, Labdarúgás"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Megbízhatóság
                    </label>
                    <select
                      value={tipForm.confidence_level}
                      onChange={(e) => setTipForm({ ...tipForm, confidence_level: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="low">Alacsony</option>
                      <option value="medium">Közepes</option>
                      <option value="high">Magas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tartalom *
                    </label>
                    <textarea
                      value={tipForm.content}
                      onChange={(e) => setTipForm({ ...tipForm, content: e.target.value })}
                      className="w-full h-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                      placeholder="Részletes tipp tartalom..."
                      required
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingTip ? 'Mentés' : 'Létrehozás'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTipModal(false)}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Mégse
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Management Modal */}
        <AnimatePresence>
          {showUserModal && selectedUser && (
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
                className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Felhasználó Kezelése
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">{selectedUser.full_name}</h4>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">Előfizetés Állapot</span>
                      <span className={selectedUser.subscription_active ? 'text-green-400' : 'text-red-400'}>
                        {selectedUser.subscription_active ? 'Aktív' : 'Inaktív'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => manageUserSubscription(selectedUser.id, true, 30)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        30 Nap Premium
                      </button>
                      <button
                        onClick={() => manageUserSubscription(selectedUser.id, true, 365)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        1 Év Premium
                      </button>
                    </div>

                    <button
                      onClick={() => manageUserSubscription(selectedUser.id, false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Előfizetés Eltávolítása
                    </button>

                    <hr className="border-gray-600" />

                    {selectedUser.is_banned ? (
                      <button
                        onClick={() => {
                          unbanUser(selectedUser.id);
                          setShowUserModal(false);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Tiltás Feloldása</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          banUser(selectedUser.id, 'Admin döntés', 24);
                          setShowUserModal(false);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <UserX className="h-4 w-4" />
                        <span>Felhasználó Tiltása</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}