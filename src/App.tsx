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
import { SuccessPage } from './components/Success/SuccessPage';
import { LoadingScreen } from './components/Loading/LoadingScreen';
import { StripeCheckout } from './components/Payment/StripeCheckout';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserAccessLevel } from './lib/stripe';
import { hasFeatureAccess } from './stripe-config';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);

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
      setCurrentView('dashboard');
      window.location.hash = '#dashboard';
    }
  }, [user, currentView]);

  // Listen for Stripe checkout events
  useEffect(() => {
    const handleOpenStripeCheckout = () => {
      setShowStripeCheckout(true);
    };

    window.addEventListener('openStripeCheckout', handleOpenStripeCheckout);
    
    return () => {
      window.removeEventListener('openStripeCheckout', handleOpenStripeCheckout);
    };
  }, []);

  // Navigation helper function
  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.location.hash = `#${view}`;
  };
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
                  navigateTo('signup');
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
                  navigateTo('login');
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Success page
  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <SuccessPage />
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

  // Check feature access for protected routes
  const userAccessLevel = getUserAccessLevel(user);
  const protectedRoutes = ['prompt-generator', 'arbitrage', 'vip-tips'];
  
  if (protectedRoutes.includes(currentView)) {
    const hasAccess = hasFeatureAccess(currentView.replace('-', '_') as any, userAccessLevel);
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-gray-900">
          <Header />
          <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-700"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
                <p className="text-gray-400">
                  You need a VIP subscription to access this professional tool.
                </p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setShowStripeCheckout(true)}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block w-full"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="block w-full text-gray-400 hover:text-white transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }
  }

  // Render main app content
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <ProfileSettings />;
      case 'prompt-generator':
        return <PromptGenerator />;
      case 'arbitrage':
        return <ArbitrageCalculator />;
      case 'vip-tips':
        return <VipTips />;
      case 'admin':
        return user.is_admin ? <AdminPanel /> : <Dashboard />;
      default:
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
      
      {/* Global Stripe Checkout Modal */}
      <AnimatePresence>
        {showStripeCheckout && (
          <StripeCheckout onClose={() => setShowStripeCheckout(false)} />
        )}
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