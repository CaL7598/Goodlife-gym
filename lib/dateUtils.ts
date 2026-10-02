import { SubscriptionPlan } from '../types';

/**
 * Helper function to get current date as YYYY-MM-DD string in local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string as a local date (new Date('YYYY-MM-DD') would treat it as UTC)
 */
export function parseLocalDate(value: string): Date {
  const parts = value.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(value);
}

/**
 * Formats a stored expiry date for display ('Never' for Free plan / far-future dates)
 */
export function formatExpiryDate(expiryDate: string | null | undefined): string {
  if (!expiryDate || expiryDate.startsWith('9999-12-31')) return 'Never';
  return parseLocalDate(expiryDate).toLocaleDateString();
}

/**
 * Moves the date to the last day covered by a membership of the given number of months,
 * e.g. paid 2 Oct + 1 month = valid through 1 Nov (renews on 2 Nov).
 * If the target month is too short (paid 31 Jan), it runs to the end of that month (28/29 Feb).
 */
function addMonthsInclusive(date: Date, months: number): void {
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  // setDate(0) is the last day of the previous month (paid 1 Mar → valid through 31 Mar)
  date.setDate(day > lastDayOfMonth ? lastDayOfMonth : day - 1);
}

/** Gym closing time (8:00 PM). Clients still checked in after this are checked out automatically. */
export const GYM_CLOSING_HOUR = 20;

/**
 * When a check-in that was never closed should be automatically checked out:
 * closing time on the visit day, or the end of that day for check-ins made after closing.
 * MIGRATION_AUTO_CHECKOUT_CLIENT_CHECKINS.sql applies the same rule in the database.
 */
export function getAutoCheckOutTime(visitDate: string | undefined, checkInTime: string): Date {
  const day = visitDate ? parseLocalDate(visitDate) : new Date(checkInTime);
  const closing = new Date(day.getFullYear(), day.getMonth(), day.getDate(), GYM_CLOSING_HOUR, 0, 0, 0);
  if (new Date(checkInTime).getTime() >= closing.getTime()) {
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 0);
  }
  return closing;
}

/**
 * Calculates the expiry date based on the subscription plan and start date
 * @param plan - The subscription plan
 * @param startDate - The start date (Date object or ISO string)
 * @returns The expiry date as an ISO string (YYYY-MM-DD) or datetime (YYYY-MM-DDTHH:mm:ss) for day passes
 */
