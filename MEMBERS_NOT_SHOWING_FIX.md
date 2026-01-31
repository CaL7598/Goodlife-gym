# Members Not Showing – Fix Guide

If you see **"Error fetching members"** and **HTTP 500** in the console, follow these steps.

---

## Step 1: Run the migration in Supabase

1. Go to **https://supabase.com** → your project  
2. Open **SQL Editor** (left sidebar)  
3. Click **New query**  
4. Copy the contents of **`MIGRATION_FIX_MEMBERS_FETCH_500.sql`** and paste into the editor  
5. Click **Run** (or press Ctrl/Cmd + Enter)  
6. Confirm there are no errors

This migration:
- Adds `created_at` and `updated_at` if missing
- Grants `SELECT` to `anon` and `authenticated`
- Disables RLS on `members` so the anon key can read

---

## Step 2: Check Supabase logs (if it still fails)

1. In Supabase, go to **Logs** → **Postgres** or **API**  
2. Trigger the members fetch again (reload the portal)  
3. Look for the **actual error** (e.g. column not found, permission denied, RLS)  
4. Use that error message to decide next steps

---

## Step 3: Confirm members table structure

In **SQL Editor**, run:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'members'
ORDER BY ordinal_position;
```

You should see (among others):

- `id`, `full_name`, `email`, `phone`, `address`, `emergency_contact`  
- `plan`, `start_date`, `expiry_date`, `status`  
- `photo`, `created_at`, `updated_at`  

If any of these are missing, add them or adjust your schema to match.

---

## Step 4: Test in SQL Editor

```sql
SELECT id, full_name, plan, created_at FROM members LIMIT 5;
```

If this works, the problem was permissions or schema. If it fails, the error shown will indicate what to fix.

---

## Summary

| Symptom | Likely cause | Action |
|--------|---------------|--------|
| **Statement timeout** / "canceling statement due to statement timeout" | Query too slow, no index on `created_at` | Run migration (adds index) |
| HTTP 500 + Error fetching members | Missing `created_at` or permissions | Run **MIGRATION_FIX_MEMBERS_FETCH_500.sql** |
| 42501 / permission denied | Anon role can't SELECT | `GRANT SELECT ON members TO anon` |
| RLS blocking reads | RLS enabled, no policy | Migration disables RLS or add permissive policy |

After running the migration, reload the portal and check if members load.
