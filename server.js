import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import CommonJS module (arkesel-js) in ES module context
const require = createRequire(import.meta.url);
const Arkesel = require('arkesel-js');

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY);
// Get from email - can be with or without display name
const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';
// Format: if it doesn't have < >, add display name
const RESEND_FROM_EMAIL = fromEmailRaw.includes('<') ? fromEmailRaw : `Goodlife Fitness <${fromEmailRaw}>`;

// Initialize Arkesel SMS
const ARKESEL_SENDER_ID = process.env.ARKESEL_SENDER_ID || process.env.VITE_ARKESEL_SENDER_ID;
const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY || process.env.VITE_ARKESEL_API_KEY;
const arkeselClient = ARKESEL_SENDER_ID && ARKESEL_API_KEY ? new Arkesel(ARKESEL_SENDER_ID, ARKESEL_API_KEY) : null;

// Helper function to format phone number for Arkesel (233XXXXXXXXX format without +)
function formatPhoneNumber(phone) {
  if (!phone) return null;
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // If it doesn't start with country code, assume Ghana (233)
  if (!cleaned.startsWith('233')) {
    // If it starts with 0, replace with 233
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    } else {
      cleaned = '233' + cleaned;
    }
  }
  // Arkesel expects format: 233XXXXXXXXX (without +)
  return cleaned;
}

// Helper function to create SMS text from email content
function createWelcomeSMSText(memberName, plan, startDate, expiryDate) {
  return `Welcome to Goodlife Fitness, ${memberName}! Your ${plan} membership starts ${new Date(startDate).toLocaleDateString()} and expires ${new Date(expiryDate).toLocaleDateString()}. We're thrilled to have you! - Goodlife Fitness Team`;
}

function createPaymentSMSText(memberName, amount, paymentMethod, paymentDate, transactionId, expiryDate) {
  let text = `Payment Confirmed, ${memberName}! Amount: ₵${amount.toLocaleString()}, Method: ${paymentMethod}, Date: ${new Date(paymentDate).toLocaleDateString()}`;
  if (transactionId) {
    text += `, Transaction ID: ${transactionId}`;
  }
  if (expiryDate) {
    text += `. Membership expires: ${new Date(expiryDate).toLocaleDateString()}`;
  }
  text += ' - Goodlife Fitness';
  return text;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email API server is running' });
});

// Diagnostic endpoint to check email configuration
app.get('/api/email-config', (req, res) => {
  res.json({
    fromEmail: RESEND_FROM_EMAIL,
    apiKeySet: !!(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY),
    domain: RESEND_FROM_EMAIL.includes('@') ? RESEND_FROM_EMAIL.split('@')[1] : 'unknown',
    isTestDomain: RESEND_FROM_EMAIL.includes('@resend.dev'),
    suggestion: RESEND_FROM_EMAIL.includes('@resend.dev') 
      ? 'Using test domain. Update RESEND_FROM_EMAIL in .env to use your verified domain.'
      : 'Make sure "Enable Sending" is ON in Resend dashboard for your domain.'
  });
});

