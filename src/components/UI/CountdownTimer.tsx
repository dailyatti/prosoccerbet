import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getCountdownInfo, CountdownInfo } from '../../lib/dateUtils';

interface CountdownTimerProps {
  expiryDate: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showProgress?: boolean;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ 
  expiryDate, 
  size = 'md', 
  showIcon = true, 
  showProgress = true,
  className = '',
  onExpire 
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<CountdownInfo>(() => 
    getCountdownInfo(expiryDate)
  );

  useEffect(() => {
    if (!expiryDate) return;

    const updateCountdown = () => {
      const newCountdown = getCountdownInfo(expiryDate);
      setCountdown(newCountdown);
      
      // Call onExpire callback when countdown expires
      if (newCountdown.isExpired && !countdown.isExpired && onExpire) {
        onExpire();
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second for real-time countdown
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, onExpire, countdown.isExpired]);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Get status color and icon
  const getStatusInfo = () => {
    if (countdown.isExpired) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        icon: XCircle,
        text: 'Expired'
      };
    }
    
    if (countdown.isExpiringSoon) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        icon: AlertTriangle,
        text: 'Expiring Soon'
      };
    }
    
    return {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      icon: CheckCircle,
      text: 'Active'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (!expiryDate) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${sizeClasses[size]} ${className}`}>
        {showIcon && <Clock className="h-4 w-4" />}
        <span>No expiry date</span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={countdown.isExpired ? 'expired' : 'active'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center space-x-3 p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
        >
          {showIcon && (
            <motion.div
              animate={{ 
                scale: countdown.isExpiringSoon ? [1, 1.1, 1] : 1,
                rotate: countdown.isExpiringSoon ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: countdown.isExpiringSoon ? 1 : 0,
                repeat: countdown.isExpiringSoon ? Infinity : 0
              }}
            >
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </motion.div>
          )}
          
          <div className="flex-1">
            <div className={`font-mono font-bold ${sizeClasses[size]} ${statusInfo.color}`}>
              {countdown.isExpired ? (
                <span>EXPIRED</span>
              ) : (
                <motion.span
                  key={`${countdown.days}-${countdown.hours}-${countdown.minutes}-${countdown.seconds}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {countdown.formatted}
                </motion.span>
              )}
            </div>
            
            <div className={`text-xs text-gray-400 ${sizeClasses[size]}`}>
              {statusInfo.text}
            </div>
          </div>
          
          {showProgress && !countdown.isExpired && (
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${countdown.isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - countdown.progressPercentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className={`text-xs ${statusInfo.color}`}>
                {Math.round(100 - countdown.progressPercentage)}%
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Compact countdown component for small spaces
export function CompactCountdown({ 
  expiryDate, 
  className = '' 
}: { 
  expiryDate: string | null | undefined;
  className?: string;
}) {
  const [countdown, setCountdown] = useState<CountdownInfo>(() => 
    getCountdownInfo(expiryDate)
  );

  useEffect(() => {
    if (!expiryDate) return;

    const updateCountdown = () => {
      setCountdown(getCountdownInfo(expiryDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!expiryDate) return null;

  const isExpiringSoon = countdown.isExpiringSoon;
  const isExpired = countdown.isExpired;

  return (
    <motion.div
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-mono ${
        isExpired 
          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
          : isExpiringSoon 
            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
            : 'bg-green-500/10 text-green-400 border border-green-500/20'
      } ${className}`}
      animate={isExpiringSoon ? { 
        scale: [1, 1.05, 1],
        boxShadow: ['0 0 0 0 rgba(245, 158, 11, 0)', '0 0 0 4px rgba(245, 158, 11, 0.3)', '0 0 0 0 rgba(245, 158, 11, 0)']
      } : {}}
      transition={{ 
        duration: 1, 
        repeat: isExpiringSoon ? Infinity : 0 
      }}
    >
      <Clock className="h-3 w-3" />
      <span>
        {isExpired ? 'EXPIRED' : countdown.formatted}
      </span>
    </motion.div>
  );
}

// Detailed countdown component with all information
export function DetailedCountdown({ 
  expiryDate, 
  className = '' 
}: { 
  expiryDate: string | null | undefined;
  className?: string;
}) {
  const [countdown, setCountdown] = useState<CountdownInfo>(() => 
    getCountdownInfo(expiryDate)
  );

  useEffect(() => {
    if (!expiryDate) return;

    const updateCountdown = () => {
      setCountdown(getCountdownInfo(expiryDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!expiryDate) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No expiry date set</p>
      </div>
    );
  }

  const isExpiringSoon = countdown.isExpiringSoon;
  const isExpired = countdown.isExpired;

  return (
    <div className={`text-center p-6 rounded-xl border ${
      isExpired 
        ? 'bg-red-500/5 border-red-500/20' 
        : isExpiringSoon 
          ? 'bg-orange-500/5 border-orange-500/20' 
          : 'bg-green-500/5 border-green-500/20'
    } ${className}`}>
      <motion.div
        animate={isExpiringSoon ? { 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{ 
          duration: 1, 
          repeat: isExpiringSoon ? Infinity : 0 
        }}
        className="mb-4"
      >
        <Clock className={`h-12 w-12 mx-auto ${
          isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-green-500'
        }`} />
      </motion.div>
      
      <div className="space-y-2">
        <div className="text-2xl font-mono font-bold">
          {isExpired ? (
            <span className="text-red-500">EXPIRED</span>
          ) : (
            <motion.span
              key={`${countdown.days}-${countdown.hours}-${countdown.minutes}-${countdown.seconds}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              className={isExpiringSoon ? 'text-orange-500' : 'text-green-500'}
            >
              {countdown.formatted}
            </motion.span>
          )}
        </div>
        
        <div className="text-sm text-gray-400">
          {isExpired ? 'Subscription has expired' : 
           isExpiringSoon ? 'Expiring soon - renew now!' : 
           'Time remaining'}
        </div>
        
        {!isExpired && (
          <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
            <motion.div
              className={`h-2 rounded-full ${isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${100 - countdown.progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          {Math.round(100 - countdown.progressPercentage)}% remaining
        </div>
      </div>
    </div>
  );
} 