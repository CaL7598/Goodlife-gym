# Frontend Environment Variables Setup for GitHub Pages

## Problem

You're seeing errors like:
- `ERR_NAME_NOT_RESOLVED`
- `ERR_ADDRESS_UNREACHABLE`
- "Error fetching announcements"

This means your frontend doesn't have the required environment variables configured.

## Required Environment Variables

Your frontend needs these GitHub Secrets to work properly:

### 1. Supabase Configuration (Required)

These are **essential** for the app to work:

- **`VITE_SUPABASE_URL`** - Your Supabase project URL
  - Format: `https://xxxxxxxxxxxxx.supabase.co`
  - Get from: Supabase Dashboard → Settings → API → Project URL

- **`VITE_SUPABASE_ANON_KEY`** - Your Supabase anonymous/public key
  - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Get from: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 2. Backend API Configuration (For Emails)

- **`VITE_API_URL`** - Your Render backend URL
  - Format: `https://goodlife-gym.onrender.com`
  - Get from: Render Dashboard → Your service → URL at top

## How to Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/CaL7598/Goodlife-gym`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each variable:

### Add VITE_SUPABASE_URL:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)

### Add VITE_SUPABASE_ANON_KEY:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anonymous key (the long JWT token)

### Add VITE_API_URL:
- **Name:** `VITE_API_URL`
- **Value:** Your Render backend URL (e.g., `https://goodlife-gym.onrender.com`)

## Verify Secrets Are Set

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all three secrets listed:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
   - ✅ `VITE_API_URL`

## Trigger New Deployment

After adding/updating secrets:

1. Go to **Actions** tab
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
   - OR push any commit to `main` branch

## How to Find Your Supabase Credentials

### Supabase URL:
1. Log in to https://supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy **"Project URL"** (looks like `https://xxxxxxxxxxxxx.supabase.co`)

### Supabase Anon Key:
1. Same page (Settings → API)
2. Under **"Project API keys"**
3. Copy the **`anon` `public`** key (the long token starting with `eyJ...`)

## Troubleshooting

### Still Getting ERR_NAME_NOT_RESOLVED?

1. **Check if secrets are set:**
   - Go to Settings → Secrets → Actions
   - Verify all three secrets exist

2. **Check secret values:**
   - Make sure Supabase URL starts with `https://`
   - Make sure Supabase URL ends with `.supabase.co`
   - Make sure there are no extra spaces

3. **Verify deployment used secrets:**
   - Go to Actions → Latest deployment
   - Check the build logs
   - Look for "Build" step - should show environment variables being used

4. **Check Supabase project:**
   - Make sure your Supabase project is active
   - Verify the URL is correct in Supabase dashboard

### Still Getting ERR_ADDRESS_UNREACHABLE?

1. **Check Supabase project status:**
   - Log in to Supabase dashboard
   - Make sure project is not paused
   - Check if there are any service issues

2. **Verify network connectivity:**
   - Try accessing Supabase URL directly in browser
   - Should show Supabase API documentation

3. **Check RLS policies:**
   - Make sure Row Level Security is configured
   - Check if policies allow anonymous access

## Quick Checklist

- [ ] `VITE_SUPABASE_URL` added to GitHub Secrets
- [ ] `VITE_SUPABASE_ANON_KEY` added to GitHub Secrets
- [ ] `VITE_API_URL` added to GitHub Secrets (for emails)
- [ ] New deployment triggered after adding secrets
- [ ] Deployment completed successfully
- [ ] Website tested and working

## Important Notes

- **Secrets are only used during build** - They're baked into the JavaScript files
- **After adding secrets, you MUST redeploy** - Old builds don't have the new values
- **Secrets are case-sensitive** - Use exact names: `VITE_SUPABASE_URL` (not `VITE_SUPABASE_url`)
- **No spaces** - Make sure there are no spaces around the `=` sign in secret values

## Expected Result

After setting secrets and redeploying:
- ✅ No more `ERR_NAME_NOT_RESOLVED` errors
- ✅ Announcements load correctly
- ✅ All database features work
- ✅ Emails work (if `VITE_API_URL` is set)
