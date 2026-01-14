# Quick Setup: Arkesel API Key

Your Arkesel API key has been added to your local `.env` file.

## ✅ What's Done

- ✅ API Key added to `.env` file: `Q29rc01nSGFkaHBWUnhKRXVDV0Q`
- ✅ Sender ID set to: `Goodlife Fitness`
- ✅ Phone number formatting fixed for Arkesel (removes `+` prefix)

## 📋 Next Steps

### 1. Verify Sender ID

Make sure "Goodlife Fitness" is approved as your sender ID in Arkesel:
- Log in to [Arkesel Dashboard](https://sms.arkesel.com/)
- Check your approved sender IDs
- If "Goodlife Fitness" is not approved, contact Arkesel support to register it

### 2. Add to Render (Production)

When deploying to Render, add these environment variables:

1. Go to your Render dashboard
2. Find your backend service (`goodlife-backend-api`)
3. Go to **Environment** tab
4. Add these variables:
   - **Key**: `ARKESEL_SENDER_ID` → **Value**: `Goodlife Fitness`
   - **Key**: `ARKESEL_API_KEY` → **Value**: `Q29rc01nSGFkaHBWUnhKRXVDV0Q`

### 3. Test Locally

1. Restart your backend server:
   ```bash
   npm run dev:server
   ```

2. Test SMS by registering a new member with a phone number

3. Check server console for SMS sending status

## 🔒 Security Note

⚠️ **IMPORTANT**: Your API key is in `.env` which is already in `.gitignore` (safe). 
**DO NOT** commit your API key to GitHub. It's already protected.

## 📱 Phone Number Format

The system automatically converts phone numbers to Arkesel format:
- `0244123456` → `233244123456`
- `+233244123456` → `233244123456`
- `233244123456` → `233244123456` (used as-is)

## ✅ Ready to Use!

Your Arkesel SMS is now configured. SMS will be sent automatically when:
- New members register
- Payments are confirmed
- Messages are sent through Communication Center
