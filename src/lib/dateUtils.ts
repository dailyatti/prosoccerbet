/**
 * Professional date utilities for subscription and trial management
 * Timezone conversion, date comparison, user-friendly formatting
 * Real-time countdown functionality with Supabase integration
 */

import React from 'react';
import { supabase } from './supabase';

export interface DateInfo {
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  formattedExpiry: string;
  formattedTimeLeft: string;
  progressPercentage: number;
  isExpiringSoon: boolean;
  timeUntilExpiry: number; // milliseconds
}

export interface SubscriptionStatus {
  type: 'trial' | 'active' | 'expired' | 'inactive';
  text: string;
  color: string;
  hasAccess: boolean;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  formattedExpiry: string;
  formattedTimeLeft: string;
  isExpiringSoon: boolean;
  progressPercentage: number;
}

export interface CountdownInfo {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  formatted: string;
  progressPercentage: number;
}

export interface ProfessionalCountdownInfo extends CountdownInfo {
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  statusMessage: string;
  recommendedAction: string;
  timeZone: string;
  lastUpdated: Date;
}

/**
 * Professional ISO date string processing with timezone handling
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Handle ISO string with timezone
    const date = new Date(dateString);
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
}

/**
 * Get current time in UTC - synchronized with Supabase
 */
export async function getCurrentTimeFromSupabase(): Promise<Date> {
  try {
    // Try to get server time from Supabase
    const { data, error } = await supabase.rpc('get_utc_now');
    if (!error && data) {
      return new Date(data);
    }
  } catch (error) {
    console.warn('Could not get server time, using local time:', error);
  }
  
  // Fallback to local time
  return new Date();
}

/**
 * Quick local time retrieval
 */
export function getCurrentTime(): Date {
  return new Date();
}

/**
 * Time difference calculation between two dates with real-time precision
 */
export function getTimeDifference(endDate: Date, startDate: Date = getCurrentTime()): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const diff = endDate.getTime() - startDate.getTime();
  
  if (diff <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { total: diff, days, hours, minutes, seconds };
}

/**
 * Professional real-time countdown information
 */
export function getProfessionalCountdownInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): ProfessionalCountdownInfo {
  const endDate = parseDate(expiryDate);
  const start = startDate ? parseDate(startDate) : getCurrentTime();
  const now = getCurrentTime();
  
  if (!endDate) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isExpiringSoon: false,
      formatted: 'Expired',
      progressPercentage: 100,
      urgencyLevel: 'critical',
      statusMessage: 'Access Expired',
      recommendedAction: 'Subscription renewal required',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lastUpdated: now
    };
  }
  
  const diff = getTimeDifference(endDate, now);
  const isExpired = diff.total <= 0;
  
  // Progress percentage calculation
  let progressPercentage = 0;
  if (startDate && start) {
    const totalDuration = endDate.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  } else {
    // If no start date, estimate based on 3-day trial
    const estimatedStart = new Date(endDate.getTime() - (3 * 24 * 60 * 60 * 1000));
    const totalDuration = endDate.getTime() - estimatedStart.getTime();
    const elapsed = now.getTime() - estimatedStart.getTime();
    progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }
  
  // Expiration proximity check and urgency level
  const hoursLeft = diff.total / (1000 * 60 * 60);
  const isExpiringSoon = !isExpired && diff.total <= 24 * 60 * 60 * 1000;
  
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  let statusMessage: string;
  let recommendedAction: string;
  
  if (isExpired) {
    urgencyLevel = 'critical';
    statusMessage = 'VIP access expired';
    recommendedAction = 'Immediate renewal required';
  } else if (hoursLeft <= 1) {
    urgencyLevel = 'critical';
    statusMessage = 'VIP access expires within 1 hour!';
    recommendedAction = 'Urgently renew your subscription';
  } else if (hoursLeft <= 6) {
    urgencyLevel = 'high';
    statusMessage = 'VIP access expiring soon';
    recommendedAction = 'We recommend renewing your subscription';
  } else if (diff.days === 0) {
    urgencyLevel = 'medium';
    statusMessage = 'VIP access expires today';
    recommendedAction = 'Don\'t forget to renew';
  } else {
    urgencyLevel = 'low';
    statusMessage = `${diff.days} day${diff.days > 1 ? 's' : ''} of VIP access remaining`;
    recommendedAction = 'Enjoy your VIP features';
  }
  
  // Countdown string formatting in English
  let formatted = 'Expired';
  if (!isExpired) {
    if (diff.days > 0) {
      formatted = `${diff.days}d ${diff.hours}h ${diff.minutes}m`;
    } else if (diff.hours > 0) {
      formatted = `${diff.hours}h ${diff.minutes}m ${diff.seconds}s`;
    } else if (diff.minutes > 0) {
      formatted = `${diff.minutes}m ${diff.seconds}s`;
    } else {
      formatted = `${diff.seconds}s`;
    }
  } else {
    formatted = 'Expired';
  }
  
  return {
    total: diff.total,
    days: diff.days,
    hours: diff.hours,
    minutes: diff.minutes,
    seconds: diff.seconds,
    isExpired,
    isExpiringSoon,
    formatted,
    progressPercentage,
    urgencyLevel,
    statusMessage,
    recommendedAction,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lastUpdated: now
  };
}

