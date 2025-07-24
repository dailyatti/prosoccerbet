import React from 'react';
import { Menu, X, User, LogOut, Settings, Crown, Gift } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                ProSoft Hub
              </h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user && (
                <>
                  <a href="#dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </a>
                  <a href="#profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Profile
                  </a>
                  <a href="https://eng-prompt-elemz.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    AI Prompt
                  </a>
                  <a href="https://prismatic-meringue-16ade7.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Arbitrage
                  </a>
                  <a href="#free-tips" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                    <Gift className="h-4 w-4 text-green-400" />
                    <span>Ingyenes Tippek</span>
                  </a>
                  <a href="#vip-tips" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span>VIP Tips</span>
                  </a>
                  {user.is_admin && (
                    <a href="#admin" className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300 text-sm">{user.full_name || user.email}</span>
                  {user.subscription_active ? (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
               <div className="flex items-center space-x-4">
                 <button onClick={() => window.location.hash = '#login'} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                   Sign In
                 </button>
                 <button onClick={() => window.location.hash = '#signup'} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                   Sign Up
                 </button>
               </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  <button onClick={() => window.location.hash = '#dashboard'} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                    Dashboard
                  </button>
                  <button onClick={() => window.location.hash = '#profile'} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                    Profile
                  </button>
                  <a href="https://eng-prompt-elemz.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    AI Prompt
                  </a>
                  <a href="https://prismatic-meringue-16ade7.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Arbitrage
                  </a>
                  <button onClick={() => window.location.hash = '#vip-tips'} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                    VIP Tips
                  </button>
                  <button onClick={() => window.location.hash = '#free-tips'} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                    Ingyenes Tippek
                  </button>
                  {user.is_admin && (
                    <button onClick={() => window.location.hash = '#admin'} className="text-blue-400 hover:text-blue-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                      Admin
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-red-400 hover:text-red-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => window.location.hash = '#login'} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                    Sign In
                  </button>
                  <button onClick={() => window.location.hash = '#signup'} className="text-blue-400 hover:text-blue-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}