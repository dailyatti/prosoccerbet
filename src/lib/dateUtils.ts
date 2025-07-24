/**
 * Professzionális dátum utilities előfizetés és trial kezeléshez
 * Timezone konverzió, dátum összehasonlítás, felhasználóbarát formázás
 * Valós idejű visszaszámláló funkcionalitás Supabase integrációval
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
 * Professzionális ISO dátum string feldolgozás timezone kezeléssel
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // ISO string kezelése timezone-nal
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
 * Jelenlegi idő UTC-ben - Supabase szinkronizálva
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
 * Gyors lokális idő lekérés
 */
export function getCurrentTime(): Date {
  return new Date();
}

/**
 * Idő különbség számítás két dátum között valós idejű precizitással
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
 * Professzionális valós idejű visszaszámláló információ
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
      statusMessage: 'Lejárt',
      recommendedAction: 'Előfizetés megújítása szükséges',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lastUpdated: now
    };
  }
  
  const diff = getTimeDifference(endDate, now);
  const isExpired = diff.total <= 0;
  
  // Haladás százalék számítás
  let progressPercentage = 0;
  if (startDate && start) {
    const totalDuration = endDate.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  } else {
    // Ha nincs start dátum, becsüljük 3 napos trial alapján
    const estimatedStart = new Date(endDate.getTime() - (3 * 24 * 60 * 60 * 1000));
    const totalDuration = endDate.getTime() - estimatedStart.getTime();
    const elapsed = now.getTime() - estimatedStart.getTime();
    progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }
  
  // Lejárat közelség ellenőrzés és sürgősségi szint
  const hoursLeft = diff.total / (1000 * 60 * 60);
  const isExpiringSoon = !isExpired && diff.total <= 24 * 60 * 60 * 1000;
  
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  let statusMessage: string;
  let recommendedAction: string;
  
  if (isExpired) {
    urgencyLevel = 'critical';
    statusMessage = 'VIP hozzáférés lejárt';
    recommendedAction = 'Azonnali megújítás szükséges';
  } else if (hoursLeft <= 1) {
    urgencyLevel = 'critical';
    statusMessage = 'VIP hozzáférés 1 órán belül lejár!';
    recommendedAction = 'Sürgősen újítsd meg előfizetésed';
  } else if (hoursLeft <= 6) {
    urgencyLevel = 'high';
    statusMessage = 'VIP hozzáférés hamarosan lejár';
    recommendedAction = 'Javasoljuk az előfizetés megújítását';
  } else if (diff.days === 0) {
    urgencyLevel = 'medium';
    statusMessage = 'VIP hozzáférés ma lejár';
    recommendedAction = 'Ne felejts el megújítani';
  } else {
    urgencyLevel = 'low';
    statusMessage = `${diff.days} nap VIP hozzáférés van hátra`;
    recommendedAction = 'Élvezd a VIP szolgáltatásokat';
  }
  
  // Visszaszámláló string formázás magyar nyelven
  let formatted = 'Expired';
  if (!isExpired) {
    if (diff.days > 0) {
      formatted = `${diff.days} nap ${diff.hours} óra ${diff.minutes} perc`;
    } else if (diff.hours > 0) {
      formatted = `${diff.hours} óra ${diff.minutes} perc ${diff.seconds} mp`;
    } else if (diff.minutes > 0) {
      formatted = `${diff.minutes} perc ${diff.seconds} másodperc`;
    } else {
      formatted = `${diff.seconds} másodperc`;
    }
  } else {
    formatted = 'Lejárt';
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
 * Visszafelé kompatibilitás a régi funkcióval
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
 * Részletes dátum információ (trial/előfizetés) valós idejű frissítéssel
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
  
  // Format time left with real-time precision
  let formattedTimeLeft = 'Expired';
  if (!countdown.isExpired) {
    if (countdown.days > 0) {
      formattedTimeLeft = `${countdown.days} nap, ${countdown.hours} óra van hátra`;
    } else if (countdown.hours > 0) {
      formattedTimeLeft = `${countdown.hours} óra, ${countdown.minutes} perc van hátra`;
    } else if (countdown.minutes > 0) {
      formattedTimeLeft = `${countdown.minutes} perc, ${countdown.seconds} másodperc van hátra`;
    } else {
      formattedTimeLeft = `${countdown.seconds} másodperc van hátra`;
    }
  } else {
    formattedTimeLeft = 'Lejárt';
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
 * Előfizetés státusz minden releváns információval és valós idejű visszaszámlálóval
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
      text: 'Nincs bejelentkezve',
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
  
  // Először trial státusz ellenőrzés
  if (!user.is_trial_used && user.trial_expires_at) {
    const trialInfo = getDateInfo(user.trial_expires_at);
    
    if (!trialInfo.isExpired) {
      return {
        type: 'trial',
        text: `3 Napos VIP Trial (${trialInfo.daysLeft}n ${trialInfo.hoursLeft}ó hátra)`,
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
        text: '3 Napos VIP Trial Lejárt',
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
  
  // Előfizetés státusz ellenőrzés
  if (user.subscription_active && user.subscription_expires_at) {
    const subscriptionInfo = getDateInfo(user.subscription_expires_at);
    
    if (!subscriptionInfo.isExpired) {
      return {
        type: 'active',
        text: `Aktív VIP Előfizetés (${subscriptionInfo.daysLeft}n ${subscriptionInfo.hoursLeft}ó hátra)`,
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
        text: 'VIP Előfizetés Lejárt',
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
  
  // Nincs aktív előfizetés vagy trial
  return {
    type: 'inactive',
    text: 'Nincs Aktív VIP Előfizetés',
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
 * Prémium funkciókhoz való hozzáférés ellenőrzése
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
 * Valós idejű visszaszámláló hook React komponensekhez - Supabase szinkronizálással
 */
