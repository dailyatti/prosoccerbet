import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Clock, User, Star, Filter, Calendar, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { VipTip } from '../../types';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return url.includes('.supabase.co') && key.length > 50;
};

// Mock VIP tips data for demo when Supabase isn't configured
const mockTips: VipTip[] = [
  {
    id: '1',
    title: 'Lakers vs Warriors - Over 225.5 Points',
    content: `🏀 **NBA PREMIUM PICK** 🏀

📊 **Analysis:**
• Lakers averaging 118.5 PPG over last 10 games
• Warriors defense allowing 112.3 PPG this season
• Both teams playing fast-paced offense
• Historical matchups average 230+ points

🎯 **Recommendation:** OVER 225.5 Total Points
💰 **Stake:** 3 units
⭐ **Confidence:** HIGH

🔥 This is a lock! Both teams love to run and gun. Expect a high-scoring affair in Los Angeles tonight.`,
    sport: 'NBA',
    confidence_level: 'high' as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-1',
    is_active: true
  },
  {
    id: '2', 
    title: 'Chiefs vs Bills - Under 47.5 Points',
    content: `🏈 **NFL PLAYOFF SPECIAL** 🏈

📊 **Weather Report:**
• Temperature: 15°F with 20mph winds
• Snow expected during game time
• Field conditions will be challenging

🎯 **Key Factors:**
• Both teams have elite defenses
• Cold weather games tend to go UNDER
• Playoff football = conservative play calling
• Kicking conditions will be difficult

💡 **Pick:** UNDER 47.5 Total Points
💰 **Stake:** 2 units
⭐ **Confidence:** MEDIUM

❄️ Mother Nature is our 12th man tonight. Expect a defensive battle in brutal conditions.`,
    sport: 'NFL',
    confidence_level: 'medium' as const,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-2',
    is_active: true
  },
  {
    id: '3',
    title: 'Manchester City vs Liverpool - Both Teams to Score',
    content: `⚽ **PREMIER LEAGUE DERBY** ⚽

🏆 **Match Analysis:**
• City's attack vs Liverpool's high line = goals
• Liverpool's front three in excellent form
• Both teams need 3 points for title race
• Historical H2H: 8/10 games had BTTS

📈 **Statistics:**
• Man City: 85% BTTS rate at home
• Liverpool: 78% BTTS rate in big games
• Combined xG average: 3.2 goals per game

🎯 **Bet:** Both Teams to Score - YES
💰 **Stake:** 2.5 units  
⭐ **Confidence:** HIGH

🔥 Two of the best attacks in world football. Goals are guaranteed at the Etihad!`,
    sport: 'Premier League',
    confidence_level: 'high' as const,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    created_by: 'expert-3',
    is_active: true
  }
];
export function VipTips() {
  const { user } = useAuth();
  const [tips, setTips] = useState<VipTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedConfidence, setSelectedConfidence] = useState('all');

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('vip_tips')
          .select(`
            *,
            users:created_by (
              full_name,
              email
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTips(data || []);
      } else {
        // Use mock data when Supabase isn't configured
        setTips(mockTips);
      }
    } catch (error) {
      console.error('Error fetching tips, using demo data:', error);
      // Fallback to mock data on any error
      setTips(mockTips);
    } finally {
      setLoading(false);
    }
  };

  const filteredTips = tips.filter(tip => {
    const matchesSport = selectedSport === 'all' || tip.sport === selectedSport;
    const matchesConfidence = selectedConfidence === 'all' || tip.confidence_level === selectedConfidence;
    return matchesSport && matchesConfidence;
  });

  const sports = [...new Set(tips.map(tip => tip.sport).filter(Boolean))];

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return '🔥';
      case 'medium': return '⭐';
      case 'low': return '💡';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">VIP Tips</h1>
              <p className="text-gray-400 mt-1">Exclusive betting tips and professional insights</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Total Tips</p>
                <p className="text-2xl font-bold text-white">{tips.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">High Confidence</p>
                <p className="text-2xl font-bold text-white">
                  {tips.filter(tip => tip.confidence_level === 'high').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Sports Covered</p>
                <p className="text-2xl font-bold text-white">{sports.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Filters:</span>
            </div>
            
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Sports</option>
              {sports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
            
            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Confidence Levels</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
          </div>
        </motion.div>

        {/* Tips List */}
        <AnimatePresence>
          {filteredTips.length > 0 ? (
            <div className="space-y-6">
              {filteredTips.map((tip, index) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">{getConfidenceIcon(tip.confidence_level)}</span>
                        <h3 className="text-xl font-bold text-white">{tip.title}</h3>
                        <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(tip.confidence_level)}`}>
                          {tip.confidence_level.toUpperCase()}
                        </span>
                      </div>
                      
                      {tip.sport && (
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                            {tip.sport}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end text-right mt-4 lg:mt-0">
                      <div className="flex items-center text-gray-400 text-sm mb-2">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(tip.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <User className="h-4 w-4 mr-2" />
                        Expert Analyst
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {tip.content}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (tip.confidence_level === 'high' ? 5 : tip.confidence_level === 'medium' ? 3 : 2)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">
                          Confidence Rating
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <Crown className="h-4 w-4" />
                          <span>VIP Tip</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Crown className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No VIP Tips Available</h3>
              <p className="text-gray-500">
                {selectedSport !== 'all' || selectedConfidence !== 'all'
                  ? 'Try adjusting your filters to see more tips.'
                  : 'Check back later for exclusive betting insights from our experts.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subscription CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-8 border border-yellow-500/20 text-center"
        >
          <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Premium VIP Access</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Get exclusive access to our highest confidence tips, detailed analysis, 
            and insider insights from professional betting experts.
          </p>
          <div className="flex items-center justify-center space-x-2 text-green-400 mb-6">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Active Subscription
            </span>
            <span>You have full access to all VIP content</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}