export function calculateExpiryDate(plan: SubscriptionPlan, startDate: Date | string = new Date()): string | null {
  // Debug logging
  console.log('[calculateExpiryDate] Input:', { plan, startDate, startDateType: typeof startDate });
  
  // Parse the start date correctly to avoid timezone issues
  let start: Date;
  if (typeof startDate === 'string') {
    // If it's a date string (YYYY-MM-DD), parse it as local date to avoid UTC issues
    const dateParts = startDate.split('T')[0].split('-');
    if (dateParts.length === 3) {
      // Create date in local timezone (month is 0-indexed)
      start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      console.log('[calculateExpiryDate] Parsed date parts:', dateParts, '→ Local date:', start.toLocaleDateString());
    } else {
      start = new Date(startDate);
      console.log('[calculateExpiryDate] Using Date constructor for:', startDate);
    }
  } else {
    // For Date objects, extract just the date part (year, month, day) to avoid timezone issues
    const d = new Date(startDate);
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    console.log('[calculateExpiryDate] Extracted date from Date object:', start.toLocaleDateString());
  }
  
  const expiry = new Date(start);
  console.log('[calculateExpiryDate] Initial expiry date:', expiry.toLocaleDateString());

  switch (plan) {
    case SubscriptionPlan.MONTHLY:
      // 1 month including the payment day (e.g. paid 2 Oct → expires 1 Nov, renews 2 Nov)
      addMonthsInclusive(expiry, 1);
      console.log('[calculateExpiryDate] Plan: MONTHLY - Added 1 month');
      break;
    
    case SubscriptionPlan.TWO_WEEKS:
      // 14 days including the payment day (e.g. paid 2 Oct → expires 15 Oct)
      const beforeDate = expiry.getDate();
      expiry.setDate(expiry.getDate() + 13);
      console.log('[calculateExpiryDate] Plan: TWO_WEEKS - 14 days (', beforeDate, '→', expiry.getDate(), ')');
      break;
    
    case SubscriptionPlan.ONE_WEEK:
      // 7 days including the payment day (e.g. paid 2 Oct → expires 8 Oct)
      expiry.setDate(expiry.getDate() + 6);
      console.log('[calculateExpiryDate] Plan: ONE_WEEK - 7 days');
      break;
    
    case SubscriptionPlan.DAY_MORNING:
      // Morning pass: expires at 11:00 AM on the same day
      expiry.setHours(11, 0, 0, 0);
      console.log('[calculateExpiryDate] Plan: DAY_MORNING - Expires at 11:00 AM same day');
      break;
    
    case SubscriptionPlan.DAY_EVENING:
      // Evening pass: expires at 8:00 PM (20:00) on the same day
      expiry.setHours(20, 0, 0, 0);
      console.log('[calculateExpiryDate] Plan: DAY_EVENING - Expires at 8:00 PM same day');
      break;
    
    case SubscriptionPlan.FREE:
      // Free plan: never expires - return null
      console.log('[calculateExpiryDate] Plan: FREE - Never expires');
      return null as any; // Return null to indicate never expires
    
    // Legacy plans
    case SubscriptionPlan.BASIC:
    case SubscriptionPlan.PREMIUM:
      // Add 1 month
      addMonthsInclusive(expiry, 1);
      console.log('[calculateExpiryDate] Plan: BASIC/PREMIUM - Added 1 month');
      break;

    case SubscriptionPlan.VIP:
      // Add 6 months
      addMonthsInclusive(expiry, 6);
      console.log('[calculateExpiryDate] Plan: VIP - Added 6 months');
      break;
    
    default:
      // Default to 1 month if plan is unknown
      console.warn('[calculateExpiryDate] Unknown plan:', plan, '- defaulting to 1 month');
      addMonthsInclusive(expiry, 1);
      break;
  }

  console.log('[calculateExpiryDate] After calculation:', expiry.toLocaleDateString(), expiry.toLocaleTimeString());

  // For day passes (DAY_MORNING, DAY_EVENING), return ISO datetime string with time
  // For other plans, return date string (YYYY-MM-DD) only
  if (plan === SubscriptionPlan.DAY_MORNING || plan === SubscriptionPlan.DAY_EVENING) {
    // Return ISO datetime string with time for day passes
    const year = expiry.getFullYear();
    const month = String(expiry.getMonth() + 1).padStart(2, '0');
    const day = String(expiry.getDate()).padStart(2, '0');
    const hours = String(expiry.getHours()).padStart(2, '0');
    const minutes = String(expiry.getMinutes()).padStart(2, '0');
    const seconds = String(expiry.getSeconds()).padStart(2, '0');
    const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    console.log('[calculateExpiryDate] Final result (datetime):', result);
    return result;
  } else {
    // Format as YYYY-MM-DD in local timezone for date-only plans
    const year = expiry.getFullYear();
    const month = String(expiry.getMonth() + 1).padStart(2, '0');
    const day = String(expiry.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    console.log('[calculateExpiryDate] Final result (date):', result);
    return result;
  }
}

/**
 * Calculates member status based on expiry date and plan
 * @param expiryDate - The expiry date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
 * @param plan - The subscription plan (to determine if it's a day pass)
 * @returns 'active' | 'expiring' | 'expired'
 */
export function calculateMemberStatus(expiryDate: string | null | undefined, plan: SubscriptionPlan): 'active' | 'expiring' | 'expired' {
  // Free plan never expires - always active
  if (plan === SubscriptionPlan.FREE) {
    return 'active';
  }
  
  if (!expiryDate) return 'active';
  
  const now = new Date();
  let expiry: Date;
  
  // Parse expiry date - handle both date-only and datetime formats
  if (expiryDate.includes('T')) {
    // Datetime format (day passes)
    expiry = new Date(expiryDate);
  } else {
    // Date-only format - the expiry date is the last day of the membership, so it stays valid
    // until the end of that day (paid 2 Oct → valid through 1 Nov → expired and renewable on 2 Nov)
    expiry = parseLocalDate(expiryDate);
    expiry.setHours(23, 59, 59, 999);
  }
  
  // Check if expired
  if (expiry < now) {
    return 'expired';
  }
  
  // Check if expiring soon
  // For day passes: expiring if within 1 hour
  // For other plans: expiring if within 7 days
  const timeUntilExpiry = expiry.getTime() - now.getTime();
  const isDayPass = plan === SubscriptionPlan.DAY_MORNING || plan === SubscriptionPlan.DAY_EVENING;
  
  if (isDayPass) {
    // Day pass: expiring if within 1 hour
    const oneHourMs = 60 * 60 * 1000;
    if (timeUntilExpiry <= oneHourMs) {
      return 'expiring';
    }
  } else {
    // Regular plans: expiring if within 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (timeUntilExpiry <= sevenDaysMs) {
      return 'expiring';
    }
  }
  
  return 'active';
}
