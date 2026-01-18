/**
 * Logger utility that respects production environment
 * Automatically disables console logs in production to prevent sensitive data exposure
 */

const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

/**
 * Safe logger that only logs in development
 */
export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but sanitize sensitive data in production
    if (isProduction) {
      // In production, log errors without sensitive details
      const sanitized = args.map(arg => {
        if (typeof arg === 'string') {
          // Remove email addresses from error messages
          return arg.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
        }
        return arg;
      });
      console.error(...sanitized);
    } else {
      console.error(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  }
};

/**
 * Dev-only logger - only logs in development, completely silent in production
 */
export const devLog = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};
