import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Layout/Header';
import { LoginForm } from './components/Auth/LoginForm';
import { SignUpForm } from './components/Auth/SignUpForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PromptGenerator } from './components/Tools/PromptGenerator';
import { ArbitrageCalculator } from './components/Tools/ArbitrageCalculator';
import { VipTips } from './components/Tools/VipTips';
import { AdminPanel } from './components/Admin/AdminPanel';
import { LandingPage } from './components/Landing/LandingPage';
import { ProfileSettings } from './components/User/ProfileSettings';
import { LoadingScreen } from './components/Loading/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || 'landing';
      setCurrentView(hash);
      
      // Set auth mode for login/signup
      if (hash === 'login') setAuthMode('login');
      if (hash === 'signup') setAuthMode('signup');
    };

    // Initial hash check
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auto redirect logged in users from landing/auth pages
  useEffect(() => {
    if (user && (currentView === 'landing' || currentView === 'login' || currentView === 'signup')) {
      window.location.hash = 'dashboard';
    }
  }, [user, currentView]);

  // Show loading screen only during initial load
  if (loading) {
    return <LoadingScreen message="Loading ProSoft Hub..." />;
  }

  // Auth pages for non-logged in users
  if (!user && (currentView === 'login' || currentView === 'signup')) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="min-h-screen flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {authMode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm onToggleForm={() => {
                  setAuthMode('signup');
                  window.location.hash = 'signup';
                }} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SignUpForm onToggleForm={() => {
                  setAuthMode('login');
                  window.location.hash = 'login';
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Landing page for non-logged in users
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <LandingPage />
      </div>
    );
  }

  // Check access for protected routes
  const hasAccess = user.subscription_active || (user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date());
  const protectedRoutes = ['prompt-generator', 'arbitrage', 'vip-tips'];
  
  if (protectedRoutes.includes(currentView) && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-700">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Subscription Required</h2>
              <p className="text-gray-400">
                You need an active subscription to access this feature.
              </p>
            </div>
            <div className="space-y-4">
              <a
                href="https://whop.com/ai-sports-betting-tips-premium/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
              >
                Subscribe Now - $99/month
              </a>
              <button
                onClick={() => window.location.hash = 'dashboard'}
                className="block w-full text-gray-400 hover:text-white transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main app content
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <ProfileSettings />;
      case 'vip-tips':
        return <VipTips />;
      case 'admin':
        return user.is_admin ? <AdminPanel /> : <Dashboard />;
      default:
        // Default to dashboard for logged in users
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;