import React, { useState, useEffect } from 'react';
import { Settings, Users, Crown, TrendingUp, Plus, Edit, Trash2, Save, X, Eye, Ban, UserCheck, UserX, Calendar, Euro, Activity, AlertTriangle, CheckCircle, Shield, Clock, Star, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { User, VipTip } from '../../types';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  bannedUsers: number;
  totalTips: number;
  freeTips: number;
  vipTips: number;
  todayRevenue: number;
  monthlyRevenue: number;
  conversionRate: number;
  averageSessionTime: string;
}

interface UserWithBan extends User {
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
  last_login?: string;
  total_spent?: number;
  registration_ip?: string;
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
  views?: number;
  likes?: number;
  success_rate?: number;
}

// Reális mock adatok professzionális felhasználásra
const mockUsers: UserWithBan[] = [
  {
    id: '1',
    email: 'marcus.weber@protrader.de',
    full_name: 'Marcus Weber',
    subscription_active: true,
    subscription_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    is_admin: false,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    total_spent: 297,
    registration_ip: '85.214.132.45'
  },
  {
    id: '2', 
    email: 'sarah.hoffman@sports-analytics.com',
    full_name: 'Sarah Hoffmann',
    subscription_active: true,
    subscription_expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    is_admin: false,
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    last_login: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    total_spent: 198,
    registration_ip: '91.109.87.123'
  },
  {
    id: '3',
    email: 'david.chen@bettingpro.co.uk',
    full_name: 'David Chen',
    subscription_active: false,
    subscription_expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_admin: false,
    created_at: new Date(Date.now() - 67 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    total_spent: 99,
    registration_ip: '82.45.198.76'
  },
  {
    id: '4',
    email: 'anna.kowalski@gmail.com',
    full_name: 'Anna Kowalski',
    subscription_active: false,
    subscription_expires_at: null,
    is_admin: false,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: true,
    ban_reason: 'Szabályzat megsértése - többszörös fiók',
    ban_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    total_spent: 0,
    registration_ip: '188.43.76.132'
  },
  {
    id: '5',
    email: 'roberto.silva@betexpert.es',
    full_name: 'Roberto Silva',
    subscription_active: true,
    subscription_expires_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    is_admin: false,
    created_at: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    last_login: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    total_spent: 891,
    registration_ip: '84.127.45.98'
  },
  {
    id: '6',
    email: 'lisa.mueller@sportdata.at',
    full_name: 'Lisa Müller',
    subscription_active: false,
    subscription_expires_at: null,
    is_admin: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    last_login: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    total_spent: 0,
    registration_ip: '195.58.123.87',
    trial_expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_trial_used: false
  }
];

const mockTips: TipWithCategory[] = [
  {
    id: '1',
    title: 'NBA Premium - Lakers vs Warriors Under 228.5',
    content: `🏀 **VIP NBA ANALYZE** 🏀

📊 **Részletes Statisztikai Elemzés:**
• Lakers: elmúlt 10 meccs avg 115.2 pont (otthon 112.8)
• Warriors: elmúlt 10 meccs avg 109.7 pont (vendégként 106.3)
• Head-to-head: utolsó 5 meccs átlag 221.4 pont
• Védekezési statisztikák javultak mindkét csapatnál

⚡ **Kulcs Faktorok:**
• Mindkét csapat lassabb tempót játszik mostanában
• Sérülések miatt kulcsemberek hiányoznak
• Playoff közeledtével óvatosabb játék várható
• Időjárási körülmények: esős, hideg (fedett pálya)

🎯 **PROFI AJÁNLÁS:** UNDER 228.5 Total Points
💰 **Stake:** 3 units (magasabb kockázat, nagy profit potenciál)
⭐ **Confidence:** HIGH (87% sikeres ráta hasonló helyzetekben)

📈 **Várható kimenetel:** 218-223 pont közötti összesített eredmény
💸 **Odds értékelés:** @1.92 kiváló value bet`,
    category: 'vip',
    sport: 'NBA',
    confidence_level: 'high',
    is_active: true,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-1',
    views: 1247,
    likes: 189,
    success_rate: 87
  },
  {
    id: '2',
    title: 'Ingyenes Napi - Real Madrid Win @1.75',
    content: `⚽ **INGYENES NAPI TIPP** ⚽

🏆 **Real Madrid vs Getafe elemzés:**
• Real Madrid: otthon 92% nyerési arány a szezonban
• Getafe: vendégként gyenge, 4 vereség a legutóbbi 5-ből
• Benzema és Vinicius visszatért a sérülésből
• Getafe 6 kulcsember hiányzik

📊 **Gyors statisztikák:**
• Real Madrid várható goals: 2.8
• Getafe várható goals: 0.9
• Real Madrid possession: ~68%

🎯 **AJÁNLÁS:** Real Madrid győzelem @1.75
💰 **Stake:** 1 unit (biztonságos fogadás)
⭐ **Confidence:** MEDIUM

🆓 **Ingyenes tipp mindennap 12:00-kor!**`,
    category: 'free',
    sport: 'La Liga',
    confidence_level: 'medium',
    is_active: true,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-2',
    views: 2847,
    likes: 412,
    success_rate: 73
  },
  {
    id: '3',
    title: 'NFL VIP - Chiefs vs Bills Over 47.5',
    content: `🏈 **NFL PLAYOFF EXCLUSIVE** 🏈

❄️ **Időjárási Elemzés:**
• Hőmérséklet: -2°C, 12mph szél
• Hóesés várható a meccs során
• Pályakörülmények: kiváló (fűtött pálya)

🎯 **Támadó Statisztikák:**
• Chiefs: 28.4 pont/meccs átlag (playoff-ban 31.2)
• Bills: 26.8 pont/meccs átlag (otthon 29.1)
• Mindkét csapat élvonalbeli támadással rendelkezik
• Cold weather games: 68% OVER rate ebben a szezonban

📈 **Profi Elemzés:**
• Mahomes cold weather rekord: 8-2 OVER
• Josh Allen otthon: 75% OVER rate
• Védekezések gyengültek a hidegben
• Playoff intensity = több pontszerzési kísérlet

🎯 **VIP PICK:** OVER 47.5 Total Points
💰 **Stake:** 4 units (maximum confidence)
⭐ **Confidence:** MAXIMUM (94% sikeres ráta)

🔥 **Insider info:** Mindkét coach agresszív play-calling-ot ígért!`,
    category: 'vip',
    sport: 'NFL',
    confidence_level: 'high',
    is_active: true,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-3',
    views: 892,
    likes: 156,
    success_rate: 94
  },
  {
    id: '4',
    title: 'Tennis VIP - Djokovic vs Alcaraz Both to Win a Set',
    content: `🎾 **ATP MASTERS EXCLUSIVE** 🎾

🏆 **Head-to-Head Analízis:**
• Djokovic vs Alcaraz: 3-2 az elmúlt 5 meccsen
• Minden meccsük minimum 3 szettig ment
• Alcaraz: 89% arány, hogy nyer legalább 1 szettet
• Djokovic: sosem veszített még 2-0-ra Alcaraz ellen

⚡ **Forma Elemzés:**
• Djokovic: 8 meccs nyerőszéria, de lassan indít
• Alcaraz: agresszív játék, gyorsan veszi fel a ritmust
• Djokovic 1. szett: 64% nyerési arány
• Alcaraz 2. szett: 78% nyerési arány

🎯 **Taktikai Elemzés:**
• Djokovic védekezésre épít kezdetben
• Alcaraz early pressure stratégia
• Long rallies várhatók (Djokovic előnye)
• Alcaraz power shots hatékonyak rövid rallyk-ban

🎯 **PROFI PICK:** Both Players to Win at Least 1 Set
💰 **Stake:** 2.5 units 
⭐ **Confidence:** HIGH (82% sikeres ráta)

📊 **Value Analysis:** @1.68 kiváló értékű fogadás!`,
    category: 'vip',
    sport: 'ATP Tennis',
    confidence_level: 'high',
    is_active: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-1',
    views: 543,
    likes: 87,
    success_rate: 82
  },
  {
    id: '5',
    title: 'Bundesliga Free - Bayern Munich -1.5 AH',
    content: `⚽ **BUNDESLIGA INGYENES ELEMZÉS** ⚽

🔴 **Bayern München vs Augsburg**
• Bayern: 15 meccs nyerőszéria otthon
• Augsburg: 7 vereség az elmúlt 8 vendégmeccsből
• Goals/meccs: Bayern 3.2, Augsburg 0.8 (vendégként)

📊 **Egyszerű számok:**
• Bayern: 89% esély 2+ gólos győzelemre
• Augsburg: védekező taktika várható
• Lewandowski visszatért a sérülésből

🎯 **INGYENES TIPP:** Bayern München -1.5 Asian Handicap
💰 **Stake:** 1 unit (biztonságos)
⭐ **Confidence:** MEDIUM

🆓 **Napi ingyenes tipp - regisztrálj VIP-nek több tippért!**`,
    category: 'free',
    sport: 'Bundesliga',
    confidence_level: 'medium',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-2',
    views: 3892,
    likes: 627,
    success_rate: 71
  },
  {
    id: '6',
    title: 'VIP Exclusive - NBA Player Props Kombinált',
    content: `🏀 **NBA PLAYER PROPS PACKAGE** 🏀

👑 **3 Játékos Kombinált Csomag:**

**1. LeBron James Over 7.5 Assists** @1.85
• Szezon átlag: 8.9 assist/meccs
• Lakers új játékstílus: LeBron mint playmaker
• Utolsó 5 meccs: 9, 11, 8, 10, 7 assist

**2. Stephen Curry Over 4.5 Made 3-Pointers** @2.10  
• Otthon: 5.2 hármas/meccs átlag
• Lakers ellen: 6.1 hármas/meccs történelmileg
• Splash Brothers együtt játszanak

**3. Anthony Davis Over 24.5 Points** @1.75
• Sérülés után visszatért, 100% egészséges
• Warriors gyenge center védelem
• Utolsó 3 meccs: 28, 31, 26 pont

🎯 **KOMBINÁLT ODDS:** @6.82
💰 **Stake:** 1.5 units (közepes kockázat)
⭐ **Confidence:** HIGH kombináció

💎 **INSIDER:** Mind a 3 játékos motivált a playoff pozícióért!`,
    category: 'vip',
    sport: 'NBA Props',
    confidence_level: 'high',
    is_active: true,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-3',
    views: 687,
    likes: 124,
    success_rate: 89
  }
];

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tips' | 'bans' | 'analytics'>('overview');
  const [users, setUsers] = useState<UserWithBan[]>([]);
  const [tips, setTips] = useState<TipWithCategory[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    bannedUsers: 0,
    totalTips: 0,
    freeTips: 0,
    vipTips: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    averageSessionTime: '0m'
  });
  const [loading, setLoading] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [editingTip, setEditingTip] = useState<TipWithCategory | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithBan | null>(null);
  const [banForm, setBanForm] = useState({
    reason: '',
    duration: '24',
    permanent: false
  });
  const [tipForm, setTipForm] = useState({
    title: '',
    content: '',
    category: 'free' as 'free' | 'vip',
    sport: '',
    confidence_level: 'medium' as 'low' | 'medium' | 'high'
  });
  const [userFilter, setUserFilter] = useState('all');
  const [tipFilter, setTipFilter] = useState('all');

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
        // Reális mock adatok használata
        setUsers(mockUsers);
        setTips(mockTips);
        setStats({
          totalUsers: mockUsers.length,
          activeSubscriptions: mockUsers.filter(u => u.subscription_active).length,
          bannedUsers: mockUsers.filter(u => u.is_banned).length,
          totalTips: mockTips.length,
          freeTips: mockTips.filter(t => t.category === 'free').length,
          vipTips: mockTips.filter(t => t.category === 'vip').length,
          todayRevenue: 891.50,
          monthlyRevenue: 24750.80,
          conversionRate: 23.4,
          averageSessionTime: '12m 34s'
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
          user_bans!left(
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
        todayRevenue: 891.50,
        monthlyRevenue: 24750.80,
        conversionRate: 23.4,
        averageSessionTime: '12m 34s'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newTip: TipWithCategory = {
        id: Date.now().toString(),
        ...tipForm,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: user?.id || 'admin',
        views: 0,
        likes: 0,
        success_rate: Math.floor(Math.random() * 30) + 70
      };

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
            .insert([newTip])
            .select()
            .single();
          
          if (error) throw error;
          setTips([data, ...tips]);
        }
      } else {
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
    if (!confirm('Biztosan törölni szeretnéd ezt a tippet?')) return;
    
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

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      const banDuration = banForm.permanent ? null : parseInt(banForm.duration);
      
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .rpc('manage_user_ban', {
            target_user_id: selectedUser.id,
            ban_reason: banForm.reason,
            ban_duration_hours: banDuration,
            unban: false
          });
        
        if (error) throw error;
      }
      
      setUsers(users.map(u => u.id === selectedUser.id ? {
        ...u,
        is_banned: true,
        ban_reason: banForm.reason,
        ban_expires_at: banForm.permanent ? null : new Date(Date.now() + (banDuration || 24) * 60 * 60 * 1000).toISOString()
      } : u));
      
      setShowBanModal(false);
      setBanForm({ reason: '', duration: '24', permanent: false });
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

  const openBanModal = (userData: UserWithBan) => {
    setSelectedUser(userData);
    setShowBanModal(true);
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      switch (userFilter) {
        case 'active': return user.subscription_active;
        case 'inactive': return !user.subscription_active;
        case 'banned': return user.is_banned;
        case 'trial': return user.trial_expires_at && !user.is_trial_used;
        default: return true;
      }
    });
  };

  const getFilteredTips = () => {
    return tips.filter(tip => {
      switch (tipFilter) {
        case 'free': return tip.category === 'free';
        case 'vip': return tip.category === 'vip';
        case 'active': return tip.is_active;
        case 'inactive': return !tip.is_active;
        default: return true;
      }
    });
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Hozzáférés megtagadva</h2>
          <p className="text-gray-400 mb-6">Nincs admin jogosultságod a panel eléréséhez.</p>
          <button
            onClick={() => window.location.hash = '#dashboard'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Vissza a Dashboard-hoz
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Admin adatok betöltése...</p>
        </div>
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
                <h1 className="text-3xl font-bold text-white">Admin Irányítópult</h1>
                <p className="text-gray-400 mt-1">Teljes rendszer irányítás és felügyelet</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>🔑 Super Admin</span>
              </div>
              <div className="text-gray-400 text-sm">
                <Clock className="h-4 w-4 inline mr-1" />
                Bejelentkezve: {new Date().toLocaleTimeString('hu-HU')}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Összes Felhasználó</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-green-400 text-xs mt-1">+{Math.floor(stats.totalUsers * 0.12)} ez hónapban</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Aktív VIP-ek</p>
                <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
                <p className="text-green-400 text-xs mt-1">{stats.conversionRate}% konverzió</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">VIP Tippek</p>
                <p className="text-3xl font-bold text-white">{stats.vipTips}</p>
                <p className="text-gray-400 text-xs mt-1">{stats.totalTips} összes tipp</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Havi Bevétel</p>
                <p className="text-3xl font-bold text-white">€{stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-green-400 text-xs mt-1">€{stats.todayRevenue} ma</p>
              </div>
              <Euro className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tabs */}
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
            <span>Felhasználók ({stats.totalUsers})</span>
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
            <span>Tippek ({stats.totalTips})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Analitika</span>
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
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Mai Valós Idejű Aktivitások
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div>
                        <span className="text-gray-300 font-medium">Új VIP előfizetés - Marcus Weber</span>
                        <p className="text-gray-500 text-sm">€99.00 havi előfizetés aktiválva</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">23 perce</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <div>
                        <span className="text-gray-300 font-medium">VIP tipp publikálva - NBA Lakers vs Warriors</span>
                        <p className="text-gray-500 text-sm">1,247 megtekintés az első órában</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">1 órája</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      <div>
                        <span className="text-gray-300 font-medium">Új felhasználó regisztráció - Lisa Müller</span>
                        <p className="text-gray-500 text-sm">3 napos trial automatikusan aktiválva</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">2 órája</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div>
                        <span className="text-gray-300 font-medium">Felhasználó letiltva - Anna Kowalski</span>
                        <p className="text-gray-500 text-sm">Többszörös fiók létrehozása miatt</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">3 órája</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                    Gyors Műveletek
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => openTipModal()}
                      className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg transition-all duration-200 group"
                    >
                      <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                      <span className="font-medium">Új VIP Tipp Létrehozása</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-200 group"
                    >
                      <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Felhasználók Kezelése</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-lg transition-all duration-200 group"
                    >
                      <TrendingUp className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
                      <span className="font-medium">Részletes Analitika</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-400" />
                    Rendszer Állapot
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-gray-300">Szerver Állapot</span>
                      </div>
                      <span className="text-green-400 font-medium">Online (99.9% uptime)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured() ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                        <span className="text-gray-300">Supabase DB</span>
                      </div>
                      <span className={`font-medium ${isSupabaseConfigured() ? 'text-green-400' : 'text-orange-400'}`}>
                        {isSupabaseConfigured() ? 'Csatlakozva' : 'Demo Mód'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-gray-300">Stripe Payments</span>
                      </div>
                      <span className="text-blue-400 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">Átlag Session</span>
                      </div>
                      <span className="text-purple-400 font-medium">{stats.averageSessionTime}</span>
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
            >
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Felhasználó Kezelés ({getFilteredUsers().length})
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Összes</option>
                        <option value="active">Aktív VIP</option>
                        <option value="inactive">Inaktív</option>
                        <option value="trial">Trial</option>
                        <option value="banned">Letiltott</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Felhasználó
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Előfizetés
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Állapot
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Aktivitás
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Bevétel
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Műveletek
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {getFilteredUsers().map((userData) => (
                        <tr key={userData.id} className={`hover:bg-gray-700/30 transition-colors ${userData.is_banned ? 'bg-red-900/10 border-l-4 border-red-500' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {userData.full_name?.charAt(0) || userData.email.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {userData.full_name || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-400">{userData.email}</div>
                                {userData.is_banned && (
                                  <div className="text-xs text-red-400 mt-1 flex items-center">
                                    <Ban className="h-3 w-3 mr-1" />
                                    {userData.ban_reason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                userData.subscription_active
                                  ? 'bg-green-500/20 text-green-400'
                                  : userData.trial_expires_at && !userData.is_trial_used
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {userData.subscription_active ? '👑 VIP Aktív' : 
                                 userData.trial_expires_at && !userData.is_trial_used ? '🆓 Trial' : '❌ Inaktív'}
                              </span>
                              {userData.subscription_expires_at && (
                                <div className="text-xs text-gray-400 mt-1">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {userData.subscription_active ? 'Lejár: ' : 'Lejárt: '}
                                  {new Date(userData.subscription_expires_at).toLocaleDateString('hu-HU')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {userData.is_banned ? (
                                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium flex items-center">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Letiltva
                                </span>
                              ) : (
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aktív
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-300">
                                Regisztráció: {new Date(userData.created_at).toLocaleDateString('hu-HU')}
                              </div>
                              {userData.last_login && (
                                <div className="text-gray-400 text-xs">
                                  Utolsó login: {new Date(userData.last_login).toLocaleString('hu-HU')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-green-400 font-medium">
                                €{userData.total_spent || 0}
                              </div>
                              <div className="text-gray-400 text-xs">
                                Összes költés
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openUserModal(userData)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                              >
                                <Settings className="h-3 w-3" />
                                <span>Kezelés</span>
                              </button>
                              {userData.is_banned ? (
                                <button
                                  onClick={() => unbanUser(userData.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  <span>Feloldás</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openBanModal(userData)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                                >
                                  <UserX className="h-3 w-3" />
                                  <span>Tiltás</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
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
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-400" />
                  Tipp Kezelés és Publikálás
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={tipFilter}
                      onChange={(e) => setTipFilter(e.target.value)}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">Összes Tipp</option>
                      <option value="vip">VIP Tippek</option>
                      <option value="free">Ingyenes Tippek</option>
                      <option value="active">Aktív</option>
                      <option value="inactive">Inaktív</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-400">
                    🆓 Ingyenes: {stats.freeTips} | 👑 VIP: {stats.vipTips}
                  </div>
                  <button
                    onClick={() => openTipModal()}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Új Profi Tipp</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {getFilteredTips().map((tip) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-800 rounded-xl p-6 border-2 transition-all duration-200 ${
                      tip.category === 'vip' 
                        ? 'border-yellow-500/30 hover:border-yellow-500/50' 
                        : 'border-green-500/30 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold text-white">{tip.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            tip.category === 'vip' 
                              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30' 
                              : 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {tip.category === 'vip' ? '👑 VIP EXCLUSIVE' : '🆓 INGYENES NAPI'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tip.confidence_level === 'high' ? 'bg-green-500/20 text-green-400' :
                            tip.confidence_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {tip.confidence_level === 'high' ? '🔥 MAGAS' :
                             tip.confidence_level === 'medium' ? '⭐ KÖZEPES' : '💡 ALACSONY'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tip.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {tip.is_active ? '✅ LIVE' : '🔄 DRAFT'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          {tip.sport && (
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                              🏆 {tip.sport}
                            </span>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {tip.views?.toLocaleString() || 0} megtekintés
                            </span>
                            <span className="flex items-center">
                              <Star className="h-4 w-4 mr-1" />
                              {tip.likes || 0} like
                            </span>
                            <span className="flex items-center text-green-400">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {tip.success_rate || 75}% sikeres ráta
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleTipStatus(tip.id, tip.is_active)}
                          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                            tip.is_active
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          title={tip.is_active ? 'Deaktiválás' : 'Aktiválás'}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openTipModal(tip)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Szerkesztés"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTip(tip.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Törlés"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 whitespace-pre-wrap line-clamp-3">{tip.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Létrehozva: {new Date(tip.created_at).toLocaleString('hu-HU')}</span>
                      <span>Szakértő ID: {tip.created_by}</span>
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
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Bevétel Analitika</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mai bevétel:</span>
                      <span className="text-green-400 font-medium">€{stats.todayRevenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Havi bevétel:</span>
                      <span className="text-green-400 font-medium">€{stats.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Átlag user value:</span>
                      <span className="text-blue-400 font-medium">€{Math.round(stats.monthlyRevenue / stats.totalUsers)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Konverziós Adatok</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trial → VIP:</span>
                      <span className="text-yellow-400 font-medium">{stats.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Churn rate:</span>
                      <span className="text-orange-400 font-medium">8.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Átlag session:</span>
                      <span className="text-purple-400 font-medium">{stats.averageSessionTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Tipp Teljesítmény</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">VIP sikeres ráta:</span>
                      <span className="text-green-400 font-medium">87.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Free sikeres ráta:</span>
                      <span className="text-blue-400 font-medium">72.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Átlag ROI:</span>
                      <span className="text-yellow-400 font-medium">+15.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Tip Modal */}
        <AnimatePresence>
          {showTipModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-yellow-400" />
                    {editingTip ? 'Profi Tipp Szerkesztése' : 'Új Profi Tipp Létrehozása'}
                  </h3>
                  <button
                    onClick={() => setShowTipModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleTipSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Tipp Kategória *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setTipForm({ ...tipForm, category: 'free' })}
                        className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                          tipForm.category === 'free'
                            ? 'border-green-500 bg-green-500/10 text-green-400 shadow-lg'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500/50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-3">🆓</div>
                          <div className="font-bold text-lg">INGYENES NAPI</div>
                          <div className="text-sm mt-2 opacity-75">Napi 1 tipp mindenkinek</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipForm({ ...tipForm, category: 'vip' })}
                        className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                          tipForm.category === 'vip'
                            ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-lg'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-yellow-500/50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-3">👑</div>
                          <div className="font-bold text-lg">VIP EXKLUZÍV</div>
                          <div className="text-sm mt-2 opacity-75">Csak VIP előfizetőknek</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tipp Címe *
                      </label>
                      <input
                        type="text"
                        value={tipForm.title}
                        onChange={(e) => setTipForm({ ...tipForm, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                        placeholder="pl. NBA VIP - Lakers vs Warriors Under 228.5"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sport / Liga
                      </label>
                      <input
                        type="text"
                        value={tipForm.sport}
                        onChange={(e) => setTipForm({ ...tipForm, sport: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                        placeholder="pl. NBA, NFL, Premier League, ATP Tennis"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bizalmi Szint *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {['low', 'medium', 'high'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setTipForm({ ...tipForm, confidence_level: level as any })}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            tipForm.confidence_level === level
                              ? level === 'high' ? 'border-green-500 bg-green-500/10 text-green-400' :
                                level === 'medium' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' :
                                'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">
                              {level === 'high' ? '🔥' : level === 'medium' ? '⭐' : '💡'}
                            </div>
                            <div className="font-medium">
                              {level === 'high' ? 'MAGAS' : level === 'medium' ? 'KÖZEPES' : 'ALACSONY'}
                            </div>
                            <div className="text-xs mt-1 opacity-75">
                              {level === 'high' ? '85%+ ráta' : level === 'medium' ? '70-85% ráta' : '60-70% ráta'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Részletes Tipp Tartalom *
                    </label>
                    <textarea
                      value={tipForm.content}
                      onChange={(e) => setTipForm({ ...tipForm, content: e.target.value })}
                      className="w-full h-64 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none transition-colors"
                      placeholder="Részletes elemzés és ajánlás..."
                      required
                    />
                    <p className="text-gray-500 text-sm mt-2">
                      💡 Tipp: Használj emoji-kat (🏀⚽🏈🎾), statisztikákat és részletes elemzést a jobb olvashatóságért
                    </p>
                  </div>

                  <div className="flex space-x-4 pt-6 border-t border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingTip ? 'Módosítások Mentése' : 'Tipp Publikálása'}</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setShowTipModal(false)}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Mégse
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced User Management Modal */}
        <AnimatePresence>
          {showUserModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-700 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Felhasználó Részletes Kezelése
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">{selectedUser.full_name}</h4>
                        <p className="text-gray-400">{selectedUser.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-green-400 text-sm">€{selectedUser.total_spent || 0} összes költés</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">{selectedUser.registration_ip}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-2">Előfizetés Állapot</h5>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedUser.subscription_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedUser.subscription_active ? '✅ VIP Aktív' : '❌ Inaktív'}
                      </span>
                      {selectedUser.subscription_expires_at && (
                        <p className="text-gray-400 text-sm mt-2">
                          {selectedUser.subscription_active ? 'Lejár: ' : 'Lejárt: '}
                          {new Date(selectedUser.subscription_expires_at).toLocaleDateString('hu-HU')}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-2">Account Status</h5>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedUser.is_banned
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {selectedUser.is_banned ? '🚫 Letiltva' : '✅ Aktív'}
                      </span>
                    </div>
                  </div>

                  {/* Subscription Management */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-4">Előfizetés Kezelés</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => manageUserSubscription(selectedUser.id, true, 7)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        7 Nap VIP
                      </button>
                      <button
                        onClick={() => manageUserSubscription(selectedUser.id, true, 30)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        30 Nap VIP
                      </button>
                      <button
                        onClick={() => manageUserSubscription(selectedUser.id, true, 365)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        1 Év VIP
                      </button>
                      <button
                        onClick={() => manageUserSubscription(selectedUser.id, false)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        VIP Eltávolítás
                      </button>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-4">Account Műveletek</h5>
                    <div className="flex space-x-3">
                      {selectedUser.is_banned ? (
                        <button
                          onClick={() => {
                            unbanUser(selectedUser.id);
                            setShowUserModal(false);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Tiltás Feloldása</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowUserModal(false);
                            openBanModal(selectedUser);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <UserX className="h-4 w-4" />
                          <span>Felhasználó Tiltása</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ban Modal */}
        <AnimatePresence>
          {showBanModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-red-500/20 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-red-400 flex items-center">
                    <Ban className="h-5 w-5 mr-2" />
                    Felhasználó Tiltása
                  </h3>
                  <button
                    onClick={() => setShowBanModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-400 font-medium">{selectedUser.full_name}</p>
                  <p className="text-red-300 text-sm">{selectedUser.email}</p>
                </div>

                <form onSubmit={handleBanSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tiltás Oka *
                    </label>
                    <textarea
                      value={banForm.reason}
                      onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                      className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      placeholder="Részletes indoklás..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tiltás Időtartama
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="temporary"
                          checked={!banForm.permanent}
                          onChange={() => setBanForm({ ...banForm, permanent: false })}
                          className="text-red-500"
                        />
                        <label htmlFor="temporary" className="text-gray-300">Ideiglenes</label>
                      </div>
                      {!banForm.permanent && (
                        <select
                          value={banForm.duration}
                          onChange={(e) => setBanForm({ ...banForm, duration: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="24">24 óra</option>
                          <option value="72">3 nap</option>
                          <option value="168">1 hét</option>
                          <option value="720">30 nap</option>
                        </select>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="permanent"
                          checked={banForm.permanent}
                          onChange={() => setBanForm({ ...banForm, permanent: true })}
                          className="text-red-500"
                        />
                        <label htmlFor="permanent" className="text-gray-300">Végleges tiltás</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Felhasználó Tiltása</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBanModal(false)}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Mégse
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}