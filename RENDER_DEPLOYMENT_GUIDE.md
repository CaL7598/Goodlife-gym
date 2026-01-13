# Step-by-Step Guide: Deploy Backend to Render

This guide will walk you through deploying your backend server (`server.js`) to Render so emails can work on your hosted website.

## Prerequisites

- GitHub account (your code is already on GitHub)
- Resend API key (for sending emails)
- 10-15 minutes

## Step 1: Sign Up / Login to Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"** or **"Sign In"**
3. Sign up/login with your **GitHub account** (recommended - easiest)

## Step 2: Create New Web Service

1. Once logged in, click the **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown menu

## Step 3: Connect Your GitHub Repository

1. Click **"Connect account"** if you haven't connected GitHub yet
2. Authorize Render to access your GitHub repositories
3. In the repository list, find and select **`Goodlife-Fitness-Gym`** (or `Goodlife-gym`)
4. Click **"Connect"**

## Step 4: Configure Service Settings

Fill in the following settings:

### Basic Settings:
- **Name**: `goodlife-backend-api` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
- **Branch**: `main` (should be selected by default)
- **Root Directory**: Leave empty (or `./` if required)
- **Runtime**: `Node`
- **Build Command**: `npm install --production` (IMPORTANT: Use --production to skip dev dependencies like Vite)
- **Start Command**: `node server.js` (IMPORTANT: Use this instead of `npm start` to avoid building frontend)
- **Plan**: **Free** (or choose a paid plan for better performance)

**⚠️ CRITICAL:** Make sure to use:
- Build Command: `npm install --production` (this skips frontend build tools)
- Start Command: `node server.js` (this runs only the backend server)

### Advanced Settings (Optional):
- **Auto-Deploy**: `Yes` (automatically deploys when you push to GitHub)
- **Health Check Path**: `/api/health`

## Step 5: Add Environment Variables

Scroll down to the **"Environment Variables"** section and click **"Add Environment Variable"** for each:

### Required Variables:

1. **RESEND_API_KEY**
   - Key: `RESEND_API_KEY`
   - Value: `re_your_actual_resend_api_key_here`
   - (Get this from your Resend dashboard)

2. **RESEND_FROM_EMAIL**
   - Key: `RESEND_FROM_EMAIL`
   - Value: `Goodlife Fitness <noreply@goodlifefitnessghana.de>`
   - (Use your verified domain email)

3. **PORT**
   - Key: `PORT`
   - Value: `10000`
   - (Render uses port 10000 by default)

4. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

### Optional Variables (if using SMS):

5. **ARKESEL_SENDER_ID**
   - Key: `ARKESEL_SENDER_ID`
   - Value: `Goodlife Fitness` (or your approved sender ID)

6. **ARKESEL_API_KEY**
   - Key: `ARKESEL_API_KEY`
   - Value: `your_arkesel_api_key`
   - (Get this from your Arkesel dashboard)

## Step 6: Deploy

1. Scroll to the bottom of the page
2. Click **"Create Web Service"**
3. Render will start building and deploying your backend
4. Wait 2-5 minutes for the deployment to complete

## Step 7: Get Your Backend URL

1. Once deployment is complete, you'll see a **"Live"** status
2. Your backend URL will be displayed at the top, something like:
   - `https://goodlife-backend-api.onrender.com`
3. **Copy this URL** - you'll need it for the next step

## Step 8: Verify Backend is Working

1. Open a new browser tab
2. Visit: `https://your-backend-url.onrender.com/api/health`
   - Replace `your-backend-url` with your actual Render URL
3. You should see: `{"status":"ok","message":"Email API server is running"}`
4. If you see this, your backend is working! ✅

## Step 9: Update Frontend (GitHub Pages)

Now you need to tell your frontend where to find the backend:

### For GitHub Pages:

1. Go to your GitHub repository: `https://github.com/CaL7598/Goodlife-gym`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. **Name**: `VITE_API_URL`
5. **Value**: `https://goodlife-backend-api.onrender.com` (your Render URL from Step 7)
6. Click **"Add secret"**

### Trigger New Deployment:

1. Go to **Actions** tab in your repository
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
   - OR just push any commit to the `main` branch

## Step 10: Test Email Functionality

1. Wait for GitHub Pages deployment to complete (2-5 minutes)
2. Visit your website
3. Try creating a new member or confirming a payment
4. Check browser console (F12) for any errors
5. Check Render logs to see if emails are being sent

## Troubleshooting

### Backend won't start?

- **Check Render logs**: Go to your Render service → **"Logs"** tab
- **Common issues**:
  - Missing environment variables
  - Wrong `PORT` value (should be `10000` for Render)
  - Build errors (check if `npm install --production` completed)
  - **Frontend build errors**: If you see Vite/TypeScript errors, make sure:
    - Build Command is: `npm install --production`
    - Start Command is: `node server.js` (NOT `npm start`)
    - This prevents Render from trying to build the frontend

### Backend URL not working?

- **Check service status**: Should show "Live" (green)
- **Wait a few minutes**: Free tier may take longer to start
- **Check logs**: Look for error messages

### Emails still not working?

- **Verify VITE_API_URL**: Check GitHub Secrets is set correctly
- **Check backend logs**: Render → Your service → Logs
- **Test backend directly**: Visit `/api/health` endpoint
- **Check Resend API key**: Make sure it's correct in Render environment variables

### Free Tier Limitations:

- **Spins down after inactivity**: First request after inactivity may be slow (15-30 seconds)
- **Limited resources**: May be slower than paid plans
- **Solution**: Consider upgrading to a paid plan ($7/month) for better performance

## Using Your GoDaddy Domain (Optional)

You can use your GoDaddy domain instead of Render's URL:

1. In Render: Go to your service → **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter: `api.goodlifefitnessghana.de` (or `backend.goodlifefitnessghana.de`)
4. Render will show DNS records to add
5. In GoDaddy: Add CNAME record pointing to Render's domain
6. Wait for DNS propagation (10-30 minutes)
7. Update `VITE_API_URL` to use your custom domain

See `GODADDY_BACKEND_DOMAIN_SETUP.md` for detailed DNS instructions.

## Quick Reference

**Render Service URL Format:**
```
https://your-service-name.onrender.com
```

**Health Check Endpoint:**
```
https://your-service-name.onrender.com/api/health
```

**Environment Variables Needed:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PORT=10000`
- `NODE_ENV=production`

**GitHub Secret Needed:**
- `VITE_API_URL` = Your Render backend URL

## Next Steps

After completing these steps:
1. ✅ Backend deployed on Render
2. ✅ Frontend configured with `VITE_API_URL`
3. ✅ Emails should now work!

If you encounter any issues, check the Render logs and browser console for error messages.
