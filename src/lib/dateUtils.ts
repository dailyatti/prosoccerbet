/**
 * Professional date utilities for subscription and trial management
 * Handles timezone conversion, date comparisons, and user-friendly formatting
 */

export interface DateInfo {
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  formattedExpiry: string;
  formattedTimeLeft: string;
  progressPercentage: number;
}

export interface SubscriptionStatus {
  type: 'trial' | 'active' | 'expired' | 'inactive';
  text: string;
  color: string;
  hasAccess: boolean;
  daysLeft: number;
  formattedExpiry: string;
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
 * Calculate time difference between two dates
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
 * Get detailed information about a date (for trials/subscriptions)
 */
export function getDateInfo(
  expiryDate: string | null | undefined,
  startDate?: string | null
): DateInfo {
  const endDate = parseDate(expiryDate);
  const start = startDate ? parseDate(startDate) : getCurrentTime();
  
  if (!endDate) {
    return {
      isExpired: true,
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      formattedExpiry: 'No expiry date',
      formattedTimeLeft: 'Expired',
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
  
  // Format expiry date
  const formattedExpiry = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  // Format time left
  let formattedTimeLeft = 'Expired';
  if (!isExpired) {
    if (diff.days > 0) {
      formattedTimeLeft = `${diff.days} day${diff.days !== 1 ? 's' : ''} left`;
    } else if (diff.hours > 0) {
      formattedTimeLeft = `${diff.hours} hour${diff.hours !== 1 ? 's' : ''} left`;
    } else if (diff.minutes > 0) {
      formattedTimeLeft = `${diff.minutes} minute${diff.minutes !== 1 ? 's' : ''} left`;
    } else {
      formattedTimeLeft = `${diff.seconds} second${diff.seconds !== 1 ? 's' : ''} left`;
    }
  }
  
  return {
    isExpired,
    daysLeft: diff.days,
    hoursLeft: diff.hours,
    minutesLeft: diff.minutes,
    formattedExpiry,
    formattedTimeLeft,
    progressPercentage
  };
}

/**
 * Get subscription status with all relevant information
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
      formattedExpiry: 'N/A'
    };
  }
  
  const now = getCurrentTime();
  
  // Check trial status first
  if (!user.is_trial_used && user.trial_expires_at) {
    const trialInfo = getDateInfo(user.trial_expires_at);
    
    if (!trialInfo.isExpired) {
      return {
        type: 'trial',
        text: `Free Trial (${trialInfo.daysLeft} days left)`,
        color: 'from-blue-500 to-cyan-500',
        hasAccess: true,
        daysLeft: trialInfo.daysLeft,
        formattedExpiry: trialInfo.formattedExpiry
      };
    } else {
      return {
        type: 'expired',
        text: 'Trial Expired',
        color: 'from-red-500 to-pink-500',
        hasAccess: false,
        daysLeft: 0,
        formattedExpiry: trialInfo.formattedExpiry
      };
    }
  }
  
  // Check subscription status
  if (user.subscription_active && user.subscription_expires_at) {
    const subscriptionInfo = getDateInfo(user.subscription_expires_at);
    
    if (!subscriptionInfo.isExpired) {
      return {
        type: 'active',
        text: `Active Subscription (${subscriptionInfo.daysLeft} days left)`,
        color: 'from-green-500 to-emerald-500',
        hasAccess: true,
        daysLeft: subscriptionInfo.daysLeft,
        formattedExpiry: subscriptionInfo.formattedExpiry
      };
    } else {
      return {
        type: 'expired',
        text: 'Subscription Expired',
        color: 'from-red-500 to-pink-500',
        hasAccess: false,
        daysLeft: 0,
        formattedExpiry: subscriptionInfo.formattedExpiry
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
    formattedExpiry: 'N/A'
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