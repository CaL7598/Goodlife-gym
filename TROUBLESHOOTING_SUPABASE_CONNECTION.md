# Troubleshooting Supabase Connection Errors

## Error: `ERR_NAME_NOT_RESOLVED`

This error means your browser cannot resolve the Supabase domain name. Here's how to fix it:

## Step 1: Verify Secrets Are Set Correctly

1. Go to GitHub: `https://github.com/CaL7598/Goodlife-gym`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Verify these secrets exist:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
   - ✅ `VITE_API_URL`

## Step 2: Check Secret Values

### Check VITE_SUPABASE_URL Format

The URL should:
- ✅ Start with `https://`
- ✅ End with `.supabase.co`
- ✅ Look like: `https://xxxxxxxxxxxxx.supabase.co`
- ❌ NOT have trailing slashes
- ❌ NOT have extra spaces

**Common mistakes:**
- `https://xxxxxxxxxxxxx.supabase.co/` ❌ (trailing slash)
- `https://xxxxxxxxxxxxx.supabase.co ` ❌ (trailing space)
- `http://xxxxxxxxxxxxx.supabase.co` ❌ (should be https)

### Check VITE_SUPABASE_ANON_KEY Format

The key should:
- ✅ Start with `eyJ` (JWT token)
- ✅ Be very long (hundreds of characters)
- ❌ NOT have quotes around it
- ❌ NOT have extra spaces

## Step 3: Verify Supabase Project Status

1. Log in to https://supabase.com
2. Select your project
3. Check if project status shows:
   - ✅ **Active** (green)
   - ❌ **Paused** (if paused, click "Restore")
   - ❌ **Deleted** (if deleted, you need a new project)

4. Go to **Settings** → **API**
5. Verify the **Project URL** matches what you put in GitHub Secrets
6. Copy the **anon public** key and verify it matches your GitHub Secret

## Step 4: Check Browser Console

Open your deployed website and check the browser console (F12):

### If you see:
```
❌ CRITICAL: VITE_SUPABASE_URL is not set!
```

**Solution:** The secret wasn't used during build. You need to:
1. Verify secret exists in GitHub
2. Trigger a new deployment (Actions → Run workflow)

### If you see:
```
⚠️ WARNING: Supabase URL does not look correct!
```

**Solution:** Check the secret value - it might have a typo or wrong format.

### If you see:
```
✅ Supabase client initialized successfully
```

But still getting `ERR_NAME_NOT_RESOLVED`:

**Solution:** The Supabase project might be paused or the URL is wrong. Check Step 3.

## Step 5: Test Supabase URL Directly

1. Copy your `VITE_SUPABASE_URL` value from GitHub Secrets
2. Open it in a browser: `https://xxxxxxxxxxxxx.supabase.co`
3. You should see Supabase API documentation
4. If you get "This site can't be reached" → Project is paused/deleted or URL is wrong

## Step 6: Force New Deployment

Even if secrets are set, you need to redeploy:

1. Go to **Actions** tab
2. Click **"Deploy to GitHub Pages"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for deployment to complete (5-10 minutes)
5. Clear browser cache (Ctrl+Shift+Delete) and reload

## Step 7: Verify Build Used Secrets

1. Go to **Actions** → Latest deployment
2. Click on the **"Build"** job
3. Expand the **"Build"** step
4. Look for environment variables being set
5. You should see `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the logs

**If secrets are not in logs:**
- Secrets might not be set correctly
- Check secret names are exact: `VITE_SUPABASE_URL` (case-sensitive)

## Common Issues & Solutions

### Issue: "Secrets are set but still getting errors"

**Possible causes:**
1. **Old deployment** - Secrets were added after last deployment
   - **Fix:** Trigger new deployment

2. **Wrong secret value** - URL has typo or wrong format
   - **Fix:** Double-check secret value matches Supabase dashboard

3. **Supabase project paused** - Free tier projects pause after inactivity
   - **Fix:** Log in to Supabase and click "Restore"

4. **Secret name typo** - `VITE_SUPABASE_URL` vs `VITE_SUPABASE_url`
   - **Fix:** Secret names are case-sensitive, must be exact

### Issue: "Works locally but not on GitHub Pages"

**Cause:** Local `.env` file has correct values, but GitHub Secrets are missing/wrong

**Fix:** 
1. Copy values from local `.env` to GitHub Secrets
2. Trigger new deployment

### Issue: "Deployment succeeded but site still broken"

**Cause:** Browser cached old JavaScript files

**Fix:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely

## Quick Diagnostic Checklist

- [ ] Secrets exist in GitHub (Settings → Secrets → Actions)
- [ ] Secret values match Supabase dashboard exactly
- [ ] Supabase project is Active (not paused)
- [ ] Supabase URL works when opened directly in browser
- [ ] New deployment triggered after adding/updating secrets
- [ ] Browser cache cleared
- [ ] Console shows "✅ Supabase client initialized successfully"

## Still Not Working?

If you've checked everything above:

1. **Share browser console output** - Open F12 → Console tab → Copy all errors
2. **Share GitHub Actions build logs** - Actions → Latest deployment → Build job → Build step
3. **Verify Supabase project** - Make sure project is active and accessible

## Expected Console Output (When Working)

When everything is configured correctly, you should see in the browser console:

```
🔍 Supabase Configuration Check:
  VITE_SUPABASE_URL: https://xxxxxxxxxxxxx.supabase...
  VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6...
✅ Supabase client initialized successfully
🔄 Connecting to Supabase...
✅ Supabase connection successful!
```

If you see errors instead, follow the steps above to fix them.