/**
 * Backward compatibility with the old function
 */
export function getCountdownInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): CountdownInfo {
  const professionalInfo = getProfessionalCountdownInfo(expiryDate, startDate);
  return {
    total: professionalInfo.total,
    days: professionalInfo.days,
    hours: professionalInfo.hours,
    minutes: professionalInfo.minutes,
    seconds: professionalInfo.seconds,
    isExpired: professionalInfo.isExpired,
    isExpiringSoon: professionalInfo.isExpiringSoon,
    formatted: professionalInfo.formatted,
    progressPercentage: professionalInfo.progressPercentage
  };
}

/**
 * Detailed date information (trial/subscription) with real-time updates
 */
export function getDateInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): DateInfo {
  const countdown = getProfessionalCountdownInfo(expiryDate, startDate);
  const endDate = parseDate(expiryDate);
  
  if (!endDate) {
    return {
      isExpired: true,
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      secondsLeft: 0,
      formattedExpiry: 'No expiry date',
      formattedTimeLeft: 'Expired',
      progressPercentage: 0,
      isExpiringSoon: false,
      timeUntilExpiry: 0
    };
  }
  
  // Format expiry date with timezone
  const formattedExpiry = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  // Format time left with real-time precision in English
  let formattedTimeLeft = 'Expired';
  if (!countdown.isExpired) {
    if (countdown.days > 0) {
      formattedTimeLeft = `${countdown.days} day${countdown.days > 1 ? 's' : ''}, ${countdown.hours} hour${countdown.hours > 1 ? 's' : ''} left`;
    } else if (countdown.hours > 0) {
      formattedTimeLeft = `${countdown.hours} hour${countdown.hours > 1 ? 's' : ''}, ${countdown.minutes} minute${countdown.minutes > 1 ? 's' : ''} left`;
    } else if (countdown.minutes > 0) {
      formattedTimeLeft = `${countdown.minutes} minute${countdown.minutes > 1 ? 's' : ''}, ${countdown.seconds} second${countdown.seconds > 1 ? 's' : ''} left`;
    } else {
      formattedTimeLeft = `${countdown.seconds} second${countdown.seconds > 1 ? 's' : ''} left`;
    }
  } else {
    formattedTimeLeft = 'Expired';
  }
  
  return {
    isExpired: countdown.isExpired,
    daysLeft: countdown.days,
    hoursLeft: countdown.hours,
    minutesLeft: countdown.minutes,
    secondsLeft: countdown.seconds,
    formattedExpiry,
    formattedTimeLeft,
    progressPercentage: countdown.progressPercentage,
    isExpiringSoon: countdown.isExpiringSoon,
    timeUntilExpiry: countdown.total
  };
}

/**
 * Subscription status with all relevant information and real-time countdown
 */
