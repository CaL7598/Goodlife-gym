# SMS Setup – Step-by-Step Guide

Follow these steps **in order** to get SMS working. You’ll need:

- Access to **Render** (backend)
- Access to **GitHub** (repo settings + Actions)
- Access to **Arkesel** (sms.arkesel.com)
- Your **backend URL** (e.g. `https://goodlife-backend-api.onrender.com` — from Render dashboard → your service → top of page)

---

## Step 1: Fix Sender ID on Render (Backend)

Arkesel allows **maximum 11 characters** for the sender ID. "Goodlife Fitness" (16) fails. Use **"GOODLIFE GH"** (11 characters).

### 1.1 Open Render

1. Go to **https://dashboard.render.com**
2. Log in.
3. Click your **backend service** (e.g. **goodlife-backend-api**).

### 1.2 Open Environment

1. In the left sidebar, click **Environment**.
2. You’ll see env vars like `RESEND_API_KEY`, `ARKESEL_SENDER_ID`, `ARKESEL_API_KEY`, etc.

### 1.3 Update ARKESEL_SENDER_ID

1. Find **ARKESEL_SENDER_ID**.
2. Click **Edit** (or the pencil icon).
3. **Current value might be:** `Goodlife Fitness`
4. **Change it to:** `GOODLIFE GH`  
   - All caps, space between GOODLIFE and GH.  
   - Exactly 11 characters.
5. Click **Save**.

### 1.4 Confirm ARKESEL_API_KEY

