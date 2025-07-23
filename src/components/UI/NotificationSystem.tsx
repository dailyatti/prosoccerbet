import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationSystem({ 
  notifications, 
  onRemove, 
  position = 'top-right' 
}: NotificationSystemProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getColorClasses = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          icon: 'text-green-500',
          title: 'text-green-400',
          message: 'text-green-300'
        };
      case 'warning':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          icon: 'text-orange-500',
          title: 'text-orange-400',
          message: 'text-orange-300'
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: 'text-red-500',
          title: 'text-red-400',
          message: 'text-red-300'
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          icon: 'text-blue-500',
          title: 'text-blue-400',
          message: 'text-blue-300'
        };
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2`}>
      <AnimatePresence>
        {notifications.map((notification, index) => {
          const Icon = getIcon(notification.type);
          const colors = getColorClasses(notification.type);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.8 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.1 
              }}
              className={`max-w-sm w-full ${colors.bg} ${colors.border} border rounded-lg p-4 shadow-lg backdrop-blur-sm`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 mt-0.5 ${colors.icon}`} />
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${colors.title}`}>
                    {notification.title}
                  </h4>
                  <p className={`text-sm mt-1 ${colors.message}`}>
                    {notification.message}
                  </p>
                  
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className={`mt-2 text-xs font-medium ${colors.title} hover:underline transition-colors`}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => onRemove(notification.id)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}

// Specialized notification for countdown events
export function useCountdownNotifications() {
  const { notifications, addNotification, removeNotification } = useNotifications();

  const notifyExpiringSoon = (timeLeft: string, type: 'trial' | 'subscription') => {
    addNotification({
      type: 'warning',
      title: `${type === 'trial' ? 'Trial' : 'Subscription'} Expiring Soon!`,
      message: `Your ${type} will expire in ${timeLeft}. Renew now to maintain access.`,
      duration: 10000,
      action: {
        label: 'Renew Now',
        onClick: () => {
          window.open('https://whop.com', '_blank');
        }
      }
    });
  };

  const notifyExpired = (type: 'trial' | 'subscription') => {
    addNotification({
      type: 'error',
      title: `${type === 'trial' ? 'Trial' : 'Subscription'} Expired`,
      message: `Your ${type} has expired. Subscribe now to regain access to all features.`,
      duration: 0, // Don't auto-remove
      action: {
        label: 'Subscribe Now',
        onClick: () => {
          window.open('https://whop.com', '_blank');
        }
      }
    });
  };

  const notifyRenewed = () => {
    addNotification({
      type: 'success',
      title: 'Subscription Renewed!',
      message: 'Your subscription has been successfully renewed. Enjoy continued access to all features.',
      duration: 5000
    });
  };

  return {
    notifications,
    removeNotification,
    notifyExpiringSoon,
    notifyExpired,
    notifyRenewed
  };
} 