# GoDaddy Domain Setup Guide for GitHub Pages

This guide will help you connect your GoDaddy domain to your GitHub Pages site.

## Prerequisites

- A domain purchased from GoDaddy
- Access to your GoDaddy account
- GitHub repository with GitHub Pages enabled

## Step 1: Configure Custom Domain in GitHub

1. Go to your repository: `https://github.com/CaL7598/Goodlife-Ghana-Fitness-Gym-/settings/pages`

2. Under **"Custom domain"**, enter your domain name (e.g., `goodlifefitness.com` or `www.goodlifefitness.com`)

3. Check **"Enforce HTTPS"** (this will be available after DNS is configured)

4. Click **"Save"**

5. GitHub will create a `CNAME` file in your repository. You can also manually create it in the `public` folder with your domain name.

## Step 2: Update CNAME File

1. Edit the file `public/CNAME` and replace `yourdomain.com` with your actual domain name
2. Commit and push the changes

## Step 3: Configure DNS in GoDaddy

### Option A: Using Apex Domain (example.com - without www)

If you want to use `yourdomain.com` (without www):

1. Log in to your GoDaddy account
2. Go to **My Products** → Find your domain → Click **DNS** or **Manage DNS**
3. In the DNS records, you'll need to add/modify these records:

   **Delete existing A records** (if any) and add these GitHub Pages IP addresses:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 185.199.108.153 | 600 |
   | A | @ | 185.199.109.153 | 600 |
   | A | @ | 185.199.110.153 | 600 |
   | A | @ | 185.199.111.153 | 600 |

   **Note:** The `@` symbol represents your root domain (apex domain).

### Option B: Using www Subdomain (www.example.com)

If you want to use `www.yourdomain.com`:

1. Log in to your GoDaddy account
2. Go to **My Products** → Find your domain → Click **DNS** or **Manage DNS**
3. Add or modify a CNAME record:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | www | `CaL7598.github.io` | 600 |

   **Note:** Replace `CaL7598` with your GitHub username if different.

### Option C: Using Both (Recommended)

To support both `yourdomain.com` and `www.yourdomain.com`:

1. Add the A records for the apex domain (as shown in Option A)
2. Add the CNAME record for www (as shown in Option B)

## Step 4: Wait for DNS Propagation

- DNS changes can take **24-48 hours** to fully propagate, but usually work within a few hours
- You can check DNS propagation using tools like:
  - https://www.whatsmydns.net/
  - https://dnschecker.org/

## Step 5: Verify SSL Certificate

1. After DNS propagates, go back to GitHub Pages settings
2. The **"Enforce HTTPS"** option should become available
3. Enable it to secure your site with SSL

## Step 6: Test Your Domain

1. Visit your domain in a browser: `http://yourdomain.com` or `https://www.yourdomain.com`
2. Your GitHub Pages site should load

## Troubleshooting

### Domain Not Working After 48 Hours

1. **Verify DNS Records:**
   - Use `nslookup yourdomain.com` or `dig yourdomain.com` to check if DNS is pointing correctly
   - Ensure A records point to GitHub's IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

2. **Check CNAME File:**
   - Ensure `public/CNAME` contains your domain name (without http:// or https://)
   - The file should be in the root of your `public` folder

3. **GitHub Pages Settings:**
   - Verify the custom domain is set correctly in GitHub Pages settings
   - Check that GitHub Actions deployment completed successfully

4. **Clear Browser Cache:**
   - Try accessing your site in an incognito/private window
   - Clear your browser's DNS cache

### Common GoDaddy DNS Issues

- **TTL (Time To Live):** Set to 600 seconds (10 minutes) for faster updates
- **Record Conflicts:** Make sure you don't have conflicting A or CNAME records
- **Subdomain Conflicts:** If using www, don't create an A record for www (use CNAME only)

## Additional Resources

- [GitHub Pages Custom Domain Documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GoDaddy DNS Help](https://www.godaddy.com/help/manage-dns-records-680)

## Quick Reference: GitHub Pages IP Addresses

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

These are the IP addresses you'll use for A records when configuring your apex domain.