1. Find **ARKESEL_API_KEY**.
2. Ensure it’s set to your Arkesel API key (from [Arkesel](https://sms.arkesel.com)).
3. If it’s missing, click **Add Environment Variable**:
   - **Key:** `ARKESEL_API_KEY`
   - **Value:** your Arkesel API key  
4. Save.

### 1.5 Redeploy

1. Go to the **Manual Deploy** section (top right).
2. Click **Deploy latest commit** (or **Clear build cache & deploy** if you prefer).
3. Wait until the deploy status is **Live**.

---

## Step 2: Verify Arkesel Account (Sender ID & Balance)

### 2.1 Log in to Arkesel

1. Go to **https://sms.arkesel.com**
2. Log in.

### 2.2 Check Sender ID

1. Look for **Sender ID**, **SMS**, or **Settings** in the menu.
2. Find your **registered / approved** sender IDs.
3. Ensure **GOODLIFE GH** is there and **approved**.  
   - If not, use the option to **register** a new sender ID (e.g. "GOODLIFE GH") and wait for approval, or contact **support@arkesel.com**.

### 2.3 Get API Key (if needed)

1. Go to **SMS** → **API** or **API Key** / **API Info**.
2. Copy your **API key**.
3. Use this same value for **ARKESEL_API_KEY** on Render (Step 1.4).

### 2.4 Check SMS Balance

1. In the dashboard, check **SMS balance** or **credits**.
2. If it’s **0**, buy credits so you can send SMS.

---

## Step 3: Set VITE_API_URL for Frontend (GitHub Pages / Production)

The **frontend** (your website) must know your **backend URL** to send SMS. That URL is stored in **VITE_API_URL** and baked in at **build time**.

### 3.1 Get Your Backend URL

1. Go to **https://dashboard.render.com** → your **backend service** (e.g. goodlife-backend-api).
2. At the top you’ll see the **service URL**, e.g. `https://goodlife-backend-api.onrender.com`.
3. Copy that **exact** URL (no trailing slash). You’ll use it as `VITE_API_URL`.

### 3.2 Open GitHub Repo Settings

1. Go to **https://github.com/CaL7598/Goodlife-gym** (or your repo).
2. Click **Settings**.
3. In the left sidebar, open **Secrets and variables** → **Actions**.

### 3.3 Add or Update VITE_API_URL

1. Under **Repository secrets**, check if **VITE_API_URL** exists.
2. **If it exists:**  
   - Click **Update** and set **Value** to your backend URL (e.g. `https://goodlife-backend-api.onrender.com`).  
   - No `https://` typo, no trailing slash.
3. **If it doesn’t exist:**  
   - Click **New repository secret**.  
   - **Name:** `VITE_API_URL`  
   - **Value:** your backend URL (e.g. `https://goodlife-backend-api.onrender.com`).  
   - Save.

### 3.4 Rebuild the Frontend

The site uses **VITE_API_URL** only when the app is **built**. So you must **trigger a new build** after changing it.

**Option A – Push a commit**

1. Make a small change (e.g. add a space in a file), commit, and push to `main`:
   ```bash
   git add .
   git commit -m "Trigger rebuild for VITE_API_URL"
   git push origin main
   ```
2. If you use **GitHub Actions** for deploy, wait for the workflow to finish.

**Option B – Re-run the deploy workflow**

1. Go to **Actions** in your repo.
2. Open the workflow that deploys the site (e.g. “Deploy” or “Pages”).
3. Click **Run workflow** → run on `main`.
4. Wait for it to complete.

After the new build, the live site will use the updated **VITE_API_URL**.

---

## Step 4: Check SMS Config (Diagnostic)

### 4.1 Open the SMS config endpoint

In your browser, go to:

```
https://YOUR_BACKEND_URL/api/sms-config
```

Replace `YOUR_BACKEND_URL` with your real backend URL (e.g. `https://goodlife-backend-api.onrender.com`).

### 4.2 What you should see

**Good setup** – something like:

```json
{
  "smsConfigured": true,
  "senderIdSet": true,
  "apiKeySet": true,
  "senderIdLength": 11,
  "senderIdValid": true,
  "suggestion": "SMS looks configured. Use GOODLIFE GH (≤11 chars) if sends fail."
}
```

**If something is wrong:**

- `senderIdValid: false` or `senderIdLength` > 11 → Sender ID invalid. Use **GOODLIFE GH** on Render (Step 1).
- `apiKeySet: false` → Add **ARKESEL_API_KEY** on Render (Step 1.4).
- `senderIdSet: false` → Add **ARKESEL_SENDER_ID** on Render (Step 1.3).

Fix those, redeploy the backend, then check **/api/sms-config** again.

---

## Step 5: Test SMS

### 5.1 Ensure backend is live

- Render dashboard → your backend service → status **Live**.

### 5.2 Test via your app

**Option A – New member registration**

1. Open your **live site** (e.g. Goodlife Fitness Ghana).
2. Go to **Join / Register** or **Checkout**.
3. Register a **new member** with:
   - A **valid Ghana phone number** (e.g. 0244123456 or 0546153765).
   - Email optional.
4. Complete registration.  
5. The app sends a **welcome SMS** to that number. Check the phone for the SMS.

**Option B – Record a payment**

1. Log in to **Admin** or **Staff**.
2. Open **Payment Center** → **Record Payment**.
3. Select a member with a **phone number**.
4. Enter amount, method (e.g. Cash), confirm.  
5. A **payment confirmation SMS** goes to that member’s number. Check the phone.

### 5.3 Check backend logs (if no SMS)

1. Render → your backend service → **Logs**.
2. Look for:
   - `📱 Attempting to send SMS`  
   - `✅ Welcome SMS sent successfully` or `✅ Payment SMS sent successfully`  
3. If you see **errors** (e.g. `Authentication Failed`, `Invalid sender`), use **SMS_TROUBLESHOOTING.md** and the **suggestion** from **/api/sms-config** to fix them.

---

## Quick Checklist

Use this before asking “why is SMS not working?”:

- [ ] **Step 1:** `ARKESEL_SENDER_ID` = **GOODLIFE GH** on Render (not "Goodlife Fitness").
- [ ] **Step 1:** `ARKESEL_API_KEY` set on Render.
- [ ] **Step 1:** Backend **redeployed** after env changes.
- [ ] **Step 2:** **GOODLIFE GH** registered and **approved** in Arkesel.
- [ ] **Step 2:** Arkesel **API key** correct and **SMS balance** > 0.
- [ ] **Step 3:** **VITE_API_URL** set in GitHub **Actions** secrets to backend URL.
- [ ] **Step 3:** Frontend **rebuilt** after changing **VITE_API_URL** (push or re-run workflow).
- [ ] **Step 4:** **/api/sms-config** shows `smsConfigured: true` and `senderIdValid: true`.
- [ ] **Step 5:** Tested with a **real Ghana number** (registration or record payment).

---

## Summary

1. **Render:** Set `ARKESEL_SENDER_ID=GOODLIFE GH`, set `ARKESEL_API_KEY`, redeploy.  
2. **Arkesel:** Approve **GOODLIFE GH**, check API key and balance.  
3. **GitHub:** Set `VITE_API_URL` to backend URL, then **rebuild** the frontend.  
4. **Verify:** Open **/api/sms-config** and fix any reported issues.  
5. **Test:** Register a new member or record a payment with a Ghana phone number and confirm SMS is received.

For more detail on errors and edge cases, see **SMS_TROUBLESHOOTING.md**.
