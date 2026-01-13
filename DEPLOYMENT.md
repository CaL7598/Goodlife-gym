# Backend Deployment Guide

This guide will help you deploy the backend API server to enable email and SMS features in production.

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up/Login to Railway**
   - Go to https://railway.app
   - Sign up with GitHub (free tier available)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Goodlife-Fitness-Gym` repository
   - Railway will auto-detect the project

3. **Configure Environment Variables**
   - In Railway dashboard, go to your project → Variables tab
   - Add these environment variables:
     ```
     RESEND_API_KEY=re_your_actual_api_key_here
     RESEND_FROM_EMAIL=Goodlife Fitness <goodlifeghana13@gmail.com>
     TWILIO_ACCOUNT_SID=your_twilio_account_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token
     TWILIO_PHONE_NUMBER=your_twilio_phone_number
     PORT=3001
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://your-app.up.railway.app`)

5. **Update Frontend**
   - Add to your frontend `.env` file:
     ```
     VITE_API_URL=https://your-app.up.railway.app
     ```
   - Rebuild and redeploy your frontend

---

### Option 2: Render

1. **Sign up/Login to Render**
   - Go to https://render.com
   - Sign up with GitHub (free tier available)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `Goodlife-Fitness-Gym`

3. **Configure Settings**
   - **Name**: `goodlife-backend-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Add Environment Variables**
   - Scroll to "Environment Variables"
   - Add all the same variables as Railway (see above)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Copy the URL (e.g., `https://goodlife-backend-api.onrender.com`)

6. **Update Frontend**
   - Add `VITE_API_URL` to your frontend `.env` file pointing to your Render URL

---

### Option 3: Vercel (Serverless Functions)

For Vercel, you'll need to convert the Express server to serverless functions. This is more complex but possible.

---

## Environment Variables Required

Make sure to set these in your hosting platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend API key | `re_xxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Email address to send from | `Goodlife Fitness <goodlifeghana13@gmail.com>` |
| `ARKESEL_SENDER_ID` | Arkesel Sender ID | `Goodlife Fitness` |
| `ARKESEL_API_KEY` | Arkesel API Key | `your_arkesel_api_key` |
| `PORT` | Server port (auto-set by platform) | `3001` or `10000` |
| `NODE_ENV` | Environment | `production` |

---

## After Deployment

1. **Test the Backend**
   - Visit `https://your-backend-url/api/health`
   - Should return: `{"status":"ok","message":"Email API server is running"}`

2. **Update Frontend**
   - Add `VITE_API_URL=https://your-backend-url` to your frontend `.env`
   - Rebuild frontend: `npm run build`
   - Redeploy frontend

3. **Verify Email/SMS**
   - Test by creating a new member or confirming a payment
   - Check that emails are sent successfully

---

## Troubleshooting

### Backend won't start
- Check that all environment variables are set
- Verify `npm install` completed successfully
- Check platform logs for errors

### Emails not sending
- Verify `RESEND_API_KEY` is correct
- Check that `RESEND_FROM_EMAIL` uses a verified domain
- Review backend logs for Resend API errors

### CORS errors
- Backend already has CORS enabled (`app.use(cors())`)
- If issues persist, check that frontend `VITE_API_URL` matches backend URL exactly

### Port issues
- Railway/Render auto-assign ports
- Use `process.env.PORT || 3001` in server.js (already configured)

---

## Cost Estimates

- **Railway**: Free tier includes 500 hours/month, $5/month for hobby plan
- **Render**: Free tier available, sleeps after 15min inactivity, $7/month for always-on
- **Vercel**: Free tier for serverless functions

---

## Next Steps

After deploying:
1. Test all email endpoints
2. Test SMS functionality
3. Monitor logs for any issues
4. Set up custom domain (optional)
5. Configure auto-scaling if needed