export function useProfessionalCountdown(expiryDate: string | null | undefined) {
  const [countdown, setCountdown] = React.useState<ProfessionalCountdownInfo>(() => 
    getProfessionalCountdownInfo(expiryDate)
  );
  const [serverTimeSynced, setServerTimeSynced] = React.useState(false);

  React.useEffect(() => {
    if (!expiryDate) return;

    // Szerver idő szinkronizáció
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

    // Azonnali frissítés
    syncServerTime();
    updateCountdown();

    // Másodpercenkénti frissítés valós idejű visszaszámláláshoz
    const interval = setInterval(updateCountdown, 1000);

    // 5 percenként szerver idő szinkronizáció
    const syncInterval = setInterval(syncServerTime, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [expiryDate]);

  return { ...countdown, serverTimeSynced };
}

/**
 * Visszafelé kompatibilitás a régi hook-kal
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
 * Valós idejű előfizetés státusz hook - Supabase integrációval
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

    // Azonnali frissítés
    updateStatus();

    // Másodpercenkénti frissítés valós idejű visszaszámláláshoz
    const interval = setInterval(updateStatus, 1000);

    // Supabase változások figyelése (ha elérhető)
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
 * VIP trial specifikus információk
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
      'AI Prompt Generator teljes hozzáférés',
      'Arbitrage Calculator korlátlan használat', 
      'VIP Tips exkluzív tartalmak',
      'Prioritás támogatás',
      'Mobil optimalizált élmény'
    ],
    upgradeMessage: countdown.isExpiringSoon 
      ? 'Ne veszítsd el VIP hozzáférésedet! Frissíts most.'
      : 'Élvezd a VIP élményt, és frissíts a folyamatos hozzáférésért.'
  };
}

/**
 * Professzionális értesítés rendszer a visszaszámlálóhoz
 */
export function useCountdownNotifications(user: any, onNotify?: (notification: any) => void) {
  const status = useSubscriptionStatus(user);
  const [lastNotificationTime, setLastNotificationTime] = React.useState<number>(0);

  React.useEffect(() => {
    if (!user || !onNotify) return;

    const now = Date.now();
    const hoursLeft = status.hoursLeft;
    
    // Értesítések logikája
    if (status.type === 'trial' && !status.isExpired) {
      // 24 óra előtt
      if (hoursLeft <= 24 && hoursLeft > 12 && (now - lastNotificationTime) > 6 * 60 * 60 * 1000) {
        onNotify({
          type: 'warning',
          title: '3 Napos VIP Trial hamarosan lejár',
          message: `${Math.round(hoursLeft)} óra van hátra a VIP hozzáférésedből.`,
          action: 'Frissítés most'
        });
        setLastNotificationTime(now);
      }
      
      // 12 óra előtt
      if (hoursLeft <= 12 && hoursLeft > 6 && (now - lastNotificationTime) > 3 * 60 * 60 * 1000) {
        onNotify({
          type: 'warning',
          title: 'VIP Trial ma lejár!',
          message: `Csak ${Math.round(hoursLeft)} óra van hátra. Ne veszítsd el a hozzáférést!`,
          action: 'Azonnali frissítés'
        });
        setLastNotificationTime(now);
      }
      
      // 1 óra előtt
      if (hoursLeft <= 1 && hoursLeft > 0 && (now - lastNotificationTime) > 30 * 60 * 1000) {
        onNotify({
          type: 'critical',
          title: 'VIP Trial 1 órán belül lejár!',
          message: 'Sürgősen frissítsd előfizetésed a folyamatos hozzáférésért.',
          action: 'Sürgős frissítés'
        });
        setLastNotificationTime(now);
      }
    }
    
    // Lejárt trial
    if (status.type === 'expired' && (now - lastNotificationTime) > 24 * 60 * 60 * 1000) {
      onNotify({
        type: 'error',
        title: '3 Napos VIP Trial lejárt',
        message: 'Frissíts most a VIP funkciók visszaszerzéséért.',
        action: 'Előfizetés aktiválása'
      });
      setLastNotificationTime(now);
    }
  }, [status, user, onNotify, lastNotificationTime]);

  return {
    shouldShowUpgradePrompt: status.type === 'trial' && status.hoursLeft <= 24,
    urgencyLevel: status.isExpiringSoon ? 'high' : 'normal',
    return () => clearInterval(interval);
  }, [user]);

  return status;
}