// Test email endpoint to diagnose issues
app.post('/api/test-email', async (req, res) => {
  try {
    const { toEmail } = req.body;
    const testEmail = toEmail || 'test@example.com';
    
    console.log('🧪 Testing email send to:', testEmail);
    console.log('📮 From email:', RESEND_FROM_EMAIL);
    
    const result = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [testEmail],
      subject: 'Test Email from Goodlife Fitness',
      html: '<p>This is a test email.</p>',
      text: 'This is a test email.'
    });
    
    if (result.error) {
      console.error('❌ Test email error:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error,
        details: JSON.stringify(result.error, null, 2)
      });
    }
    
    console.log('✅ Test email sent successfully:', result.data);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('❌ Test email exception:', error);
    console.error('📋 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Send welcome email
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { memberName, memberEmail, plan, startDate, expiryDate } = req.body;

    if (!memberEmail || !memberName) {
      return res.status(400).json({ error: 'memberEmail and memberName are required' });
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [memberEmail],
      subject: `Welcome to Goodlife Fitness, ${memberName}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #dc2626; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 2px;">GOODLIFE FITNESS</h1>
                        <p style="color: #fecaca; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Transform Your Body, Transform Your Life</p>
                      </td>
                    </tr>
                    <!-- Hero Section (colored block instead of image) -->
                    <tr>
                      <td style="background-color: #111827; padding: 60px 30px; text-align: center;">
                        <h2 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;">💪 Welcome to Your Journey!</h2>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Welcome, ${memberName}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          We're absolutely thrilled to welcome you to the Goodlife Fitness family! You've taken the first step towards a healthier, stronger, and more confident version of yourself.
                        </p>
                        
                        <!-- Membership Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 2px solid #dc2626; margin: 30px 0;">
                          <tr>
                            <td style="padding: 25px;">
                              <h3 style="color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px 0; text-align: center; font-weight: bold;">Your Membership Details</h3>
                              
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 12px 0; border-bottom: 1px solid #fca5a5;">
                                    <span style="color: #7f1d1d; font-size: 14px; font-weight: bold;">Membership Plan:</span>
                                  </td>
                                  <td align="right" style="padding: 12px 0; border-bottom: 1px solid #fca5a5;">
                                    <span style="background-color: #dc2626; color: #ffffff; padding: 8px 16px; font-size: 13px; font-weight: bold; display: inline-block;">${plan}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 12px 0; border-bottom: 1px solid #fca5a5;">
                                    <span style="color: #7f1d1d; font-size: 14px; font-weight: bold;">Start Date:</span>
                                  </td>
                                  <td align="right" style="padding: 12px 0; border-bottom: 1px solid #fca5a5;">
                                    <span style="color: #1f2937; font-size: 15px; font-weight: bold;">${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 12px 0;">
                                    <span style="color: #7f1d1d; font-size: 14px; font-weight: bold;">Expiry Date:</span>
                                  </td>
                                  <td align="right" style="padding: 12px 0;">
                                    <span style="color: #1f2937; font-size: 15px; font-weight: bold;">${new Date(expiryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA Section -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; margin: 35px 0;">
                          <tr>
                            <td style="padding: 30px; text-align: center;">
                              <p style="font-size: 16px; color: #1f2937; margin: 0 0 15px 0; font-weight: bold;">Ready to get started?</p>
                              <p style="font-size: 14px; color: #6b7280; margin: 0;">Visit us today and let our expert trainers help you achieve your fitness goals!</p>
                            </td>
                          </tr>
                        </table>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                          Our state-of-the-art facilities, expert trainers, and supportive community are here to help you every step of the way. If you have any questions, don't hesitate to reach out to us.
                        </p>
                        
                        <p style="color: #111827; font-size: 16px; font-weight: bold; margin: 20px 0 0 0;">
                          Let's make it happen together,<br>
                          <strong>The Goodlife Fitness Team</strong>
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #111827; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px;">
                        <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">GOODLIFE FITNESS</p>
                        <p style="margin: 15px 0;">
                          <a href="https://www.goodlifefitnessghana.com/" style="color: #dc2626; text-decoration: none; margin: 0 10px;">Visit Our Website</a> | 
                          <a href="mailto:goodlifeghana13@gmail.com" style="color: #dc2626; text-decoration: none; margin: 0 10px;">Email Us</a> | 
                          <a href="tel:+233551336976" style="color: #dc2626; text-decoration: none; margin: 0 10px;">0551336976</a>
                        </p>
                        <p style="margin: 10px 0; font-size: 12px; color: #9ca3af;">
                          <a href="tel:+233246458898" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0246458898</a> | 
                          <a href="tel:+233243505882" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0243505882</a> | 
                          <a href="tel:+233556620810" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0556620810</a>
                        </p>
                        <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151; font-size: 12px;">
                          © ${new Date().getFullYear()} Goodlife Fitness. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Welcome to Goodlife Fitness, ${memberName}!\n\nYour membership details:\n- Plan: ${plan}\n- Start Date: ${new Date(startDate).toLocaleDateString()}\n- Expiry Date: ${new Date(expiryDate).toLocaleDateString()}\n\nWe're thrilled to have you as part of our fitness community!\n\nBest regards,\nThe Goodlife Fitness Team`,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      console.error('📋 Resend error details:', JSON.stringify(error, null, 2));
      console.error('📮 From email being used:', RESEND_FROM_EMAIL);
      console.error('📧 To email:', memberEmail);
      
      // Extract error message
      const errorMessage = error.message || String(error);
      const errorCode = error.name || error.code || 'UNKNOWN_ERROR';
      
      // Provide helpful error message for test domain restrictions
      if (errorMessage.includes('testing emails') || errorMessage.includes('own email') || errorMessage.includes('test domain')) {
        return res.status(400).json({ 
          error: errorMessage,
          code: 'TEST_DOMAIN_RESTRICTION',
          fromEmail: RESEND_FROM_EMAIL,
          toEmail: memberEmail,
          suggestion: 'To send emails to external addresses, you need to verify your domain in Resend and ensure "Enable Sending" is ON. See RESEND_SETUP.md for step-by-step instructions.',
          help: '1. Go to Resend dashboard → Domains → goodlifefitnessghana.de\n2. Make sure "Enable Sending" toggle is ON (green)\n3. Verify all DNS records show "Verified" status\n4. Restart your server after making changes'
        });
      }
      
      // Check for domain verification issues
      if (errorMessage.includes('domain') || errorMessage.includes('verification') || errorMessage.includes('not verified') || errorMessage.includes('unauthorized')) {
        return res.status(400).json({ 
          error: errorMessage,
          code: 'DOMAIN_VERIFICATION_ERROR',
          fromEmail: RESEND_FROM_EMAIL,
          toEmail: memberEmail,
          suggestion: 'Your domain may not be fully verified or enabled for sending. Check Resend dashboard → Domains → goodlifefitnessghana.de',
          help: '1. Ensure domain status shows "Verified"\n2. Check that "Enable Sending" toggle is ON\n3. Verify all DNS records are correct'
        });
      }
      
      return res.status(400).json({ 
        error: errorMessage || 'Failed to send email',
        code: errorCode,
        details: error,
        fromEmail: RESEND_FROM_EMAIL,
        toEmail: memberEmail,
        suggestion: 'Check the server console for detailed error information. Common issues: domain not enabled for sending, rate limits, or API key issues.'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Send payment confirmation email
app.post('/api/send-payment-email', async (req, res) => {
  try {
    const { memberName, memberEmail, amount, paymentMethod, paymentDate, transactionId, expiryDate } = req.body;

    if (!memberEmail || !memberName) {
      return res.status(400).json({ error: 'memberEmail and memberName are required' });
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [memberEmail],
      subject: `Payment Confirmation - Goodlife Fitness`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
              .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
              .logo { color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; }
              .tagline { color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              .hero-image { width: 100%; height: 180px; object-fit: cover; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); display: block; }
              .content { padding: 40px 30px; }
              .greeting { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 15px; }
              .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
              .intro-text { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.8; text-align: center; }
              .payment-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; }
              .payment-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #065f46; margin-bottom: 20px; text-align: center; }
              .amount-display { text-align: center; margin: 25px 0; }
              .amount-value { font-size: 42px; font-weight: 900; color: #10b981; margin: 10px 0; }
              .amount-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #065f46; font-weight: 600; }
              .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #86efac; }
              .info-row:last-child { border-bottom: none; }
              .label { font-size: 14px; font-weight: 600; color: #065f46; }
              .value { font-size: 15px; font-weight: 700; color: #1f2937; }
              .transaction-id { background: #ffffff; padding: 10px 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; color: #111827; }
              .status-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
              .thank-you { text-align: center; margin: 35px 0; padding: 25px; background-color: #f9fafb; border-radius: 10px; }
              .thank-you-text { font-size: 16px; color: #1f2937; font-weight: 600; }
              .closing { font-size: 16px; color: #4b5563; margin-top: 30px; }
              .signature { font-size: 16px; font-weight: 700; color: #111827; margin-top: 20px; }
              .footer { background-color: #111827; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px; }
              .footer-links { margin: 15px 0; }
              .footer-links a { color: #dc2626; text-decoration: none; margin: 0 10px; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo">GOODLIFE FITNESS</div>
                <div class="tagline">Payment Confirmation</div>
              </div>
              <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=180&fit=crop" alt="Fitness Equipment" class="hero-image" />
              <div class="content">
                <div class="success-icon">✅</div>
                <div class="greeting">Payment Successful, ${memberName}!</div>
                <p class="intro-text">
                  Your payment has been successfully processed and your membership is now active.
                </p>
                
                <div class="payment-card">
                  <div class="payment-title">Payment Details</div>
                  <div class="amount-display">
                    <div class="amount-label">Amount Paid</div>
                    <div class="amount-value">₵${amount.toLocaleString()}</div>
                  </div>
                  <div class="info-row">
                    <span class="label">Payment Method:</span>
                    <span class="value">${paymentMethod}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Payment Date:</span>
                    <span class="value">${new Date(paymentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  ${transactionId ? `
                  <div class="info-row">
                    <span class="label">Transaction ID:</span>
                    <span class="transaction-id">${transactionId}</span>
                  </div>
                  ` : ''}
                  ${expiryDate ? `
                  <div class="info-row">
                    <span class="label">Membership Expiry Date:</span>
                    <span class="value">${new Date(expiryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  ` : ''}
                  <div style="text-align: center; margin-top: 20px;">
                    <span class="status-badge">✓ CONFIRMED</span>
                  </div>
                </div>

                <div class="thank-you">
                  <p class="thank-you-text">Thank you for your payment! 🎉</p>
                  <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">Your membership is active and you're all set to achieve your fitness goals.</p>
                </div>

                <p class="closing">
                  If you have any questions about this payment or your membership, please don't hesitate to contact us. We're here to support you on your fitness journey!
                </p>
                
                <p class="signature">
                  Keep pushing forward,<br>
                  <strong>The Goodlife Fitness Team</strong>
                </p>
              </div>
              
              <div class="footer">
                <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 15px;">GOODLIFE FITNESS</div>
                <div class="footer-links">
                  <a href="https://www.goodlifefitnessghana.com/">Visit Our Website</a> | 
                  <a href="mailto:hello@goodlifefitness.com">Email Us</a> | 
                  <a href="tel:+233551336976">0551336976</a>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
                  <a href="tel:+233246458898" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0246458898</a> | 
                  <a href="tel:+233243505882" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0243505882</a> | 
                  <a href="tel:+233556620810" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0556620810</a>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151; font-size: 12px;">
                  © ${new Date().getFullYear()} Goodlife Fitness. All rights reserved.
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Payment Confirmation - Goodlife Fitness\n\nHi ${memberName},\n\nYour payment has been successfully processed.\n\nPayment Details:\n- Amount: ₵${amount.toLocaleString()}\n- Payment Method: ${paymentMethod}\n- Payment Date: ${new Date(paymentDate).toLocaleDateString()}${transactionId ? `\n- Transaction ID: ${transactionId}` : ''}${expiryDate ? `\n- Membership Expiry Date: ${new Date(expiryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}\n\nYour membership is now active. We appreciate your continued support!\n\nBest regards,\nThe Goodlife Fitness Team`,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      console.error('📋 Resend error details:', JSON.stringify(error, null, 2));
      console.error('📮 From email being used:', RESEND_FROM_EMAIL);
      console.error('📧 To email:', memberEmail);
      
      // Extract error message
      const errorMessage = error.message || String(error);
      const errorCode = error.name || error.code || 'UNKNOWN_ERROR';
      
      // Provide helpful error message for test domain restrictions
      if (errorMessage.includes('testing emails') || errorMessage.includes('own email') || errorMessage.includes('test domain')) {
        return res.status(400).json({ 
          error: errorMessage,
          code: 'TEST_DOMAIN_RESTRICTION',
          fromEmail: RESEND_FROM_EMAIL,
          toEmail: memberEmail,
          suggestion: 'To send emails to external addresses, you need to verify your domain in Resend and ensure "Enable Sending" is ON. See RESEND_SETUP.md for step-by-step instructions.',
          help: '1. Go to Resend dashboard → Domains → goodlifefitnessghana.de\n2. Make sure "Enable Sending" toggle is ON (green)\n3. Verify all DNS records show "Verified" status\n4. Restart your server after making changes'
        });
      }
      
      // Check for domain verification issues
      if (errorMessage.includes('domain') || errorMessage.includes('verification') || errorMessage.includes('not verified') || errorMessage.includes('unauthorized')) {
        return res.status(400).json({ 
          error: errorMessage,
          code: 'DOMAIN_VERIFICATION_ERROR',
          fromEmail: RESEND_FROM_EMAIL,
          toEmail: memberEmail,
          suggestion: 'Your domain may not be fully verified or enabled for sending. Check Resend dashboard → Domains → goodlifefitnessghana.de',
          help: '1. Ensure domain status shows "Verified"\n2. Check that "Enable Sending" toggle is ON\n3. Verify all DNS records are correct'
        });
      }
      
      return res.status(400).json({ 
        error: errorMessage || 'Failed to send email',
        code: errorCode,
        details: error,
        fromEmail: RESEND_FROM_EMAIL,
        toEmail: memberEmail,
        suggestion: 'Check the server console for detailed error information. Common issues: domain not enabled for sending, rate limits, or API key issues.'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Send general message email
app.post('/api/send-message-email', async (req, res) => {
  try {
    const { memberName, memberEmail, subject, message } = req.body;

    if (!memberEmail || !memberName || !message) {
      return res.status(400).json({ error: 'memberEmail, memberName, and message are required' });
    }

    // Convert message text to HTML (preserve line breaks)
    const htmlMessage = message.replace(/\n/g, '<br>');

    // Check if using test domain and sending to external email
    const isTestDomain = RESEND_FROM_EMAIL.includes('@resend.dev');
    const recipientEmail = memberEmail.toLowerCase();
    const accountEmail = process.env.RESEND_ACCOUNT_EMAIL || '';
    
    if (isTestDomain && recipientEmail !== accountEmail.toLowerCase() && accountEmail) {
      return res.status(400).json({ 
        error: `Resend test domain restriction: You can only send emails to your own email address (${accountEmail}) when using the test domain. Please verify your domain in Resend dashboard or use your verified email address. See RESEND_SETUP.md for instructions.`,
        code: 'TEST_DOMAIN_RESTRICTION',
        suggestion: 'Verify your domain in Resend or update RESEND_FROM_EMAIL to use a verified domain'
      });
    }

    let data, error;
    try {
      const result = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [memberEmail],
        subject: subject || 'Message from Goodlife Fitness',
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
              .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center; }
              .logo { color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; }
              .tagline { color: #fecaca; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              .hero-image { width: 100%; height: 180px; object-fit: cover; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); display: block; }
              .content { padding: 40px 30px; }
              .greeting { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; }
              .message-box { background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); border: 2px solid #fecaca; border-left: 5px solid #dc2626; border-radius: 10px; padding: 30px; margin: 30px 0; font-size: 16px; color: #374151; line-height: 1.8; }
              .message-box p { margin-bottom: 15px; }
              .message-box p:last-child { margin-bottom: 0; }
              .closing { font-size: 16px; color: #4b5563; margin-top: 30px; }
              .signature { font-size: 16px; font-weight: 700; color: #111827; margin-top: 20px; }
              .footer { background-color: #111827; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px; }
              .footer-links { margin: 15px 0; }
              .footer-links a { color: #dc2626; text-decoration: none; margin: 0 10px; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo">GOODLIFE FITNESS</div>
                <div class="tagline">Stay Connected</div>
              </div>
              <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=180&fit=crop" alt="Gym Community" class="hero-image" />
              <div class="content">
                <div class="greeting">Hello ${memberName}! 👋</div>
                
                <div class="message-box">
                  ${htmlMessage}
                </div>

                <p class="closing">
                  We're here to support you every step of the way on your fitness journey. If you have any questions or need assistance, feel free to reach out to us.
                </p>
                
                <p class="signature">
                  Stay strong,<br>
                  <strong>The Goodlife Fitness Team</strong>
                </p>
              </div>
              
              <div class="footer">
                <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 15px;">GOODLIFE FITNESS</div>
                <div class="footer-links">
                  <a href="https://www.goodlifefitnessghana.com/">Visit Our Website</a> | 
                  <a href="mailto:hello@goodlifefitness.com">Email Us</a> | 
                  <a href="tel:+233551336976">0551336976</a>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
                  <a href="tel:+233246458898" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0246458898</a> | 
                  <a href="tel:+233243505882" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0243505882</a> | 
                  <a href="tel:+233556620810" style="color: #dc2626; text-decoration: none; margin: 0 8px;">0556620810</a>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151; font-size: 12px;">
                  © ${new Date().getFullYear()} Goodlife Fitness. All rights reserved.
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
        text: `Goodlife Fitness\n\nHi ${memberName},\n\n${message}\n\nBest regards,\nThe Goodlife Fitness Team`,
      });
      data = result.data;
      error = result.error;
    } catch (resendError) {
      console.error('❌ Resend API call failed:', resendError);
      console.error('📋 Resend error type:', typeof resendError);
      console.error('📋 Resend error stack:', resendError?.stack);
      error = resendError;
      data = null;
    }

    if (error) {
      console.error('❌ Resend error:', error);
      console.error('📋 Resend error details:', JSON.stringify(error, null, 2));
      console.error('📋 Error type:', typeof error);
      console.error('📮 From email being used:', RESEND_FROM_EMAIL);
      console.error('📧 To email:', memberEmail);
      
      // Extract error message - handle different error formats
      let errorMessage = 'Unknown error';
      let errorCode = 'UNKNOWN_ERROR';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.toString() || 'Unknown error';
        errorCode = error.name || error.code || error.type || 'UNKNOWN_ERROR';
      } else {
        errorMessage = String(error);
      }
      
      // Provide helpful error message for test domain restrictions
      if (errorMessage.includes('testing emails') || errorMessage.includes('own email') || errorMessage.includes('test domain')) {
        return res.status(400).json({ 
          error: errorMessage,
          code: 'TEST_DOMAIN_RESTRICTION',
          fromEmail: RESEND_FROM_EMAIL,
          toEmail: memberEmail,
          suggestion: 'To send emails to external addresses, you need to verify your domain in Resend and ensure "Enable Sending" is ON. See RESEND_SETUP.md for step-by-step instructions.',
          help: '1. Go to Resend dashboard → Domains → goodlifefitnessghana.de\n2. Make sure "Enable Sending" toggle is ON (green)\n3. Verify all DNS records show "Verified" status\n4. Restart your server after making changes'
        });
      }
      
      // Check for domain verification issues
      if (errorMessage.includes('domain') || errorMessage.includes('verification') || errorMessage.includes('not verified') || errorMessage.includes('unauthorized')) {
        return res.status(400).json({ 
          error: errorMessage,
          code: 'DOMAIN_VERIFICATION_ERROR',
          fromEmail: RESEND_FROM_EMAIL,
          toEmail: memberEmail,
          suggestion: 'Your domain may not be fully verified or enabled for sending. Check Resend dashboard → Domains → goodlifefitnessghana.de',
          help: '1. Ensure domain status shows "Verified"\n2. Check that "Enable Sending" toggle is ON\n3. Verify all DNS records are correct'
        });
      }
      
      return res.status(400).json({ 
        error: errorMessage || 'Failed to send email',
        code: errorCode,
        details: error,
        fromEmail: RESEND_FROM_EMAIL,
        toEmail: memberEmail,
        suggestion: 'Check the server console for detailed error information. Common issues: domain not enabled for sending, rate limits, or API key issues.'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Server error in send-message-email:', error);
    console.error('📋 Error stack:', error.stack);
    console.error('📮 From email being used:', RESEND_FROM_EMAIL);
    console.error('📧 To email:', req.body?.memberEmail || 'unknown');
    
    // Always return valid JSON, even on unexpected errors
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      fromEmail: RESEND_FROM_EMAIL,
      toEmail: req.body?.memberEmail || 'unknown',
      suggestion: 'An unexpected error occurred. Check the server console for details.'
    });
  }
});

// Global error handler middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error in middleware:', err);
  console.error('📋 Error stack:', err?.stack);
  if (!res.headersSent) {
    res.status(500).json({
      error: err?.message || 'Internal server error',
      code: 'UNHANDLED_ERROR',
      suggestion: 'An unexpected error occurred. Check the server console for details.'
    });
  }
});

// Send welcome SMS
app.post('/api/send-welcome-sms', async (req, res) => {
  try {
    const { memberName, memberPhone, plan, startDate, expiryDate } = req.body;

    if (!memberPhone || !memberName) {
      return res.status(400).json({ error: 'memberPhone and memberName are required' });
    }

    // Re-check environment variables in case they weren't loaded at startup
    const senderId = process.env.ARKESEL_SENDER_ID || process.env.VITE_ARKESEL_SENDER_ID;
    const apiKey = process.env.ARKESEL_API_KEY || process.env.VITE_ARKESEL_API_KEY;

    if (!senderId || !apiKey) {
      console.warn('⚠️ Arkesel not configured. Missing:', {
        senderId: !!senderId,
        apiKey: !!apiKey
      });
      return res.status(503).json({ 
        error: 'SMS service not configured',
        suggestion: senderId 
          ? 'Add ARKESEL_API_KEY to your .env file'
          : apiKey
          ? 'Add ARKESEL_SENDER_ID to your .env file. You need to register and get approval for a sender ID from Arkesel. See ARKESEL_SENDER_ID_GUIDE.md for instructions.'
          : 'Add ARKESEL_SENDER_ID and ARKESEL_API_KEY to your .env file. For sender ID, you need to register and get approval from Arkesel. See ARKESEL_SENDER_ID_GUIDE.md for instructions.'
      });
    }

    // Initialize Arkesel client if not already initialized
    let client = arkeselClient;
    if (!client) {
      try {
        client = new Arkesel(senderId, apiKey);
        console.log('✅ Arkesel client initialized');
      } catch (initError) {
        console.error('❌ Failed to initialize Arkesel client:', initError);
        return res.status(500).json({ 
          error: 'Failed to initialize SMS service',
          details: initError.message
        });
      }
    }

    const formattedPhone = formatPhoneNumber(memberPhone);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const messageText = createWelcomeSMSText(memberName, plan, startDate, expiryDate);

    console.log('📱 Attempting to send SMS:', {
      senderId: senderId,
      to: formattedPhone,
      messageLength: messageText.length
    });

    // Arkesel uses callback pattern, convert to Promise
    const result = await new Promise((resolve, reject) => {
      client.send(formattedPhone, messageText, null, (callback) => {
        if (callback && callback.status === 'success') {
          resolve(callback);
        } else {
          reject(new Error(callback?.message || 'Failed to send SMS'));
        }
      });
    });

    console.log('✅ Welcome SMS sent successfully:', result);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error sending welcome SMS:', error);
    console.error('Error details:', {
      message: error.message,
      error: error.toString()
    });
    res.status(500).json({ 
      error: error.message || 'Failed to send SMS',
      code: 'SMS_ERROR',
      details: error.toString()
    });
  }
});

// Send payment confirmation SMS
app.post('/api/send-payment-sms', async (req, res) => {
  try {
    const { memberName, memberPhone, amount, paymentMethod, paymentDate, transactionId, expiryDate } = req.body;

    if (!memberPhone || !memberName) {
      return res.status(400).json({ error: 'memberPhone and memberName are required' });
    }

    // Re-check environment variables in case they weren't loaded at startup
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.VITE_TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('⚠️ Twilio not configured. Skipping SMS send.');
      return res.status(503).json({ 
        error: 'SMS service not configured',
        suggestion: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your .env file'
      });
    }

    // Initialize Twilio client if not already initialized
    let client = twilioClient;
    if (!client) {
      try {
        client = twilio(accountSid, authToken);
        console.log('✅ Twilio client initialized');
      } catch (initError) {
        console.error('❌ Failed to initialize Twilio client:', initError);
        return res.status(500).json({ 
          error: 'Failed to initialize SMS service',
          details: initError.message
        });
      }
    }

    const formattedPhone = formatPhoneNumber(memberPhone);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const messageText = createPaymentSMSText(memberName, amount, paymentMethod, paymentDate, transactionId, expiryDate);

    console.log('📱 Attempting to send payment SMS:', {
      from: phoneNumber,
      to: formattedPhone,
      messageLength: messageText.length
    });

    const message = await client.messages.create({
      body: messageText,
      from: phoneNumber,
      to: formattedPhone
    });

    console.log('✅ Payment SMS sent successfully:', message.sid);
    res.json({ success: true, data: { sid: message.sid, status: message.status } });
  } catch (error) {
    console.error('❌ Error sending payment SMS:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    res.status(500).json({ 
      error: error.message || 'Failed to send SMS',
      code: error.code || 'SMS_ERROR',
      details: error.moreInfo || error.toString()
    });
  }
});

// Send general message SMS
app.post('/api/send-message-sms', async (req, res) => {
  try {
    const { memberName, memberPhone, message } = req.body;

    if (!memberPhone || !memberName || !message) {
      return res.status(400).json({ error: 'memberPhone, memberName, and message are required' });
    }

    // Re-check environment variables in case they weren't loaded at startup
    const senderId = process.env.ARKESEL_SENDER_ID || process.env.VITE_ARKESEL_SENDER_ID;
    const apiKey = process.env.ARKESEL_API_KEY || process.env.VITE_ARKESEL_API_KEY;

    if (!senderId || !apiKey) {
      console.warn('⚠️ Arkesel not configured. Skipping SMS send.');
      return res.status(503).json({ 
        error: 'SMS service not configured',
        suggestion: 'Add ARKESEL_SENDER_ID and ARKESEL_API_KEY to your .env file'
      });
    }

    // Initialize Arkesel client if not already initialized
    let client = arkeselClient;
    if (!client) {
      try {
        client = new Arkesel(senderId, apiKey);
        console.log('✅ Arkesel client initialized');
      } catch (initError) {
        console.error('❌ Failed to initialize Arkesel client:', initError);
        return res.status(500).json({ 
          error: 'Failed to initialize SMS service',
          details: initError.message
        });
      }
    }

    const formattedPhone = formatPhoneNumber(memberPhone);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Format message with greeting
    const messageText = `Goodlife Fitness\n\nHi ${memberName},\n\n${message}\n\n- Goodlife Fitness Team`;

    console.log('📱 Attempting to send message SMS:', {
      senderId: senderId,
      to: formattedPhone,
      messageLength: messageText.length
    });

    // Arkesel uses callback pattern, convert to Promise
    const result = await new Promise((resolve, reject) => {
      client.send(formattedPhone, messageText, null, (callback) => {
        if (callback && callback.status === 'success') {
          resolve(callback);
        } else {
          reject(new Error(callback?.message || 'Failed to send SMS'));
        }
      });
    });

    console.log('✅ Message SMS sent successfully:', result);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error sending message SMS:', error);
    console.error('Error details:', {
      message: error.message,
      error: error.toString()
    });
    res.status(500).json({ 
      error: error.message || 'Failed to send SMS',
      code: 'SMS_ERROR',
      details: error.toString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Email API server running on http://localhost:${PORT}`);
  console.log(`📧 Resend API configured: ${resend ? 'Yes' : 'No'}`);
  console.log(`📮 From Email: ${RESEND_FROM_EMAIL}`);
  console.log(`🔑 API Key: ${process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY ? 'Set' : 'Missing'}`);
  console.log(`📱 Arkesel SMS configured: ${arkeselClient ? 'Yes' : 'No'}`);
  if (twilioClient && TWILIO_PHONE_NUMBER) {
    console.log(`📞 Twilio Phone: ${TWILIO_PHONE_NUMBER}`);
  } else {
    console.log(`⚠️  Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env`);
  }
  if (RESEND_FROM_EMAIL.includes('@resend.dev')) {
    console.log(`⚠️  WARNING: Using test domain. Update RESEND_FROM_EMAIL in .env to use your verified domain!`);
  } else if (RESEND_FROM_EMAIL.includes('goodlifefitnessghana.de')) {
    console.log(`✅ Using verified domain: goodlifefitnessghana.de`);
  }
});


