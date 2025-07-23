import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, User, Mail, Calendar, Crown, Lock, Save, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscriptionStatus, formatDate } from '../../lib/dateUtils';
import { CompactCountdown } from '../UI/CountdownTimer';

export function ProfileSettings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Use real-time subscription status
  const subscriptionStatus = useSubscriptionStatus(user);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local storage
      const updatedUser = { ...user, full_name: fullName };
      localStorage.setItem('prosofthub_user', JSON.stringify(updatedUser));
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <p className="text-gray-400 mt-1">Manage your account information and preferences</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {user?.full_name || 'User'}
                </h3>
                <p className="text-gray-400 mb-4">{user?.email}</p>
                
                {/* Real-time Subscription Status */}
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-medium">Subscription Status</span>
                  </div>
                  <span className={`font-medium ${
                    subscriptionStatus.type === 'trial' ? 'text-blue-400' :
                    subscriptionStatus.type === 'active' ? 'text-green-400' :
                    'text-red-400'
                  }`}>
                    {subscriptionStatus.text}
                  </span>
                  
                  {/* Real-time Countdown */}
                  <div className="mt-2">
                    <CompactCountdown
                      expiryDate={subscriptionStatus.type === 'trial' ? user?.trial_expires_at : user?.subscription_expires_at}
                    />
                  </div>
                  
                  {subscriptionStatus.formattedExpiry !== 'N/A' && (
                    <p className="text-gray-400 text-sm mt-2">
                      Expires: {subscriptionStatus.formattedExpiry}
                    </p>
                  )}
                </div>

                {/* Account Info */}
                <div className="text-left space-y-3 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Joined: {formatDate(user?.created_at || '')}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Email verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                >
                  <Lock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">Change Password</span>
                </button>
                
                {(!user?.subscription_active && subscriptionStatus.type !== 'trial') && (
                  <a
                    href="https://whop.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-3 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-left"
                  >
                    <Crown className="h-4 w-4 text-white" />
                    <span className="text-white">Upgrade to Premium</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Settings Forms */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Alerts */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-red-400 mr-3" />
                  <span className="text-red-400">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span className="text-green-400">{success}</span>
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
              
              <form onSubmit={updateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    onChange={(e) => {}} // No change in email, as it's not editable here
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
              </form>
            </div>

            {/* Password Change Form */}
            {showChangePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Change Password</h3>
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={changePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Changing...' : 'Change Password'}</span>
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Account Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h3>
              <p className="text-gray-400 mb-4">
                Once you cancel your subscription, you will lose access to all premium features.
              </p>
              
              {user?.subscription_active && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // This will be handled by the CancellationFlow component
                    window.location.hash = 'dashboard';
                    setTimeout(() => {
                      const cancelButton = document.querySelector('[data-cancel-subscription]') as HTMLButtonElement;
                      if (cancelButton) cancelButton.click();
                    }, 100);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel Subscription
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}