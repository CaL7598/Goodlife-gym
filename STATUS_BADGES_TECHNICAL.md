# Status Badge System - Technical Overview

## How Status Badges Work

The status badge system is **fully automatic** and calculates member status in real-time based on the expiry date. You never need to manually update the status.

## Architecture

### 1. Database Layer (`lib/database.ts`)

```typescript
function mapMemberFromDB(db: any): Member {
  const plan = db.plan as SubscriptionPlan;
  const expiryDate = db.expiry_date;
  
  // Automatically calculate status based on expiry date
  const calculatedStatus = calculateMemberStatus(expiryDate, plan);
  
  return {
    id: db.id,
    fullName: db.full_name,
    // ... other fields
    expiryDate: expiryDate,
    status: calculatedStatus, // ✅ Always calculated, never stored value
  };
}
```

**Key Points:**
- Every time a member is fetched from Supabase, status is recalculated
- The stored `status` field in the database is **ignored**
- Status is based purely on `expiry_date` vs current date/time

### 2. Status Calculation Logic (`lib/dateUtils.ts`)

```typescript
export function calculateMemberStatus(
  expiryDate: string, 
  plan: SubscriptionPlan
): 'active' | 'expiring' | 'expired' {
  
  const now = new Date();
  let expiry: Date;
  
  // Parse expiry date correctly
  if (expiryDate.includes('T')) {
    // Datetime format for day passes (e.g., 2025-01-15T11:00:00)
    expiry = new Date(expiryDate);
  } else {
    // Date-only format for regular plans (e.g., 2025-01-15)
    // Set to end of day for fair comparison
    expiry = new Date(year, month, day, 23, 59, 59, 999);
  }
  
  // Check if expired
  if (expiry < now) {
    return 'expired'; // ❌ Red badge
  }
  
  // Check if expiring soon
  const timeUntilExpiry = expiry.getTime() - now.getTime();
  
  if (plan === SubscriptionPlan.DAY_MORNING || 
      plan === SubscriptionPlan.DAY_EVENING) {
    // Day passes: expiring if within 1 hour
    if (timeUntilExpiry < 60 * 60 * 1000) {
      return 'expiring'; // ⏰ Yellow badge
    }
  } else {
    // Regular plans: expiring if within 7 days
    if (timeUntilExpiry < 7 * 24 * 60 * 60 * 1000) {
      return 'expiring'; // ⏰ Yellow badge
    }
  }
  
  return 'active'; // ✅ Green badge
}
```

### 3. Adding Existing Members

When you add an existing member:

```typescript
const handleAddExistingMember = async (e: React.FormEvent) => {
  // For day passes, ensure time is set correctly
  let finalExpiryDate = existingMember.expiryDate!;
  if (existingMember.plan === SubscriptionPlan.DAY_MORNING) {
    finalExpiryDate = `${finalExpiryDate}T11:00:00`;
  } else if (existingMember.plan === SubscriptionPlan.DAY_EVENING) {
    finalExpiryDate = `${finalExpiryDate}T20:00:00`;
  }

  const memberData: Omit<Member, 'id'> = {
    ...existingMember,
    expiryDate: finalExpiryDate,
    status: 'active', // ⚠️ This will be overridden when fetched
  };

  // Save to Supabase
  const createdMember = await membersService.create(memberData);
  
  // ✅ When fetched, status is automatically recalculated
};
```

## Data Flow

```
1. User enters dates in "Add Existing Member" form
   ↓
2. System adds appropriate time for day passes (11:00 AM / 8:00 PM)
   ↓
3. Member saved to Supabase with:
   - start_date: "2025-01-15"
   - expiry_date: "2025-02-15" or "2025-01-15T11:00:00"
   - status: "active" (placeholder, will be overridden)
   ↓
4. When member is fetched from database:
   ↓
5. mapMemberFromDB() calls calculateMemberStatus()
   ↓
6. Status calculated in real-time based on:
   - Current date/time
   - Expiry date/time
   - Plan type
   ↓
7. Correct badge displayed to user:
   - 🟢 Active
   - 🟡 Expiring
   - 🔴 Expired
```

## Status Badge Display

### Active (Green)
- Expiry date is more than 7 days away (regular plans)
- Expiry time is more than 1 hour away (day passes)
- Member can access gym

### Expiring (Yellow)
- Expiry date is within 7 days (regular plans)
- Expiry time is within 1 hour (day passes)
- Warning to renew soon

### Expired (Red)
- Current date/time is past expiry date/time
- Member needs to renew
- Appears in "Expired Members" tab

## Example Scenarios

### Regular Plan (Monthly)
```
Registration: 2025-01-01
Expiry: 2025-02-01 (stored as: 2025-02-01)
Current: 2025-01-20

Calculation:
- expiry = 2025-02-01 23:59:59 (end of day)
- now = 2025-01-20 (any time)
- timeUntilExpiry = 12 days
- 12 days > 7 days
- Status: ACTIVE ✅
```

### Day Pass Morning
```
Registration: 2025-01-15
Expiry: 2025-01-15 11:00:00 (stored as: 2025-01-15T11:00:00)
Current: 2025-01-15 10:45:00

Calculation:
- expiry = 2025-01-15 11:00:00
- now = 2025-01-15 10:45:00
- timeUntilExpiry = 15 minutes
- 15 minutes < 1 hour
- Status: EXPIRING ⏰
```

### Expired Member
```
Registration: 2024-12-01
Expiry: 2025-01-01 (stored as: 2025-01-01)
Current: 2025-01-15

Calculation:
- expiry = 2025-01-01 23:59:59
- now = 2025-01-15 (any time)
- expiry < now
- Status: EXPIRED ❌
```

## Key Benefits

1. ✅ **Always Accurate** - Status reflects current date/time
2. ✅ **No Manual Updates** - Calculated automatically
3. ✅ **Works for All Members** - New, existing, renewed
4. ✅ **Day Pass Support** - Handles time-based expiry
5. ✅ **Database Independent** - Stored status is ignored
6. ✅ **Real-Time** - Updates as time passes

## Supabase Integration

### What's Stored
```sql
CREATE TABLE members (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  plan text NOT NULL,
  start_date text NOT NULL,  -- YYYY-MM-DD
  expiry_date text NOT NULL, -- YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  status text,               -- ⚠️ Stored but ignored on read
  photo text,
  created_at timestamp DEFAULT now()
);
```

### What's Calculated
- `status` field is **recalculated every time** data is fetched
- No database triggers or cron jobs needed
- Pure client-side calculation

## Testing

To verify the status badges work:

1. **Add an expired member:**
   - Registration: 2024-01-01
   - Expiry: 2024-12-31
   - Expected: RED "Expired" badge

2. **Add an expiring member:**
   - Registration: (today)
   - Expiry: (today + 3 days)
   - Expected: YELLOW "Expiring" badge

3. **Add an active member:**
   - Registration: (today)
   - Expiry: (today + 30 days)
   - Expected: GREEN "Active" badge

4. **Add a day pass (morning):**
   - Registration: (today)
   - Expiry: (today) - system adds 11:00:00
   - Current time before 10:00 AM: GREEN "Active"
   - Current time 10:30 AM: YELLOW "Expiring"
   - Current time after 11:00 AM: RED "Expired"

## Summary

The status badge system is **fully automatic and foolproof**:
- No manual status updates required
- Works perfectly with existing members
- Handles day passes with time-based expiry
- Always shows accurate status
- Integrated seamlessly with Supabase

You can add existing members with any dates, and the system will automatically show the correct status badge based on those dates!
