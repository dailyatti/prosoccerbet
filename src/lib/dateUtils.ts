/**
 * Professional date utilities for subscription and trial management
 * Handles timezone conversion, date comparisons, and user-friendly formatting
 * Includes real-time countdown functionality
 */

import React from 'react';

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
 * Parse ISO date string and handle timezone conversion
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Handle ISO string with timezone
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
}

/**
 * Get current time in UTC
 */
export function getCurrentTime(): Date {
  return new Date();
}

/**
 * Calculate time difference between two dates with real-time precision
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
 * Get real-time countdown information
 */
export function getCountdownInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): CountdownInfo {
  const endDate = parseDate(expiryDate);
  const start = startDate ? parseDate(startDate) : getCurrentTime();
  
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
      progressPercentage: 0
    };
  }
  
  const diff = getTimeDifference(endDate, start);
  const isExpired = diff.total <= 0;
  
  // Calculate progress percentage
  let progressPercentage = 0;
  if (startDate && start) {
    const totalDuration = endDate.getTime() - start.getTime();
    const elapsed = getCurrentTime().getTime() - start.getTime();
    progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }
  
  // Check if expiring soon (within 24 hours)
  const isExpiringSoon = !isExpired && diff.total <= 24 * 60 * 60 * 1000;
  
  // Format countdown string
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
 * Get detailed information about a date (for trials/subscriptions) with real-time updates
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
  
  // Format expiry date with timezone
  const formattedExpiry = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  // Format time left with real-time precision
  let formattedTimeLeft = 'Expired';
  if (!countdown.isExpired) {
    if (countdown.days > 0) {
      formattedTimeLeft = `${countdown.days} day${countdown.days !== 1 ? 's' : ''}, ${countdown.hours} hour${countdown.hours !== 1 ? 's' : ''} left`;
    } else if (countdown.hours > 0) {
      formattedTimeLeft = `${countdown.hours} hour${countdown.hours !== 1 ? 's' : ''}, ${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''} left`;
    } else if (countdown.minutes > 0) {
      formattedTimeLeft = `${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''}, ${countdown.seconds} second${countdown.seconds !== 1 ? 's' : ''} left`;
    } else {
      formattedTimeLeft = `${countdown.seconds} second${countdown.seconds !== 1 ? 's' : ''} left`;
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
 * Get subscription status with all relevant information and real-time countdown
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
  
  // Check trial status first
  if (!user.is_trial_used && user.trial_expires_at) {
    const trialInfo = getDateInfo(user.trial_expires_at);
    
    if (!trialInfo.isExpired) {
      return {
        type: 'trial',
        text: `Free Trial (${trialInfo.daysLeft}d ${trialInfo.hoursLeft}h left)`,
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
        text: 'Trial Expired',
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
        text: `Active Subscription (${subscriptionInfo.daysLeft}d ${subscriptionInfo.hoursLeft}h left)`,
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
        text: 'Subscription Expired',
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
 * Check if user has access to premium features
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
 * Create a real-time countdown hook for React components
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

    // Update immediately
    updateCountdown();

    // Update every second for real-time countdown
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  return countdown;
}

/**
 * Create a real-time subscription status hook
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

    // Update immediately
    updateStatus();

    // Update every second for real-time countdown
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [user]);

  return status;
} 