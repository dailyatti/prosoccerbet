import React, { useState } from 'react';
import { X, AlertTriangle, Crown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CancellationFlowProps {
  onClose: () => void;
}

export function CancellationFlow({ onClose }: CancellationFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'reason' | 'offer' | 'confirm'>('reason');
  const [selectedReason, setSelectedReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    'Too expensive',
    'Not using it enough',
    'Found a better alternative',
    'Technical issues',
    'Missing features',
    'Other'
  ];

  const handleSubmitReason = async () => {
    if (!selectedReason) return;
    
    setLoading(true);
    try {
      // Create cancellation request
      await supabase
        .from('cancellation_requests')
        .insert({
          user_id: user?.id,
          reason: selectedReason,
          feedback: feedback,
          status: 'pending'
        });

      // Create retention offer
      await supabase
        .from('retention_offers')
        .insert({
          user_id: user?.id,
          original_price: 99,
          discounted_price: 66.33,
          discount_percentage: 33,
          duration_months: 2,
          status: 'active',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      setStep('offer');
    } catch (error) {
      console.error('Error creating cancellation request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    setLoading(true);
    try {
      // Update retention offer status
      await supabase
        .from('retention_offers')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Update cancellation request
      await supabase
        .from('cancellation_requests')
        .update({ status: 'retained' })
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      setStep('confirm');
    } catch (error) {
      console.error('Error accepting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    setLoading(true);
    try {
      // Update retention offer status
      await supabase
        .from('retention_offers')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Update cancellation request
      await supabase
        .from('cancellation_requests')
        .update({ status: 'cancelled' })
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      // Here you would typically redirect to external cancellation
      window.open('https://whop.com/cancel', '_blank');
      onClose();
    } catch (error) {
      console.error('Error rejecting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
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
          className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700"
        >
          {step === 'reason' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">We're sorry to see you go</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-gray-400 mb-6">
                Help us improve by telling us why you're cancelling:
              </p>

              <div className="space-y-3 mb-6">
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center p-3 border border-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-gray-300">{reason}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Additional feedback (optional)"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 mb-6"
              />

              <button
                onClick={handleSubmitReason}
                disabled={!selectedReason || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </>
          )}

          {step === 'offer' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Wait! Special Offer</h3>
                <p className="text-gray-400">
                  We'd love to keep you as a valued member
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-3xl font-bold text-white">33% OFF</span>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Get 2 months at just <span className="font-bold text-green-400">$66.33/month</span>
                  </p>
                  <div className="text-sm text-gray-400">
                    <p>• Save $65.34 total</p>
                    <p>• Full access to all features</p>
                    <p>• Cancel anytime</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAcceptOffer}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Accept Special Offer'}
                </button>
                <button
                  onClick={handleRejectOffer}
                  disabled={loading}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  No thanks, continue cancelling
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome Back!</h3>
                <p className="text-gray-400 mb-6">
                  You've successfully accepted the special offer. Enjoy 2 months at 33% off!
                </p>
                <button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Continue to Dashboard
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}