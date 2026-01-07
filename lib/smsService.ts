/**
 * SMS Service using Twilio API via Backend Proxy
 * 
 * This service calls our backend API server which handles Twilio API calls
 * to avoid CORS issues and keep the API credentials secure on the server-side.
 * 
 * In development, Vite proxy forwards /api/* requests to the backend server.
 * In production, set VITE_API_URL to your deployed backend URL.
 */

// Use relative URL for Vite proxy in development, or absolute URL in production
// In production, if VITE_API_URL is not set, SMS features will be disabled
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : null);

export interface WelcomeSMSParams {
  memberName: string;
  memberPhone: string;
  plan: string;
  startDate: string;
  expiryDate: string;
}

export interface PaymentSMSParams {
  memberName: string;
  memberPhone: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId?: string;
  expiryDate?: string;
}

export interface MessageSMSParams {
  memberName: string;
  memberPhone: string;
  message: string;
  messageType?: 'welcome' | 'reminder' | 'expiry' | 'general';
}

/**
 * Send welcome SMS to new member
 */
export const sendWelcomeSMS = async (params: WelcomeSMSParams): Promise<boolean> => {
  if (!API_BASE_URL) {
    console.warn('SMS service not configured: VITE_API_URL not set. SMS features disabled.');
    return false;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-welcome-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberName: params.memberName,
        memberPhone: params.memberPhone,
        plan: params.plan,
        startDate: params.startDate,
        expiryDate: params.expiryDate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending welcome SMS:', error);
      return false;
    }

    const data = await response.json();
    console.log('Welcome SMS sent successfully to', params.memberPhone, data);
    return true;
  } catch (error) {
    console.error('Error sending welcome SMS:', error);
    return false;
  }
};

/**
 * Send payment confirmation SMS
 */
export const sendPaymentSMS = async (params: PaymentSMSParams): Promise<boolean> => {
  if (!API_BASE_URL) {
    console.warn('SMS service not configured: VITE_API_URL not set. SMS features disabled.');
    return false;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-payment-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberName: params.memberName,
        memberPhone: params.memberPhone,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        paymentDate: params.paymentDate,
        transactionId: params.transactionId,
        expiryDate: params.expiryDate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending payment SMS:', error);
      return false;
    }

    const data = await response.json();
    console.log('Payment confirmation SMS sent successfully to', params.memberPhone, data);
    return true;
  } catch (error) {
    console.error('Error sending payment SMS:', error);
    return false;
  }
};

/**
 * Send general message SMS to member
 */
export const sendMessageSMS = async (params: MessageSMSParams): Promise<{ success: boolean; error?: any }> => {
  if (!API_BASE_URL) {
    console.warn('SMS service not configured: VITE_API_URL not set. SMS features disabled.');
    return { 
      success: false, 
      error: {
        error: 'SMS service not configured',
        message: 'VITE_API_URL environment variable is not set. Please configure the backend API URL to enable SMS features.',
        suggestion: 'Set VITE_API_URL to your deployed backend server URL'
      }
    };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-message-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberName: params.memberName,
        memberPhone: params.memberPhone,
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
      console.error('Error sending message SMS:', error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('Message SMS sent successfully to', params.memberPhone, data);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending message SMS:', error);
    return { 
      success: false, 
      error: {
        error: error.message || 'Network error or server unavailable',
        message: 'Failed to communicate with the SMS server',
        suggestion: 'Check if the server is running and accessible'
      }
    };
  }
};

/**
 * Send message SMS to multiple recipients (for broadcast)
 */
export const sendBulkMessageSMS = async (recipients: MessageSMSParams[]): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  // Send SMS sequentially to avoid rate limiting issues
  for (const recipient of recipients) {
    const result = await sendMessageSMS(recipient);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { success, failed };
};

