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

/**
 * Professional ISO date string processing with timezone handling
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
}

/**
 * Get current time
 */
export function getCurrentTime(): Date {
  return new Date();
}

/**
 * Time difference calculation between two dates
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
 * Professional countdown information
 */
export function getCountdownInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): CountdownInfo {
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
      progressPercentage: 100
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
  
  const isExpiringSoon = !isExpired && diff.total <= 24 * 60 * 60 * 1000;
  
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
    progressPercentage
  };
}

/**
 * Subscription status with Stripe integration
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
  
  // Check trial status first
  if (!user.is_trial_used && user.trial_expires_at) {
    const trialInfo = getDateInfo(user.trial_expires_at);
    
    if (!trialInfo.isExpired) {
      return {
        type: 'trial',
        text: `3-Day Trial (${trialInfo.daysLeft}d ${trialInfo.hoursLeft}h left)`,
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
    }
  }
  
  // Check Stripe subscription status
  if (user.subscription_active && user.subscription_expires_at) {
    const subscriptionInfo = getDateInfo(user.subscription_expires_at);
    
    if (!subscriptionInfo.isExpired) {
      return {
        type: 'active',
        text: `Premium Subscription (${subscriptionInfo.daysLeft}d left)`,
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
    }
  }
  
  return {
    type: 'expired',
    text: 'No Active Subscription',
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
 * Detailed date information
 */
export function getDateInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): DateInfo {
  const countdown = getCountdownInfo(expiryDate, startDate);
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
  
  const formattedExpiry = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let formattedTimeLeft = 'Expired';
  if (!countdown.isExpired) {
    if (countdown.days > 0) {
      formattedTimeLeft = `${countdown.days} day${countdown.days > 1 ? 's' : ''}, ${countdown.hours} hour${countdown.hours > 1 ? 's' : ''}`;
    } else if (countdown.hours > 0) {
      formattedTimeLeft = `${countdown.hours} hour${countdown.hours > 1 ? 's' : ''}, ${countdown.minutes} minute${countdown.minutes > 1 ? 's' : ''}`;
    } else if (countdown.minutes > 0) {
      formattedTimeLeft = `${countdown.minutes} minute${countdown.minutes > 1 ? 's' : ''}, ${countdown.seconds} second${countdown.seconds > 1 ? 's' : ''}`;
    } else {
      formattedTimeLeft = `${countdown.seconds} second${countdown.seconds > 1 ? 's' : ''}`;
    }
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
 * Real-time countdown hook for React components
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
 * Real-time subscription status hook
 */
export function useSubscriptionStatus(user: any) {
  const [status, setStatus] = React.useState<SubscriptionStatus>(() => 
    getSubscriptionStatus(user)
  );

  React.useEffect(() => {
    if (!user) return;

    const updateStatus = () => {
      setStatus(getSubscriptionStatus(user));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [user]);

  return status;
}