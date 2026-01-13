# Email Service Not Working After Hosting - Fix Guide

## Problem
Emails stopped working after the website was hosted because the frontend cannot find the backend API server.

## Root Cause
The email service requires:
1. **Backend API server** (`server.js`) to be deployed and running
2. **VITE_API_URL** environment variable set in the frontend pointing to the backend URL

When `VITE_API_URL` is not set in production, the email service disables itself.

## Quick Fix Steps

### Step 1: Deploy Backend Server

You need to deploy the backend server (`server.js`) to a hosting platform. Here are the easiest options:

#### Option A: Railway (Recommended - Free & Easy)

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `Goodlife-Fitness-Gym` repository
5. Railway will auto-detect it

**Configure Environment Variables:**
- Go to your project → Variables tab
- Add these variables:
  ```
  RESEND_API_KEY=your_resend_api_key_here
  RESEND_FROM_EMAIL=Goodlife Fitness <noreply@goodlifefitnessghana.de>
  PORT=3001
  NODE_ENV=production
  ```
  (Add Twilio variables if you use SMS)

6. Railway will auto-deploy
7. Copy the generated URL (e.g., `https://your-app.up.railway.app`)

#### Option B: Render (Free Tier Available)

1. Go to https://render.com
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `goodlife-backend-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variables (same as Railway above)
7. Deploy and copy the URL

### Step 2: Update Frontend Environment Variables

After deploying the backend, you need to set `VITE_API_URL` in your frontend hosting platform:

#### If using GitHub Pages / Vercel / Netlify:

1. Go to your hosting platform's dashboard
2. Find "Environment Variables" or "Settings" → "Environment Variables"
3. Add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
   (Replace with your actual backend URL)

4. **Rebuild and redeploy** your frontend

#### If using Render:

1. Go to your frontend service → Environment tab
2. Add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
3. Redeploy

### Step 3: Verify Backend is Working

1. Visit: `https://your-backend-url/api/health`
2. Should return: `{"status":"ok","message":"Email API server is running"}`

### Step 4: Test Email Functionality

1. Try creating a new member or confirming a payment
2. Check browser console for any errors
3. Check backend logs for email sending status

## Troubleshooting

### Emails still not working?

1. **Check browser console** - Look for errors like:
   - "Email service not configured: VITE_API_URL not set"
   - Network errors (CORS, 404, etc.)

2. **Verify VITE_API_URL is set correctly:**
   - Must match your backend URL exactly
   - No trailing slash
   - Include `https://`

3. **Check backend logs:**
   - Verify `RESEND_API_KEY` is set
   - Verify `RESEND_FROM_EMAIL` uses verified domain
   - Check for Resend API errors

4. **Test backend directly:**
   ```bash
   curl -X POST https://your-backend-url/api/send-message-email \
     -H "Content-Type: application/json" \
     -d '{
       "memberName": "Test User",
       "memberEmail": "test@example.com",
       "subject": "Test",
       "message": "Test message"
     }'
   ```

### Common Errors

**Error: "Email service not configured: VITE_API_URL not set"**
- **Fix**: Add `VITE_API_URL` environment variable to your frontend hosting platform

**Error: "Failed to fetch" or CORS errors**
- **Fix**: Verify backend URL is correct and backend is running
- Check that backend has CORS enabled (it should by default)

**Error: "Resend API key not configured"**
- **Fix**: Add `RESEND_API_KEY` to backend environment variables

**Error: "Domain not verified"**
- **Fix**: Verify your domain in Resend dashboard
- Make sure `RESEND_FROM_EMAIL` uses your verified domain
- Ensure "Enable Sending" is ON in Resend dashboard

## Important Notes

- The backend server must be running 24/7 for emails to work
- Free tiers on Railway/Render may spin down after inactivity (emails may be delayed)
- Consider upgrading to a paid plan for production use
- Always test email functionality after deployment

## Need Help?

1. Check backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test backend health endpoint: `/api/health`
4. Check Resend dashboard for email delivery status
