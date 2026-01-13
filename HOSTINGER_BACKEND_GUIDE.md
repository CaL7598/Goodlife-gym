# Using Hostinger for Backend Email Server

This guide explains how to use your Hostinger hosting for the backend email server.

## Can Hostinger Host Node.js Backend?

**Short Answer:** It depends on your Hostinger plan.

### Hostinger Shared Hosting (Most Common)
- ❌ **Cannot** run Node.js servers
- Only supports PHP, static files, and basic web hosting
- **Cannot** be used for the backend email server

### Hostinger VPS/Cloud Hosting
- ✅ **Can** run Node.js servers
- Requires server management (SSH, Node.js installation, PM2)
- More complex setup but possible

## Recommended Approach: Hybrid Setup

**Best Solution:** Use Hostinger for frontend + Railway/Render for backend

### Why This Works Best:

1. **Hostinger** → Host your frontend (static files) ✅
2. **Railway/Render** → Host your backend (Node.js server) ✅
3. **GoDaddy** → Your domain (point to both) ✅

This gives you:
- ✅ Professional setup
- ✅ Easy to manage
- ✅ Reliable email service
- ✅ Uses your existing Hostinger subscription for frontend

## Option 1: Use Hostinger VPS/Cloud (Advanced)

If you have Hostinger VPS or Cloud hosting and want to use it for the backend:

### Prerequisites:
- Hostinger VPS or Cloud plan
- SSH access to your server
- Basic Linux command line knowledge

### Step 1: Connect to Your Server

1. Log in to Hostinger hPanel
2. Find your VPS/Cloud server details
3. Use SSH to connect:
   ```bash
   ssh root@your-server-ip
   ```

### Step 2: Install Node.js

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Clone Your Repository

```bash
# Install Git if not already installed
apt install -y git

# Clone your repository
cd /var/www
git clone https://github.com/CaL7598/Goodlife-gym.git
cd Goodlife-gym
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Set Up Environment Variables

```bash
# Create .env file
nano .env
```

Add these variables:
```
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=Goodlife Fitness <noreply@goodlifefitnessghana.de>
PORT=3001
NODE_ENV=production
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 6: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Step 7: Start the Server

```bash
pm2 start server.js --name "goodlife-backend"
pm2 save
pm2 startup
```

### Step 8: Configure Firewall

```bash
# Allow port 3001 (or your chosen port)
ufw allow 3001/tcp
ufw reload
```

### Step 9: Set Up Reverse Proxy (Nginx)

If you want to use a domain/subdomain:

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/api.goodlifefitnessghana.de
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.goodlifefitnessghana.de;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/api.goodlifefitnessghana.de /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 10: Set Up SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.goodlifefitnessghana.de
```

### Step 11: Configure DNS

In GoDaddy DNS, add:
- **Type:** A
- **Name:** `api`
- **Value:** Your Hostinger VPS IP address
- **TTL:** 600

### Step 12: Update Frontend

Set `VITE_API_URL` to: `https://api.goodlifefitnessghana.de`

## Option 2: Use Railway/Render (Recommended - Easier)

Since you already have Hostinger for frontend, use Railway/Render for backend:

### Setup:

1. **Deploy backend on Railway/Render** (see `RENDER_DEPLOYMENT_GUIDE.md`)
2. **Keep frontend on Hostinger** (you're already doing this)
3. **Point subdomain to backend:**
   - Create `api.goodlifefitnessghana.de` subdomain
   - Point it to Railway/Render backend
   - Set `VITE_API_URL` to your backend URL

### Benefits:

- ✅ No server management needed
- ✅ Automatic SSL/HTTPS
- ✅ Easy to set up
- ✅ Reliable and scalable
- ✅ Free tier available

## Current Setup Recommendation

Based on your situation:

1. **Frontend:** Keep on Hostinger ✅ (you're already doing this)
2. **Backend:** Deploy on Railway/Render (free, easy) ✅
3. **Domain:** Use GoDaddy DNS to point:
   - Main domain → Hostinger (frontend)
   - `api` subdomain → Railway/Render (backend)

### Configuration:

**GoDaddy DNS Records:**
```
Type    Name    Value                    TTL
A       @       Hostinger IP             600
CNAME   api     your-backend.railway.app 600
```

**GitHub Secret:**
```
VITE_API_URL = https://api.goodlifefitnessghana.de
```

## Troubleshooting

### If using Hostinger VPS:

**Server won't start?**
- Check PM2 logs: `pm2 logs goodlife-backend`
- Verify Node.js is installed: `node --version`
- Check if port is open: `netstat -tulpn | grep 3001`

**Nginx errors?**
- Check config: `nginx -t`
- Check logs: `tail -f /var/log/nginx/error.log`
- Verify domain DNS is pointing to server IP

**PM2 not starting on reboot?**
- Run: `pm2 startup` and follow instructions
- Verify: `pm2 save`

### If using Railway/Render:

See `RENDER_DEPLOYMENT_GUIDE.md` for troubleshooting.

## Cost Comparison

| Option | Monthly Cost | Difficulty | Maintenance |
|--------|-------------|------------|-------------|
| Hostinger VPS | $5-10+ | High | High |
| Railway/Render Free | $0 | Low | None |
| Railway/Render Paid | $7+ | Low | None |

## Recommendation

**Use Hostinger for frontend + Railway/Render for backend**

This gives you:
- ✅ Professional setup
- ✅ Easy management
- ✅ No server administration needed
- ✅ Reliable email service
- ✅ Uses your Hostinger subscription efficiently

Your Hostinger hosting is perfect for the frontend (static files), and Railway/Render is perfect for the backend (Node.js server).

## Next Steps

1. **If you have Hostinger VPS:** Follow Option 1 steps above
2. **If you have Hostinger Shared Hosting:** Use Option 2 (Railway/Render)
3. **Configure DNS:** Point subdomain to backend
4. **Update VITE_API_URL:** Set in GitHub Secrets
5. **Test:** Verify emails are working
