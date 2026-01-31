# SMS Not Working? Troubleshooting Guide

Use this checklist when SMS (Arkesel) is not sending.

---

## 1. Check Backend Can Be Reached (Production)

SMS is sent **via your backend API**. The frontend calls `/api/send-welcome-sms`, `/api/send-payment-sms`, etc.

- **Is the backend deployed?** (e.g. Render `goodlife-backend-api`)
- **Is `VITE_API_URL` set for the frontend build?**
  - GitHub → repo → Settings → Secrets and variables → Actions
  - Add `VITE_API_URL` = your backend URL (e.g. `https://goodlife-backend-api.onrender.com`)
  - Rebuild/redeploy the frontend so the build uses it.
- **Can the live site reach the backend?** Open DevTools → Network, trigger an action that sends SMS (e.g. new registration), and check if the request to `VITE_API_URL/api/send-welcome-sms` is made and what it returns (200 vs 4xx/5xx).

If the frontend never calls the backend, or the backend is unreachable, SMS will not work.

---

## 2. Check SMS Config on the Backend

Your backend reads **Arkesel** env vars. These must be set **where the backend runs** (e.g. Render Environment).

### Required variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ARKESEL_SENDER_ID` | Sender name (max **11 characters**) | `GOODLIFE GH` |
| `ARKESEL_API_KEY` | Arkesel API key | From [Arkesel](https://sms.arkesel.com) |

### Diagnostic endpoint

- **Local:** `http://localhost:YOUR_PORT/api/sms-config`
- **Production:** `https://YOUR_BACKEND_URL/api/sms-config`

Example response:

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

- If `smsConfigured` is `false`, fix `suggestion` (missing vars or invalid sender ID).
- If `senderIdLength` > 11 or `senderIdValid` is `false`, Arkesel will reject sends. Use a shorter ID (see below).

---

## 3. Sender ID Must Be ≤ 11 Characters

Arkesel allows **up to 11 alphanumeric characters** for the sender ID.

- ❌ `Goodlife Fitness` (16 characters) — **too long**, will fail.
- ✅ `GOODLIFE GH` (11 characters)
- ✅ `GOODLIFE` (8 characters)

**Fix:** Set `ARKESEL_SENDER_ID=GOODLIFE GH` (or another ≤11‑char ID you’ve registered with Arkesel) in your backend environment (e.g. Render), then redeploy.

---

## 4. Sender ID Must Be Approved

The sender ID must be **registered and approved** in your Arkesel account.

- Log in at [https://sms.arkesel.com](https://sms.arkesel.com).
- Check **Sender IDs** / **SMS** settings.
- If your ID is not listed or not approved, request it (dashboard or [support@arkesel.com](mailto:support@arkesel.com)).

Until it’s approved, Arkesel may reject messages (e.g. authentication or “invalid sender” type errors).

---

## 5. API Key and Balance

- **API key:** From Arkesel dashboard (e.g. SMS / API section). Ensure `ARKESEL_API_KEY` matches exactly (no extra spaces, correct secret in Render).
- **Balance:** In Arkesel, check SMS balance. No credits ⇒ no SMS sent.

---

## 6. Phone Number Format

The backend normalizes numbers to **233XXXXXXXXX** (Ghana).

- ✅ `0244123456` → `233244123456`
- ✅ `233244123456`
- ✅ `+233244123456` → `233244123456`

If you use other formats, ensure they’re valid Ghana numbers; otherwise Arkesel may reject them.

---

## 7. Common Errors and Fixes

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| No SMS, no request to backend | `VITE_API_URL` not set or wrong | Set `VITE_API_URL` to backend URL and rebuild frontend |
| `503` / “SMS service not configured” | Arkesel env vars missing on backend | Add `ARKESEL_SENDER_ID` and `ARKESEL_API_KEY` in Render (or local `.env`) |
| `400` / “Invalid sender ID” / “Sender ID must be ≤11 characters” | Sender ID too long | Use e.g. `ARKESEL_SENDER_ID=GOODLIFE GH` |
| `102` / “Authentication Failed” | Wrong API key or sender ID not approved | Check key, confirm sender ID approved in Arkesel |
| Request to backend OK, but no SMS | Arkesel reject (balance, sender, number) | Check Arkesel balance, sender ID, and phone format |

---

## 8. Quick Checklist

- [ ] Backend deployed and reachable at `VITE_API_URL`
- [ ] `VITE_API_URL` set in frontend build (e.g. GitHub Actions secrets) and frontend redeployed
- [ ] `ARKESEL_SENDER_ID` and `ARKESEL_API_KEY` set in backend environment (e.g. Render)
- [ ] Sender ID ≤ 11 characters (e.g. `GOODLIFE GH`)
- [ ] Sender ID approved in Arkesel
- [ ] Arkesel API key correct and account has SMS balance
- [ ] `GET /api/sms-config` shows `smsConfigured: true` and `senderIdValid: true`

---

## 9. Test SMS

1. **Config:** Open `https://YOUR_BACKEND_URL/api/sms-config` and confirm `smsConfigured` and `senderIdValid` are `true`.
2. **Flow:** Register a new member with a valid Ghana phone number, or record a payment for a member with a phone number.
3. **Backend logs:** Check Render (or local) logs for `📱 Attempting to send SMS` and either `✅ Welcome SMS sent successfully` / `✅ Payment SMS sent successfully` or an error.
4. **Arkesel:** Check Arkesel dashboard for recent sends and balance changes.

If you’ve checked all of the above and SMS still fails, use the `/api/sms-config` response and backend error logs when asking for support.
