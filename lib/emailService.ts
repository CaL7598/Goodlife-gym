/**
 * Email Service using Resend API via Backend Proxy
 * 
 * This service calls our backend API server which handles Resend API calls
 * to avoid CORS issues and keep the API key secure on the server-side.
 * 
 * In development, Vite proxy forwards /api/* requests to the backend server.
 * In production, set VITE_API_URL to your deployed backend URL.
 * 
 * This service also sends SMS via Twilio when emails are sent.
 */

import { sendWelcomeSMS, sendPaymentSMS, sendMessageSMS } from './smsService';

// Use relative URL for Vite proxy in development, or absolute URL in production
// In production, if VITE_API_URL is not set, email/SMS features will be disabled
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : null);

export interface WelcomeEmailParams {
  memberName: string;
  memberEmail: string;
  memberPhone?: string; // Phone number for SMS
  plan: string;
  startDate: string;
  expiryDate: string;
}

export interface PaymentEmailParams {
  memberName: string;
  memberEmail: string;
  memberPhone?: string; // Phone number for SMS
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId?: string;
  expiryDate?: string;
}

export interface MessageEmailParams {
  memberName: string;
  memberEmail: string;
  memberPhone?: string; // Phone number for SMS
  subject: string;
  message: string;
  messageType?: 'welcome' | 'reminder' | 'expiry' | 'general';
}

/**
 * Send welcome email to new member (and SMS if phone number provided)
 */
export const sendWelcomeEmail = async (params: WelcomeEmailParams): Promise<boolean> => {
  if (!API_BASE_URL) {
    const errorMsg = '❌ Email service not configured: VITE_API_URL environment variable is not set. Email features are disabled. Please deploy the backend server (server.js) and set VITE_API_URL to your backend URL. See EMAIL_FIX_GUIDE.md for detailed instructions.';
    console.error(errorMsg);
    return false;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberName: params.memberName,
        memberEmail: params.memberEmail,
        plan: params.plan,
        startDate: params.startDate,
        expiryDate: params.expiryDate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending welcome email:', error);
      return false;
    }

    const data = await response.json();
    console.log('Welcome email sent successfully to', params.memberEmail, data);

    // Also send SMS if phone number is provided
    if (params.memberPhone) {
      try {
        await sendWelcomeSMS({
          memberName: params.memberName,
          memberPhone: params.memberPhone,
          plan: params.plan,
          startDate: params.startDate,
          expiryDate: params.expiryDate,
        });
      } catch (smsError) {
        console.warn('Failed to send welcome SMS (email was sent):', smsError);
        // Don't fail the whole operation if SMS fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Send payment confirmation email (and SMS if phone number provided)
 */
export const sendPaymentEmail = async (params: PaymentEmailParams): Promise<boolean> => {
  if (!API_BASE_URL) {
    const errorMsg = '❌ Email service not configured: VITE_API_URL environment variable is not set. Email features are disabled. Please deploy the backend server (server.js) and set VITE_API_URL to your backend URL. See EMAIL_FIX_GUIDE.md for detailed instructions.';
    console.error(errorMsg);
    return false;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-payment-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberName: params.memberName,
        memberEmail: params.memberEmail,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        paymentDate: params.paymentDate,
        transactionId: params.transactionId,
        expiryDate: params.expiryDate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending payment email:', error);
      return false;
    }

    const data = await response.json();
    console.log('Payment confirmation email sent successfully to', params.memberEmail, data);

    // Also send SMS if phone number is provided
    if (params.memberPhone) {
      try {
        await sendPaymentSMS({
          memberName: params.memberName,
          memberPhone: params.memberPhone,
          amount: params.amount,
          paymentMethod: params.paymentMethod,
          paymentDate: params.paymentDate,
          transactionId: params.transactionId,
          expiryDate: params.expiryDate,
        });
      } catch (smsError) {
        console.warn('Failed to send payment SMS (email was sent):', smsError);
        // Don't fail the whole operation if SMS fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending payment email:', error);
    return false;
  }
};

/**
 * Send general message email to member (and SMS if phone number provided)
 */
export const sendMessageEmail = async (params: MessageEmailParams): Promise<{ success: boolean; error?: any }> => {
  if (!API_BASE_URL) {
    console.warn('Email service not configured: VITE_API_URL not set. Email features disabled.');
    return { 
      success: false, 
      error: {
        error: 'Email service not configured',
        message: 'VITE_API_URL environment variable is not set. Please configure the backend API URL to enable email features.',
        suggestion: 'Set VITE_API_URL to your deployed backend server URL'
      }
    };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-message-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberName: params.memberName,
        memberEmail: params.memberEmail,
        subject: params.subject,
        message: params.message,
      }),
    });

    if (!response.ok) {
      let error;
      try {
        const text = await response.text();
        error = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` };
      } catch (parseError) {
        error = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: 'Server returned an invalid response',
          suggestion: 'Check the server console for detailed error information'
        };
      }
      console.error('Error sending message email:', error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('Message email sent successfully to', params.memberEmail, data);

    // Also send SMS if phone number is provided
    if (params.memberPhone) {
      try {
        await sendMessageSMS({
          memberName: params.memberName,
          memberPhone: params.memberPhone,
          message: params.message,
          messageType: params.messageType,
        });
      } catch (smsError) {
        console.warn('Failed to send message SMS (email was sent):', smsError);
        // Don't fail the whole operation if SMS fails
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending message email:', error);
    return { 
      success: false, 
      error: {
        error: error.message || 'Network error or server unavailable',
        message: 'Failed to communicate with the email server',
        suggestion: 'Check if the server is running and accessible'
      }
    };
  }
};

/**
 * Send message email to multiple recipients (for broadcast)
 * Also sends SMS to recipients with phone numbers
 */
export const sendBulkMessageEmails = async (recipients: MessageEmailParams[]): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  // Send emails sequentially to avoid rate limiting issues
  for (const recipient of recipients) {
    const result = await sendMessageEmail(recipient);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
};