export function getSubscriptionStatus(
  user: {
    subscription_active?: boolean;
    subscription_expires_at?: string | null;
    trial_expires_at?: string | null;
    is_trial_used?: boolean;
  } | null
): SubscriptionStatus {
  if (!user) {
    return {
      type: 'inactive',
      text: 'Not logged in',
      color: 'from-gray-500 to-gray-600',
      hasAccess: false,
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      secondsLeft: 0,
      formattedExpiry: 'N/A',
      formattedTimeLeft: 'N/A',
      isExpiringSoon: false,
      progressPercentage: 0
    };
  }
  
  const now = getCurrentTime();
  
  // First check trial status
  if (!user.is_trial_used && user.trial_expires_at) {
    const trialInfo = getDateInfo(user.trial_expires_at);
    
    if (!trialInfo.isExpired) {
      return {
        type: 'trial',
        text: `3-Day VIP Trial (${trialInfo.daysLeft}d ${trialInfo.hoursLeft}h left)`,
        color: trialInfo.isExpiringSoon ? 'from-orange-500 to-red-500' : 'from-blue-500 to-cyan-500',
        hasAccess: true,
        daysLeft: trialInfo.daysLeft,
        hoursLeft: trialInfo.hoursLeft,
        minutesLeft: trialInfo.minutesLeft,
        secondsLeft: trialInfo.secondsLeft,
        formattedExpiry: trialInfo.formattedExpiry,
        formattedTimeLeft: trialInfo.formattedTimeLeft,
        isExpiringSoon: trialInfo.isExpiringSoon,
        progressPercentage: trialInfo.progressPercentage
      };
    } else {
      return {
        type: 'expired',
        text: '3-Day VIP Trial Expired',
        color: 'from-red-500 to-pink-500',
        hasAccess: false,
        daysLeft: 0,
        hoursLeft: 0,
        minutesLeft: 0,
        secondsLeft: 0,
        formattedExpiry: trialInfo.formattedExpiry,
        formattedTimeLeft: 'Expired',
        isExpiringSoon: false,
        progressPercentage: 100
      };
    }
  }
  
  // Check subscription status
  if (user.subscription_active && user.subscription_expires_at) {
    const subscriptionInfo = getDateInfo(user.subscription_expires_at);
    
    if (!subscriptionInfo.isExpired) {
      return {
        type: 'active',
        text: `Active VIP Subscription (${subscriptionInfo.daysLeft}d ${subscriptionInfo.hoursLeft}h left)`,
        color: subscriptionInfo.isExpiringSoon ? 'from-orange-500 to-red-500' : 'from-green-500 to-emerald-500',
        hasAccess: true,
        daysLeft: subscriptionInfo.daysLeft,
        hoursLeft: subscriptionInfo.hoursLeft,
        minutesLeft: subscriptionInfo.minutesLeft,
        secondsLeft: subscriptionInfo.secondsLeft,
        formattedExpiry: subscriptionInfo.formattedExpiry,
        formattedTimeLeft: subscriptionInfo.formattedTimeLeft,
        isExpiringSoon: subscriptionInfo.isExpiringSoon,
        progressPercentage: subscriptionInfo.progressPercentage
      };
    } else {
      return {
        type: 'expired',
        text: 'VIP Subscription Expired',
        color: 'from-red-500 to-pink-500',
        hasAccess: false,
        daysLeft: 0,
        hoursLeft: 0,
        minutesLeft: 0,
        secondsLeft: 0,
        formattedExpiry: subscriptionInfo.formattedExpiry,
        formattedTimeLeft: 'Expired',
        isExpiringSoon: false,
        progressPercentage: 100
      };
    }
  }
  
  // No active subscription or trial
  return {
    type: 'inactive',
    text: 'No Active VIP Subscription',
    color: 'from-red-500 to-pink-500',
    hasAccess: false,
    daysLeft: 0,
    hoursLeft: 0,
    minutesLeft: 0,
    secondsLeft: 0,
    formattedExpiry: 'N/A',
    formattedTimeLeft: 'N/A',
    isExpiringSoon: false,
    progressPercentage: 0
  };
}

/**
 * Check access to premium features
 */
export function hasPremiumAccess(user: {
  subscription_active?: boolean;
  subscription_expires_at?: string | null;
  trial_expires_at?: string | null;
  is_trial_used?: boolean;
} | null): boolean {
  if (!user) return false;
  
  const status = getSubscriptionStatus(user);
  return status.hasAccess;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getCurrentTime();
  const diff = dateObj.getTime() - now.getTime();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (Math.abs(days) > 0) {
    return rtf.format(days, 'day');
  } else if (Math.abs(hours) > 0) {
    return rtf.format(hours, 'hour');
  } else if (Math.abs(minutes) > 0) {
    return rtf.format(minutes, 'minute');
  } else {
    return rtf.format(seconds, 'second');
  }
}

/**
 * Get timezone offset string
 */
export function getTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.abs(Math.floor(offset / 60));
  const minutes = Math.abs(offset % 60);
  const sign = offset <= 0 ? '+' : '-';
  
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Real-time countdown hook for React components - with Supabase synchronization
 */
