import { SubscriptionPlan } from '../types';

/**
 * Calculates the expiry date based on the subscription plan and start date
 * @param plan - The subscription plan
 * @param startDate - The start date (Date object or ISO string)
 * @returns The expiry date as an ISO string (YYYY-MM-DD)
 */
export function calculateExpiryDate(plan: SubscriptionPlan, startDate: Date | string = new Date()): string {
  // Parse the start date correctly to avoid timezone issues
  let start: Date;
  if (typeof startDate === 'string') {
    // If it's a date string (YYYY-MM-DD), parse it as local date to avoid UTC issues
    const dateParts = startDate.split('T')[0].split('-');
    if (dateParts.length === 3) {
      // Create date in local timezone (month is 0-indexed)
      start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    } else {
      start = new Date(startDate);
    }
  } else {
    // For Date objects, extract just the date part (year, month, day) to avoid timezone issues
    const d = new Date(startDate);
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  
  const expiry = new Date(start);

  switch (plan) {
    case SubscriptionPlan.MONTHLY:
      // Add 1 month
      expiry.setMonth(expiry.getMonth() + 1);
      break;
    
    case SubscriptionPlan.TWO_WEEKS:
      // Add 14 days
      expiry.setDate(expiry.getDate() + 14);
      break;
    
    case SubscriptionPlan.ONE_WEEK:
      // Add 7 days
      expiry.setDate(expiry.getDate() + 7);
      break;
    
    case SubscriptionPlan.DAY_MORNING:
    case SubscriptionPlan.DAY_EVENING:
      // Add 1 day
      expiry.setDate(expiry.getDate() + 1);
      break;
    
    // Legacy plans
    case SubscriptionPlan.BASIC:
    case SubscriptionPlan.PREMIUM:
      // Add 1 month
      expiry.setMonth(expiry.getMonth() + 1);
      break;
    
    case SubscriptionPlan.VIP:
      // Add 6 months
      expiry.setMonth(expiry.getMonth() + 6);
      break;
    
    default:
      // Default to 1 month if plan is unknown
      expiry.setMonth(expiry.getMonth() + 1);
      break;
  }

  // Format as YYYY-MM-DD in local timezone to avoid timezone conversion issues
  const year = expiry.getFullYear();
  const month = String(expiry.getMonth() + 1).padStart(2, '0');
  const day = String(expiry.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

