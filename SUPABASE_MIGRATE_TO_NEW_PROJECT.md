# Migrating to a New Supabase Project

## Would a New Project Resolve the Timeout Problem?

**It might help**, but it's not guaranteed. Here's when it can help:

| Scenario | New project helps? |
|----------|--------------------|
| Current project has database bloat, corrupted state, or bad config | ✅ Yes |
| Table has no indexes, wrong RLS, or permission issues | ⚠️ Maybe – you can fix these in the current project (run migrations) |
| Large base64 photos in `members` table causing slow queries | ❌ No – same data would have the same issue |
| Supabase free tier limits (e.g. 8s statement timeout) | ❌ No – limits apply to all free projects |
| Unknown/hard-to-debug issues | ✅ Yes – fresh start can rule out environmental problems |

**Recommendation:**  
Try these first in your current project:
1. Run `MIGRATION_FIX_MEMBERS_FETCH_500.sql` (indexes, permissions, RLS).
2. Deploy the pagination changes (smaller page size, fewer photos per request).

If problems persist, migrating to a new project is a reasonable next step.

---

## How to Transfer Data to a New Supabase Project

### Step 1: Create the New Supabase Project

1. Go to [https://supabase.com](https://supabase.com) → Dashboard
2. **New project**
3. Set name, password, region
4. Wait until it’s ready
5. In **Settings → API**, copy the new **Project URL** and **anon key**

---

### Step 2: Export Data from the Current Project

**Option A: Table Editor export (good for small tables without photos)**

1. Open the current project → **Table Editor**
2. Select each table (e.g. `members`, `staff`, `payments`, `announcements`, `gallery`, etc.)
3. Use **Export** / **Download as CSV** where available

**Option B: SQL export (better for tables with large base64 data)**

1. Open current project → **SQL Editor**
2. Run export queries and save the results.

Example for `members`:

```sql
-- Run this and copy the result, or use "Download as CSV" if available
SELECT id, full_name, email, phone, address, emergency_contact, 
       plan, start_date, expiry_date, status, photo, created_at, updated_at 
FROM members;
```

For tables with base64 photos, CSV export can be messy. Prefer the SQL approach or use a script (see Option C).

**Option C: Export via script (recommended, handles all data including photos)**

We provide ready-made scripts:

1. Ensure your `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (current project)
2. Run:
   ```bash
   npm run supabase:export
   ```
3. This creates a `supabase-export/` folder with one JSON file per table

---

### Step 3: Create Schema in the New Project

1. Open the new project → **SQL Editor**
2. Run your schema creation SQL (e.g. from `SUPABASE_SETUP.md`) to create all tables, constraints, indexes, and RLS
3. Run `MIGRATION_FIX_MEMBERS_FETCH_500.sql` and any other migrations you use
4. Make sure `created_at`, `updated_at`, indexes, and RLS are correct from the start

---

### Step 4: Import Data into the New Project

**Option A: Supabase Table Editor import**

1. Open new project → **Table Editor** → select table
2. Use **Import data** / **Insert from CSV** if you have CSV files

**Option B: SQL inserts**

1. Export each table to JSON (or CSV)
2. Convert to `INSERT` statements or use a small script to read JSON and insert via Supabase client
3. Run the inserts in the SQL Editor or via a script

**Option C: Import via script (recommended)**

1. After export, create the schema in the new project (Step 3)
2. Add to `.env` (or set in terminal):
   ```
   NEW_SUPABASE_URL=https://your-new-project.supabase.co
   NEW_SUPABASE_ANON_KEY=your-new-anon-key
   ```
3. Run:
   ```bash
   npm run supabase:import
   ```
4. This reads from `supabase-export/` and inserts into the new project

---

### Step 5: Update the App

1. In GitHub Secrets (or your deploy config), update:
   - `VITE_SUPABASE_URL` → new project URL
   - `VITE_SUPABASE_ANON_KEY` → new project anon key

2. In your local `.env`:
   - Update the same variables

3. Rebuild and redeploy the frontend so it uses the new project

---

## Checklist

- [ ] Create new Supabase project
- [ ] Export data from old project (JSON or CSV)
- [ ] Create schema and run migrations in new project
- [ ] Import data into new project
- [ ] Run `MIGRATION_FIX_MEMBERS_FETCH_500.sql` in new project
- [ ] Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in app
- [ ] Test locally, then redeploy

---

## Tables to Migrate

Typical tables in your setup:

- `members`
- `staff`
- `payments`
- `announcements`
- `gallery`
- `activity_logs`
- `attendance`
- `client_checkins`
- `maintenance_logs`
- `expenses`
- `equipment_posts` (if applicable)

Use your actual schema and migrations as the source of truth.