export function useProfessionalCountdown(expiryDate: string | null | undefined) {
  const [countdown, setCountdown] = React.useState<ProfessionalCountdownInfo>(() => 
    getProfessionalCountdownInfo(expiryDate)
  );
  const [serverTimeSynced, setServerTimeSynced] = React.useState(false);

  React.useEffect(() => {
    if (!expiryDate) return;

    // Server time synchronization
    const syncServerTime = async () => {
      try {
        await getCurrentTimeFromSupabase();
        setServerTimeSynced(true);
      } catch (error) {
        console.warn('Server time sync failed, using local time');
        setServerTimeSynced(false);
      }
    };

    const updateCountdown = () => {
      setCountdown(getProfessionalCountdownInfo(expiryDate));
    };

    // Immediate update
    syncServerTime();
    updateCountdown();

    // Update every second for real-time countdown
    const interval = setInterval(updateCountdown, 1000);

    // Server time sync every 5 minutes
    const syncInterval = setInterval(syncServerTime, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [expiryDate]);

  return { ...countdown, serverTimeSynced };
}

/**
 * Backward compatibility with the old hook
 */
export function useCountdown(expiryDate: string | null | undefined) {
  const [countdown, setCountdown] = React.useState<CountdownInfo>(() => 
    getCountdownInfo(expiryDate)
  );

  React.useEffect(() => {
    if (!expiryDate) return;

    const updateCountdown = () => {
      setCountdown(getCountdownInfo(expiryDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  return countdown;
}

/**
 * Real-time subscription status hook - with Supabase integration
 */
export function useSubscriptionStatus(user: any) {
  const [status, setStatus] = React.useState<SubscriptionStatus>(() => 
    getSubscriptionStatus(user)
  );
  const [lastSync, setLastSync] = React.useState<Date>(new Date());

  React.useEffect(() => {
    if (!user) return;

    const updateStatus = () => {
      setStatus(getSubscriptionStatus(user));
      setLastSync(new Date());
    };

    // Immediate update
    updateStatus();

    // Update every second for real-time countdown
    const interval = setInterval(updateStatus, 1000);

    // Watch for Supabase changes (if available)
    let subscription: any = null;
    if (supabase && user.id) {
      subscription = supabase
        .channel('user-subscription-changes')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'users',
            filter: `id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('User subscription updated:', payload);
            updateStatus();
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user]);

  return { ...status, lastSync };
}

/**
 * VIP trial specific information
 */
export function getVipTrialInfo(user: any) {
  if (!user || user.is_trial_used || !user.trial_expires_at) {
    return null;
  }

  const countdown = getProfessionalCountdownInfo(user.trial_expires_at);
  
  return {
    ...countdown,
    isVipTrial: true,
    trialDaysTotal: 3,
    daysUsed: 3 - countdown.days,
    vipBenefits: [
      'AI Prompt Generator full access',
      'Arbitrage Calculator unlimited usage', 
      'VIP Tips exclusive content',
      'Priority support',
      'Mobile optimized experience'
    ],
    upgradeMessage: countdown.isExpiringSoon 
      ? 'Don\'t lose your VIP access! Upgrade now.'
      : 'Enjoy the VIP experience and upgrade for continuous access.'
  };
}

/**
 * Professional notification system for countdown
 */
export function useCountdownNotifications(user: any, onNotify?: (notification: any) => void) {
  const status = useSubscriptionStatus(user);
  const [lastNotificationTime, setLastNotificationTime] = React.useState<number>(0);

  React.useEffect(() => {
    if (!user || !onNotify) return;

    const now = Date.now();
    const hoursLeft = status.hoursLeft;
    
    // Notification logic
    if (status.type === 'trial' && !status.isExpired) {
      // 24 hours before expiration
      if (hoursLeft <= 24 && hoursLeft > 12 && (now - lastNotificationTime) > 6 * 60 * 60 * 1000) {
        onNotify({
          type: 'warning',
          title: '3-Day VIP Trial expiring soon',
          message: `${Math.round(hoursLeft)} hour${Math.round(hoursLeft) > 1 ? 's' : ''} left in your VIP access.`,
          action: 'Upgrade now'
        });
        setLastNotificationTime(now);
      }
      
      // 12 hours before expiration
      if (hoursLeft <= 12 && hoursLeft > 6 && (now - lastNotificationTime) > 3 * 60 * 60 * 1000) {
        onNotify({
          type: 'warning',
          title: 'VIP Trial expires today!',
          message: `Only ${Math.round(hoursLeft)} hour${Math.round(hoursLeft) > 1 ? 's' : ''} left. Don't lose access!`,
          action: 'Immediate upgrade'
        });
        setLastNotificationTime(now);
      }
      
      // 1 hour before expiration
      if (hoursLeft <= 1 && hoursLeft > 0 && (now - lastNotificationTime) > 30 * 60 * 1000) {
        onNotify({
          type: 'critical',
          title: 'VIP Trial expires within 1 hour!',
          message: 'Urgently upgrade your subscription for continuous access.',
          action: 'Urgent upgrade'
        });
        setLastNotificationTime(now);
      }
    }
    
    // Expired trial
    if (status.type === 'expired' && (now - lastNotificationTime) > 24 * 60 * 60 * 1000) {
      onNotify({
        type: 'error',
        title: '3-Day VIP Trial expired',
        message: 'Upgrade now to regain access to VIP features.',
        action: 'Activate subscription'
      });
      setLastNotificationTime(now);
    }
  }, [status, user, onNotify, lastNotificationTime]);

  return {
    shouldShowUpgradePrompt: status.type === 'trial' && status.hoursLeft <= 24,
    urgencyLevel: status.isExpiringSoon ? 'high' : 'normal',
    lastNotificationTime
  };
}