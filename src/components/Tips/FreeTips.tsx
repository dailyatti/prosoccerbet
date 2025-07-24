import React, { useState, useEffect } from 'react';
import { Gift, TrendingUp, Clock, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface FreeTip {
  id: string;
  title: string;
  content: string;
  sport?: string;
  confidence_level: 'low' | 'medium' | 'high';
  created_at: string;
  is_active: boolean;
}

// Mock free tips data
const mockFreeTips: FreeTip[] = [
  {
    id: '1',
    title: 'Mai INGYENES Tipp - Lakers vs Warriors',
    content: `🏀 **NAPI INGYENES TIPP** 🏀

📊 **Gyors Elemzés:**
• Lakers: otthon erős játék, 78% nyerési arány
• Warriors: vendégként gyengébb, sérültek a keretben  
• Historikus adatok: Lakers 6/8 győzelem otthon

🎯 **Ajánlás:** Lakers győzelem @1.85
💰 **Egység:** 1 unit (biztonságos)
⭐ **Bizalom:** KÖZEPES

💡 **Ingyenes tipp minden nap 12:00-kor!**
🔥 **VIP előfizetőknek 5-8 tipp naponta!**`,
    sport: 'NBA',
    confidence_level: 'medium',
    created_at: new Date().toISOString(),
    is_active: true
  }
];

export function FreeTips() {
  const [tips, setTips] = useState<FreeTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextTipTime, setNextTipTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchFreeTips();
    
    // Set next tip time to tomorrow at 12:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    setNextTipTime(tomorrow);
  }, []);

  const fetchFreeTips = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase!
          .from('tips')
          .select('*')
          .eq('category', 'free')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1); // Only show today's free tip

        if (error) throw error;
        setTips(data || []);
      } else {
        setTips(mockFreeTips);
      }
    } catch (error) {
      console.error('Error fetching free tips:', error);
      setTips(mockFreeTips);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Ingyenes Napi Tippek</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Minden nap 12:00-kor egy ingyenes profi tipp! Regisztrálj a VIP előfizetésre több exkluzív tippért.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
            <Calendar className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">1</div>
            <div className="text-gray-400 text-sm">Napi Ingyenes Tipp</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
            <Clock className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">12:00</div>
            <div className="text-gray-400 text-sm">Publikálási Idő</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
            <Star className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">78%</div>
            <div className="text-gray-400 text-sm">Sikeres Tippek</div>
          </div>
        </motion.div>

        {/* Today's Free Tip */}
        <AnimatePresence>
          {tips.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              {tips.map((tip) => (
                <div key={tip.id} className="bg-gray-800 rounded-xl p-8 border border-green-500/50 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                        🆓 INGYENES TIPP
                      </div>
                      {tip.sport && (
                        <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                          {tip.sport}
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(tip.confidence_level)}`}>
                        {tip.confidence_level === 'high' ? 'MAGAS' : 
                         tip.confidence_level === 'medium' ? 'KÖZEPES' : 'ALACSONY'} BIZALOM
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(tip.created_at).toLocaleDateString('hu-HU', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-6">{tip.title}</h2>
                  
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
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
                              className={`h-5 w-5 ${
                                i < (tip.confidence_level === 'high' ? 5 : tip.confidence_level === 'medium' ? 3 : 2)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400">Profi Értékelés</span>
                      </div>
                      
                      <div className="text-gray-400 text-sm">
                        👁️ Mai nézettség: 1,247
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 mb-8"
            >
              <Gift className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Mai Tipp Még Nem Elérhető</h3>
              <p className="text-gray-500">A mai ingyenes tipp 12:00-kor lesz publikálva.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Tip Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-8 border border-blue-500/20 text-center mb-8"
        >
          <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Következő Ingyenes Tipp</h3>
          <p className="text-gray-300 mb-6">
            Holnap 12:00-kor érkezik a következő profi elemzés!
          </p>
          <div className="text-3xl font-mono font-bold text-blue-400 mb-4">
            {nextTipTime.toLocaleDateString('hu-HU', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </motion.div>

        {/* VIP Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-8 border border-yellow-500/20 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Szeretnél Többet?</h3>
          <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            VIP előfizetőink <strong>naponta 5-8 exkluzív tippet</strong> kapnak részletes elemzéssel, 
            statisztikákkal és magasabb nyerési aránnyal!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-400 mb-2">5-8</div>
              <div className="text-gray-300">Tipp naponta</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400 mb-2">85%</div>
              <div className="text-gray-300">VIP sikeres ráta</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-300">Prémium támogatás</div>
            </div>
          </div>
          
          <button
            onClick={() => {
              const event = new CustomEvent('openStripeCheckout');
              window.dispatchEvent(event);
            }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-lg"
          >
            VIP Előfizetés - €99/hó
          </button>
          
          <p className="text-gray-400 text-sm mt-4">
            3 napos ingyenes próba, utána €99/hónap. Bármikor lemondható.
          </p>
        </motion.div>
      </div>
    </div>
  );
}