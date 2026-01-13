# Using GoDaddy Domain for Backend API

This guide shows you how to use your GoDaddy domain with Railway/Render backend hosting.

## Why Not Host on GoDaddy Directly?

- **GoDaddy's basic hosting** is for PHP/static sites, not Node.js servers
- **GoDaddy VPS** is possible but requires server management (complex)
- **Better option:** Use Railway/Render (free, easy) + point your GoDaddy domain to it

## Step-by-Step: Point GoDaddy Domain to Railway

### Step 1: Deploy Backend on Railway

1. Deploy your backend on Railway (see `EMAIL_FIX_GUIDE.md`)
2. Note your Railway URL: `https://your-app.up.railway.app`

### Step 2: Add Custom Domain in Railway

1. Go to Railway dashboard → Your project → **Settings** → **Networking**
2. Scroll to **"Custom Domains"** section
3. Click **"Add Custom Domain"**
4. Enter a subdomain: `api.goodlifefitnessghana.de` (or `backend.goodlifefitnessghana.de`)
5. Railway will show you DNS records to add

### Step 3: Configure DNS in GoDaddy

1. Log in to GoDaddy: https://www.godaddy.com
2. Go to **My Products** → Find your domain → Click **DNS** or **Manage DNS**
3. In the DNS records section, add a new record:

   **Option A: CNAME Record (Recommended)**
   - **Type:** CNAME
   - **Name:** `api` (or `backend`)
   - **Value:** `your-app.up.railway.app` (your Railway domain)
   - **TTL:** 600 (or default)

   **Option B: A Record (If Railway provides IP)**
   - **Type:** A
   - **Name:** `api` (or `backend`)
   - **Value:** Railway's IP address (if provided)
   - **TTL:** 600

4. **Save** the DNS record

### Step 4: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Usually takes 10-30 minutes
- Check propagation: https://www.whatsmydns.net

### Step 5: Update VITE_API_URL

Once DNS is propagated:

1. Your backend will be accessible at: `https://api.goodlifefitnessghana.de`
2. Update GitHub Secret `VITE_API_URL` to: `https://api.goodlifefitnessghana.de`
3. Trigger a new deployment

## Step-by-Step: Point GoDaddy Domain to Render

### Step 1: Deploy Backend on Render

1. Deploy your backend on Render (see `EMAIL_FIX_GUIDE.md`)
2. Note your Render URL: `https://goodlife-backend-api.onrender.com`

### Step 2: Add Custom Domain in Render

1. Go to Render dashboard → Your service → **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter: `api.goodlifefitnessghana.de`
4. Render will show DNS records to add

### Step 3: Configure DNS in GoDaddy

1. Log in to GoDaddy
2. Go to **My Products** → Your domain → **DNS**
3. Add CNAME record:
   - **Type:** CNAME
   - **Name:** `api`
   - **Value:** `goodlife-backend-api.onrender.com`
   - **TTL:** 600

### Step 4: Wait and Update

- Wait for DNS propagation (10-30 minutes)
- Update `VITE_API_URL` to `https://api.goodlifefitnessghana.de`
- Redeploy frontend

## Testing

After DNS propagation:

1. Visit: `https://api.goodlifefitnessghana.de/api/health`
2. Should return: `{"status":"ok","message":"Email API server is running"}`
3. If it works, update `VITE_API_URL` and redeploy

## Troubleshooting

### DNS not working?

1. **Check DNS propagation:** https://www.whatsmydns.net
   - Enter: `api.goodlifefitnessghana.de`
   - Should show your Railway/Render domain

2. **Verify DNS record:**
   - In GoDaddy DNS, make sure CNAME is correct
   - No typos in domain name
   - TTL is set (600 or default)

3. **Check Railway/Render:**
   - Make sure custom domain is added
   - Check for SSL certificate status (may take a few minutes)

4. **Common issues:**
   - DNS not propagated yet (wait longer)
   - Wrong CNAME value (check Railway/Render domain)
   - SSL certificate not ready (wait 5-10 minutes)

## Benefits of This Approach

✅ **Free hosting** (Railway/Render free tier)  
✅ **Easy setup** (no server management)  
✅ **Uses your domain** (professional look)  
✅ **Automatic SSL** (HTTPS enabled)  
✅ **Reliable** (managed hosting)

## Alternative: GoDaddy VPS (Not Recommended)

If you really want to use GoDaddy hosting:

1. Purchase GoDaddy VPS (starts at ~$5-10/month)
2. Set up Node.js on the server (SSH access required)
3. Install PM2 for process management
4. Configure firewall and security
5. Set up automatic restarts
6. Manage server updates and maintenance

**This is much more complex and not recommended unless you have server administration experience.**
