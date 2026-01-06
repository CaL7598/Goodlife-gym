# Twilio SMS Setup Guide

This guide will help you set up Twilio SMS functionality so that members receive SMS notifications alongside email notifications.

## Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up for a free account (or log in if you already have one)
3. Complete the account verification process

## Step 2: Get Your Twilio Credentials

1. After logging in, go to the [Twilio Console Dashboard](https://console.twilio.com/)
2. You'll see your **Account SID** and **Auth Token** on the dashboard
3. Copy both values (you'll need them for your `.env` file)

## Step 3: Get a Twilio Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a phone number (you can use a trial number for testing)
3. Copy the phone number (it will look like: `+1234567890`)

**Note:** 
- Trial accounts can only send SMS to verified phone numbers
- To send SMS to any phone number, you'll need to upgrade to a paid account
- For Ghana, you can search for phone numbers with country code +233

## Step 4: Add Credentials to Your .env File

1. Open your `.env` file in the project root
2. Add the following lines:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Replace:
- `your_account_sid_here` with your Account SID from Step 2
- `your_auth_token_here` with your Auth Token from Step 2
- `+1234567890` with your Twilio phone number from Step 3

Your complete `.env` file should look like:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Gemini API Key (for AI features)
GEMINI_API_KEY=your_gemini_api_key

# Resend Email Configuration
VITE_RESEND_API_KEY=re_your_actual_api_key_here
VITE_RESEND_FROM_EMAIL=Goodlife Fitness <onboarding@resend.dev>

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 5: Restart Your Server

After adding the Twilio credentials, restart your development server:

```bash
npm run dev:all
```

Or if running separately:

```bash
# Terminal 1 - Backend Server
npm run dev:server

# Terminal 2 - Frontend Server
npm run dev
```

## Step 6: Test SMS Functionality

1. **Welcome SMS (Member Registration)**:
   - Go to the Admin Dashboard → Members
   - Click "Register New Member"
   - Fill in the form with a valid email and phone number
   - Submit the form
   - The member should receive both an email and SMS

2. **Payment Confirmation SMS**:
   - Go to the Admin Dashboard → Payments
   - Record a new payment for a member with a valid email and phone number
   - Confirm the payment
   - The member should receive both an email and SMS

3. **General Message SMS**:
   - Go to Communication Center
   - Select a member with a phone number
   - Send a message
   - The member should receive both an email and SMS

## How It Works

- **Automatic SMS**: Whenever an email is sent to a member, an SMS with the same message content is automatically sent to their phone number (if provided)
- **Phone Number Formatting**: The system automatically formats phone numbers to include the country code (+233 for Ghana)
- **Error Handling**: If SMS fails to send, the email will still be sent. SMS errors are logged but don't prevent email delivery

## Phone Number Format

The system accepts phone numbers in various formats:
- `0244123456` (local format) → automatically converted to `+233244123456`
- `233244123456` → automatically converted to `+233244123456`
- `+233244123456` → used as-is

## Troubleshooting

### "SMS service not configured" Error

- Make sure your `.env` file contains all three Twilio variables:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
- Restart your server after adding the credentials
- Check the server console for any error messages

### "Invalid phone number format" Error

- Make sure the phone number in the member's profile is valid
- The system will try to format it automatically, but ensure it contains digits
- For Ghana, numbers should start with 0 or 233

### SMS Not Sending (Trial Account)

- Trial accounts can only send SMS to verified phone numbers
- Go to Twilio Console → Phone Numbers → Verified Caller IDs
- Add the phone numbers you want to test with
- To send SMS to any number, upgrade to a paid account

### SMS Not Sending (Paid Account)

- Check your Twilio account balance
- Verify your phone number is active in Twilio Console
- Check the server console for detailed error messages
- Review Twilio logs in the Twilio Console

### SMS Sending but Email Not Sending (or vice versa)

- Email and SMS are sent independently
- If one fails, the other will still be sent
- Check the server console for specific error messages
- Verify both services are properly configured

## Cost Considerations

- **Trial Account**: Free, but limited to verified phone numbers
- **Paid Account**: Pay per SMS sent
- **Ghana SMS Rates**: Check Twilio's pricing page for current rates
- **Recommendation**: Start with a trial account for testing, then upgrade when ready for production

## Additional Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio SMS API Reference](https://www.twilio.com/docs/sms/api)
- [Twilio Console](https://console.twilio.com/)
- [Twilio Pricing](https://www.twilio.com/pricing)

