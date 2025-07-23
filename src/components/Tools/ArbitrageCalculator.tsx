import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, RefreshCw, DollarSign, Percent, Clock, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface OddsData {
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

interface ArbitrageOpportunity {
  sport: string;
  event: string;
  bookmaker1: string;
  bookmaker2: string;
  odds1: number;
  odds2: number;
  profit: number;
  stake1: number;
  stake2: number;
  totalStake: number;
  profit_percentage: number;
}

export function ArbitrageCalculator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [selectedSport, setSelectedSport] = useState('upcoming');
  const [minProfit, setMinProfit] = useState(1);
  const [totalStake, setTotalStake] = useState(1000);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const sports = [
    { key: 'upcoming', title: 'Upcoming Games' },
    { key: 'americanfootball_nfl', title: 'NFL' },
    { key: 'basketball_nba', title: 'NBA' },
    { key: 'soccer_epl', title: 'Premier League' },
    { key: 'soccer_uefa_champs_league', title: 'Champions League' },
    { key: 'icehockey_nhl', title: 'NHL' },
    { key: 'baseball_mlb', title: 'MLB' },
    { key: 'tennis_atp', title: 'ATP Tennis' }
  ];

  const fetchOdds = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulated odds data - replace with actual API call
      const mockOpportunities: ArbitrageOpportunity[] = [
        {
          sport: 'NBA',
          event: 'Lakers vs Warriors',
          bookmaker1: 'BetMGM',
          bookmaker2: 'DraftKings',
          odds1: 2.10,
          odds2: 1.95,
          profit: 25.50,
          stake1: 476.19,
          stake2: 523.81,
          totalStake: 1000,
          profit_percentage: 2.55
        },
        {
          sport: 'NFL',
          event: 'Chiefs vs Bills',
          bookmaker1: 'FanDuel',
          bookmaker2: 'Caesars',
          odds1: 1.85,
          odds2: 2.05,
          profit: 31.20,
          stake1: 526.32,
          stake2: 473.68,
          totalStake: 1000,
          profit_percentage: 3.12
        },
        {
          sport: 'Premier League',
          event: 'Manchester City vs Liverpool',
          bookmaker1: 'Bet365',
          bookmaker2: 'William Hill',
          odds1: 2.25,
          odds2: 1.80,
          profit: 18.75,
          stake1: 444.44,
          stake2: 555.56,
          totalStake: 1000,
          profit_percentage: 1.88
        }
      ];

      // Filter opportunities based on minimum profit
      const filtered = mockOpportunities.filter(opp => opp.profit_percentage >= minProfit);
      
      // Recalculate stakes based on current total stake
      const recalculated = filtered.map(opp => {
        const stake1 = (totalStake * opp.odds2) / (opp.odds1 + opp.odds2);
        const stake2 = totalStake - stake1;
        const profit = Math.min(stake1 * opp.odds1, stake2 * opp.odds2) - totalStake;
        
        return {
          ...opp,
          stake1,
          stake2,
          totalStake,
          profit,
          profit_percentage: (profit / totalStake) * 100
        };
      });

      setOpportunities(recalculated);
      setLastUpdated(new Date());

    } catch (err) {
      setError('Failed to fetch odds data. Please check your API connection.');
      console.error('Error fetching odds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdds();
  }, [selectedSport, minProfit, totalStake]);

  const filteredOpportunities = opportunities.filter(opp =>
    opp.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProfitColor = (percentage: number) => {
    if (percentage >= 3) return 'text-green-400';
    if (percentage >= 2) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Arbitrage Calculator</h1>
              <p className="text-gray-400 mt-1">Find profitable arbitrage opportunities across different bookmakers</p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sport
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {sports.map((sport) => (
                  <option key={sport.key} value={sport.key}>
                    {sport.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Profit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Profit (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={minProfit}
                  onChange={(e) => setMinProfit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.1"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Total Stake */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Stake
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalStake}
                  onChange={(e) => setTotalStake(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex flex-col justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchOdds}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Updating...' : 'Refresh'}</span>
              </motion.button>
            </div>
          </div>

          {/* Search and Status */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-700">
            <div className="relative mb-4 sm:mb-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {lastUpdated && (
              <div className="flex items-center text-gray-400 text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6"
            >
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Opportunities List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : filteredOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOpportunities.map((opportunity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{opportunity.event}</h3>
                      <p className="text-gray-400 text-sm">{opportunity.sport}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getProfitColor(opportunity.profit_percentage)}`}>
                        +{opportunity.profit_percentage.toFixed(2)}%
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatCurrency(opportunity.profit)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">{opportunity.bookmaker1}</div>
                      <div className="text-white font-semibold text-lg">{opportunity.odds1.toFixed(2)}</div>
                      <div className="text-green-400 text-sm">
                        Stake: {formatCurrency(opportunity.stake1)}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">{opportunity.bookmaker2}</div>
                      <div className="text-white font-semibold text-lg">{opportunity.odds2.toFixed(2)}</div>
                      <div className="text-green-400 text-sm">
                        Stake: {formatCurrency(opportunity.stake2)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Total Stake:</span>
                      <span className="text-white font-medium">{formatCurrency(opportunity.totalStake)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Guaranteed Profit:</span>
                      <span className="text-green-400 font-medium">{formatCurrency(opportunity.profit)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Arbitrage Opportunities Found</h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later for new opportunities.
              </p>
            </div>
          )}
        </motion.div>

        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-6 border border-blue-500/20"
        >
          <h3 className="text-white font-semibold mb-3">📊 How Arbitrage Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-white">1. Find Discrepancies</strong>
              <p>Different bookmakers offer different odds for the same event.</p>
            </div>
            <div>
              <strong className="text-white">2. Calculate Stakes</strong>
              <p>Distribute your total stake to guarantee profit regardless of outcome.</p>
            </div>
            <div>
              <strong className="text-white">3. Place Bets</strong>
              <p>Place calculated stakes on both outcomes at different bookmakers.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}