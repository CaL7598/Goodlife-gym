# Fix Render Build Errors - Backend Only Deployment

## Problem

Render is trying to build the entire project (frontend + backend) when it should only run the backend server. This causes errors like:
- "Cannot find module 'vite'"
- TypeScript compilation errors in frontend files
- Build failures

## Solution

Configure Render to **only run the backend server**, not build the frontend.

## Step-by-Step Fix

### Step 1: Update Render Service Settings

1. Go to your Render dashboard
2. Click on your service (`goodlife-backend-api`)
3. Go to **Settings** tab
4. Scroll to **"Build & Deploy"** section

### Step 2: Update Build Command

**Change from:**
```
npm install
```

**Change to:**
```
npm install --production
```

**Why?** The `--production` flag skips installing dev dependencies (like Vite, TypeScript, React build tools) that are only needed for frontend development.

### Step 3: Update Start Command

**Change from:**
```
npm start
```

**Change to:**
```
node server.js
```

**Why?** This directly runs the backend server without triggering any frontend build scripts.

### Step 4: Save and Redeploy

1. Click **"Save Changes"**
2. Render will automatically trigger a new deployment
3. Wait for deployment to complete (2-5 minutes)

## Correct Render Configuration

Here's what your Render service settings should look like:

```
Name: goodlife-backend-api
Runtime: Node
Build Command: npm install --production
Start Command: node server.js
Plan: Free (or paid)
```

## Environment Variables (Still Required)

Make sure these are set:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PORT=10000`
- `NODE_ENV=production`

## Verify It's Working

After redeploying:

1. Check Render logs - should see:
   ```
   📧 Resend API configured: Yes
   📮 From Email: Goodlife Fitness <noreply@...>
   🚀 Server running on port 10000
   ```

2. Visit: `https://your-service.onrender.com/api/health`
   - Should return: `{"status":"ok","message":"Email API server is running"}`

3. No more Vite/TypeScript errors in logs ✅

## Why This Happens

- Render detects `package.json` with both frontend and backend dependencies
- By default, it tries to build everything
- Using `npm install --production` skips frontend build tools
- Using `node server.js` runs only the backend, avoiding frontend build scripts

## Alternative: Create Backend-Only Package.json

If the above doesn't work, you can create a separate `package.json` for backend:

1. Create `package.backend.json`:
```json
{
  "name": "goodlife-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "resend": "^3.2.0",
    "twilio": "^4.20.0"
  }
}
```

2. In Render, set:
   - Build Command: `cp package.backend.json package.json && npm install`
   - Start Command: `node server.js`

**But the first solution (using --production flag) should work and is simpler.**

## Still Having Issues?

1. **Check Render logs** for specific error messages
2. **Verify environment variables** are set correctly
3. **Make sure PORT is 10000** (Render's default)
4. **Check that server.js exists** in your repository root

## Quick Checklist

- ✅ Build Command: `npm install --production`
- ✅ Start Command: `node server.js`
- ✅ Environment variables set
- ✅ PORT=10000
- ✅ Service shows "Live" status
