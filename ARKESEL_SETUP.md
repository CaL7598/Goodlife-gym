# Arkesel SMS Setup Guide

This guide will help you set up Arkesel SMS functionality so that members receive SMS notifications alongside email notifications.

## Step 1: Create an Arkesel Account

1. Go to [https://arkesel.com](https://arkesel.com)
2. Sign up for an account (or log in if you already have one)
3. Complete the account verification process

## Step 2: Get Your Arkesel Credentials

1. After logging in, go to your [Arkesel Dashboard](https://sms.arkesel.com/)
2. Navigate to **API** or **Settings** section
3. You'll need:
   - **API Key** - Your Arkesel API key
   - **Sender ID** - Your approved sender ID (e.g., "Goodlife Fitness" or a short code)

**Note:** 
- You may need to register and get approval for your sender ID
- Sender ID can be your business name (up to 11 characters) or a short code
- For Ghana, Arkesel supports local phone numbers

## Step 3: Add Credentials to Your .env File

1. Open your `.env` file in the project root
2. Add the following lines:

```env
# Arkesel SMS Configuration
ARKESEL_SENDER_ID=Goodlife Fitness
ARKESEL_API_KEY=your_api_key_here
```

Replace:
- `Goodlife Fitness` with your approved sender ID (or use a different approved sender ID)
- `your_api_key_here` with your API Key from Step 2

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

# Arkesel SMS Configuration
ARKESEL_SENDER_ID=Goodlife Fitness
ARKESEL_API_KEY=your_arkesel_api_key_here
```

## Step 4: Install Dependencies

Make sure to install the Arkesel package:

```bash
npm install
```

This will install `arkesel-js` package which is required for SMS functionality.

## Step 5: Restart Your Server

After adding the Arkesel credentials, restart your development server:

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
   - Fill in the form with a valid email and phone number (Ghana format: 0244123456 or 233244123456)
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
- **Phone Number Formatting**: The system automatically formats phone numbers to include the country code (233 for Ghana)
- **Error Handling**: If SMS fails to send, the email will still be sent. SMS errors are logged but don't prevent email delivery

## Phone Number Format

The system accepts phone numbers in various formats and converts them to Arkesel's required format (`233XXXXXXXXX`):

- `0244123456` (local format) → automatically converted to `233244123456`
- `233244123456` → used as-is
- `+233244123456` → automatically converted to `233244123456` (removes +)

**Note:** Arkesel expects phone numbers in the format `233XXXXXXXXX` (without the + sign).

## Troubleshooting

### "SMS service not configured" Error

- Make sure your `.env` file contains both Arkesel variables:
  - `ARKESEL_SENDER_ID`
  - `ARKESEL_API_KEY`
- Restart your server after adding the variables
- Check that the values don't have extra spaces or quotes

### SMS Not Sending

1. **Check API Key**:
   - Verify your API key is correct in the Arkesel dashboard
   - Make sure the API key hasn't expired or been revoked

2. **Check Sender ID**:
   - Verify your sender ID is approved in Arkesel
   - Sender ID must be registered and approved before use
   - Contact Arkesel support if your sender ID is not approved

3. **Check Phone Number Format**:
   - Ensure phone numbers are in correct format (233XXXXXXXXX)
   - Verify the phone number is valid and active

4. **Check Arkesel Balance**:
   - Log in to Arkesel dashboard
   - Check if you have sufficient SMS credits
   - Top up your account if balance is low

5. **Check Server Logs**:
   - Look at your server console for error messages
   - Arkesel errors will be logged with details

### Invalid Sender ID Error

- Your sender ID must be approved by Arkesel
- Contact Arkesel support to register/approve your sender ID
- You can use a generic sender ID for testing if available

### API Key Invalid Error

- Verify your API key in the Arkesel dashboard
- Make sure you copied the entire key without extra spaces
- Regenerate the API key if needed

## Arkesel Features

- **Local Ghana Support**: Arkesel specializes in Ghana SMS delivery
- **Affordable Rates**: Competitive pricing for SMS in Ghana
- **Reliable Delivery**: High delivery rates for Ghana numbers
- **Sender ID Customization**: Use your business name as sender ID

## Production Deployment

When deploying to production (e.g., Render):

1. Add environment variables in your hosting platform:
   - `ARKESEL_SENDER_ID`
   - `ARKESEL_API_KEY`

2. Make sure `arkesel-js` is installed (it's in `package.json`)

3. Restart your server after deployment

4. Test SMS functionality after deployment

## Support

- **Arkesel Documentation**: [https://arkesel.com/docs](https://arkesel.com/docs)
- **Arkesel Support**: Contact through your Arkesel dashboard
- **Package Documentation**: [https://npm.io/package/arkesel-js](https://npm.io/package/arkesel-js)
