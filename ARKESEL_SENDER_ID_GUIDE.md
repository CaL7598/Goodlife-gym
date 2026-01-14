# How to Get Your Arkesel Sender ID

## What is a Sender ID?

A **Sender ID** is the name that appears as the sender when recipients receive your SMS messages. For example:
- "Goodlife Fitness" (your business name)
- "GOODLIFE" (short code)
- A numeric short code like "1234"

## Why You Can't Find It

**Sender IDs must be registered and approved by Arkesel before you can use them.** If you can't find it in your dashboard, it means you haven't registered one yet.

## How to Register a Sender ID

### Option 1: Through Arkesel Dashboard

1. **Log in to Arkesel Dashboard**
   - Go to [https://sms.arkesel.com/](https://sms.arkesel.com/)
   - Log in with your account

2. **Navigate to Sender ID Section**
   - Look for **"Sender ID"**, **"Sender ID Management"**, or **"Register Sender ID"**
   - This might be under **Settings**, **SMS**, or **API** section

3. **Submit Registration Request**
   - Click **"Register New Sender ID"** or **"Request Sender ID"**
   - Enter your desired sender ID: `Goodlife Fitness` (or `GOODLIFE` if shorter)
   - **Requirements:**
     - Must be 3-11 characters
     - Can be alphanumeric
     - Should match your business name

4. **Provide Documentation** (if required)
   - Business registration certificate
   - Business operating license
   - Company registration documents
   - Any other documents Arkesel requests

5. **Wait for Approval**
   - Arkesel will review your application
   - Approval typically takes **1-7 business days**
   - You'll receive email notification when approved

### Option 2: Contact Arkesel Support

If you can't find the registration option in the dashboard:

1. **Email Arkesel Support**
   - Email: support@arkesel.com (or check their website for contact)
   - Subject: "Sender ID Registration Request"

2. **Include in Your Email:**
   - Your Arkesel account email
   - Desired sender ID: "Goodlife Fitness"
   - Business name: Goodlife Fitness Ghana
   - Purpose: Member notifications (welcome, payment confirmations, reminders)
   - Attach business registration documents if available

3. **Wait for Response**
   - They'll guide you through the registration process
   - They may provide a temporary sender ID for testing

## Temporary Solution: Use Default/Generic Sender ID

While waiting for approval, you can:

1. **Check if Arkesel provides a default sender ID**
   - Some accounts come with a default sender ID
   - Check your dashboard for any pre-approved sender IDs
   - Look in **Settings** → **SMS Settings** or **API Settings**

2. **Use a Generic Sender ID** (if available)
   - Some providers allow generic IDs like "SMS" or "ALERT"
   - Check with Arkesel support if this is available

3. **Use Your Account Name**
   - Try using your Arkesel account name as sender ID
   - This might work temporarily until your custom one is approved

## What to Use in Your .env File

Once you have your approved sender ID, add it to your `.env`:

```env
ARKESEL_SENDER_ID=Goodlife Fitness
```

**Or if you got a shorter one:**

```env
ARKESEL_SENDER_ID=GOODLIFE
```

## Testing Without Approved Sender ID

If you need to test immediately:

1. **Contact Arkesel Support** and ask for:
   - A temporary test sender ID
   - Or if they can expedite your registration

2. **Use API to Check Available Sender IDs**
   - Some Arkesel accounts show available sender IDs in the API response
   - Check your dashboard's API documentation section

## Common Sender ID Formats

- **Business Name**: `Goodlife Fitness` (up to 11 characters)
- **Short Code**: `GOODLIFE` (shorter, easier to remember)
- **Numeric**: `1234` (if available in your region)

## Important Notes

⚠️ **Sender ID Requirements:**
- Must be approved before use
- Cannot be changed frequently
- Must comply with local regulations
- May require business documentation

✅ **Best Practices:**
- Use your business name for brand recognition
- Keep it short (under 11 characters)
- Make it memorable
- Ensure it matches your business registration

## Quick Checklist

- [ ] Logged into Arkesel dashboard
- [ ] Checked Settings/API section for Sender ID options
- [ ] Submitted registration request (if option available)
- [ ] Contacted Arkesel support (if no option found)
- [ ] Provided business documentation
- [ ] Waiting for approval
- [ ] Received approval email
- [ ] Added approved sender ID to `.env` file

## Need Help?

- **Arkesel Support**: support@arkesel.com
- **Arkesel Dashboard**: [https://sms.arkesel.com/](https://sms.arkesel.com/)
- **Arkesel Documentation**: Check their help/docs section

## After Getting Your Sender ID

Once approved:

1. Add to `.env`:
   ```env
   ARKESEL_SENDER_ID=YourApprovedSenderID
   ```

2. Add to Render (production):
   - Go to Render dashboard → Your service → Environment
   - Add: `ARKESEL_SENDER_ID` = `YourApprovedSenderID`

3. Restart your server

4. Test SMS sending
