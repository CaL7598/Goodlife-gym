# Render "Not Found" Error - Troubleshooting Guide

## Problem

You're getting a "Not Found" error when trying to access `/api/health` on your Render service.

## Quick Diagnosis Steps

### Step 1: Check Service Status

1. Go to Render dashboard
2. Click on your service
3. Check the status at the top:
   - ✅ **"Live"** (green) = Service is running
   - ❌ **"Build failed"** = Build didn't complete
   - ❌ **"Deploy failed"** = Deployment failed
   - ⏳ **"Building"** = Still deploying (wait)

### Step 2: Check Render Logs

1. In your Render service, click **"Logs"** tab
2. Look for these messages:

**✅ Good Signs (Server is running):**
```
🚀 Email API server running on http://localhost:10000
📧 Resend API configured: Yes
📮 From Email: Goodlife Fitness <noreply@...>
```

**❌ Bad Signs (Server not running):**
- No "Email API server running" message
- Error messages (red text)
- "Cannot find module" errors
- "Port already in use" errors
- Build/deploy errors

### Step 3: Verify Your Service URL

Make sure you're using the **correct URL** from Render:

1. In Render dashboard, your service URL is shown at the top
2. It should be: `https://your-service-name.onrender.com`
3. Test: `https://your-service-name.onrender.com/api/health`

**Common mistake:** Using a placeholder URL like `your-service.onrender.com` instead of your actual service name.

## Common Causes & Fixes

### Issue 1: Server Not Starting

**Symptoms:**
- No "Email API server running" message in logs
- Service shows "Live" but endpoints don't work

**Fix:**
1. Check **Start Command** in Render Settings:
   - Should be: `node server.js`
   - NOT: `npm start` (this might fail)

2. Check **Build Command**:
   - Should be: `npm install --production`

3. Check logs for specific errors

### Issue 2: Wrong Port

**Symptoms:**
- Server starts but can't connect

**Fix:**
1. In Render → Environment Variables:
   - Set: `PORT=10000` (Render's default)
   - Or leave PORT unset (Render will auto-assign)

2. Check `server.js` uses: `process.env.PORT || 3001`
   - This should work with Render's auto-assigned port

### Issue 3: Build Failed

**Symptoms:**
- Service shows "Build failed"
- Logs show npm/install errors

**Fix:**
1. Make sure Build Command is: `npm install --production`
2. Check logs for specific package errors
3. Verify `package.json` is valid

### Issue 4: Missing Dependencies

**Symptoms:**
- "Cannot find module 'express'" or similar errors

**Fix:**
1. Make sure dependencies are in `package.json` (not `devDependencies`)
2. Required dependencies:
   - `express`
   - `cors`
   - `resend`
   - `dotenv`
   - `twilio` (if using SMS)

### Issue 5: Wrong URL Path

**Symptoms:**
- Getting "Not Found" but server logs show it's running

**Fix:**
1. Make sure you're using: `/api/health` (with `/api/` prefix)
2. Try root: `https://your-service.onrender.com/` (should also give 404, but confirms server is running)
3. Try: `https://your-service.onrender.com/api/email-config` (another test endpoint)

## Step-by-Step Fix

### If Service Shows "Build Failed":

1. Go to **Settings** → **Build & Deploy**
2. Update:
   - Build Command: `npm install --production`
   - Start Command: `node server.js`
3. Click **"Save Changes"**
4. Wait for redeploy

### If Service Shows "Live" but Endpoints Don't Work:

1. Check **Logs** tab for errors
2. Verify environment variables are set
3. Try accessing root URL: `https://your-service.onrender.com/`
   - Should return 404 JSON: `{"error":"Endpoint not found"}`
   - This confirms server IS running

### If You See "Cannot find module" Errors:

1. Check that Build Command is: `npm install --production`
2. Verify dependencies in `package.json`
3. Check logs for which module is missing
4. Make sure it's in `dependencies` (not `devDependencies`)

## Testing Checklist

- [ ] Service status shows "Live" (green)
- [ ] Logs show "Email API server running"
- [ ] Using correct service URL from Render dashboard
- [ ] Testing `/api/health` endpoint (not just root)
- [ ] Environment variables are set
- [ ] PORT is set to 10000 (or left unset)
- [ ] Build Command: `npm install --production`
- [ ] Start Command: `node server.js`

## Quick Test Commands

Once your service is live, test these URLs:

1. **Health Check:**
   ```
   https://your-service.onrender.com/api/health
   ```
   Expected: `{"status":"ok","message":"Email API server is running"}`

2. **Email Config:**
   ```
   https://your-service.onrender.com/api/email-config
   ```
   Expected: JSON with email configuration

3. **Root (should return 404 JSON):**
   ```
   https://your-service.onrender.com/
   ```
   Expected: `{"error":"Endpoint not found"}`

If root returns 404 JSON, server IS running but route doesn't exist (which is expected).

## Still Not Working?

1. **Share Render logs** - Copy the error messages
2. **Check service URL** - Make sure it matches Render dashboard
3. **Verify settings** - Double-check Build/Start commands
4. **Check environment variables** - All required vars should be set

## Expected Log Output

When working correctly, you should see in Render logs:

```
> goodlife-backend-api@1.0.0 start
> node server.js

🚀 Email API server running on http://localhost:10000
📧 Resend API configured: Yes
📮 From Email: Goodlife Fitness <noreply@goodlifefitnessghana.de>
🔑 API Key: Set
```

If you see this, the server is running and `/api/health` should work!
