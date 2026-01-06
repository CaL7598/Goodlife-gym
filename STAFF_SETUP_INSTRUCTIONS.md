# Staff Setup Instructions

This guide explains how to set up the staff members for the Goodlife Fitness Gym Management System.

## What Was Created

1. **SQL Migration File** (`MIGRATION_ADD_STAFF_MEMBERS.sql`)
   - Adds all 5 staff members to Supabase
   - Sets up their roles, positions, and contact information
   - Creates default passwords for initial login

2. **Updated Login System**
   - Login now authenticates against Supabase staff table
   - Falls back to hardcoded credentials for backward compatibility
   - Supports both Super Admin and Staff roles

3. **Staff Credentials Document** (`STAFF_CREDENTIALS.md`)
   - Contains all login credentials
   - Security notes and best practices

## Setup Steps

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `MIGRATION_ADD_STAFF_MEMBERS.sql`
4. Copy and paste the entire SQL script into the SQL Editor
5. Click **Run** to execute the migration

This will:
- Add a `password` column to the staff table (if it doesn't exist)
- Insert all 5 staff members with their credentials
- Update existing staff if they already exist (based on email)

### Step 2: Verify Staff Members

After running the migration, verify the staff were added:

```sql
SELECT full_name, email, role, position, phone 
FROM staff 
WHERE email LIKE '%@goodlifefitnessghana.de'
ORDER BY role, full_name;
```

You should see all 5 staff members:
- Thomas Yeboah (SUPER_ADMIN)
- Ibrahim Kabore (STAFF)
- Famous Nkrumah (STAFF)
- Dauda Yahaya (STAFF)
- Anna Awuah (STAFF)

### Step 3: Test Login

1. Restart your development server if it's running
2. Go to the login page
3. Try logging in with one of the staff credentials from `STAFF_CREDENTIALS.md`

Example:
- Email: `thomas.yeboah@goodlifefitnessghana.de`
- Password: `thomas@2024`

### Step 4: Team Presence & Monitoring

Once staff members log in, they will:
- Appear in the Team Presence section when they sign in/out
- Have their attendance tracked by email address
- Be visible in attendance reports (Super Admin can see all, Staff see only their own)

## Staff Members Summary

| Name | Role | Email | Password | Phone |
|------|------|-------|----------|-------|
| Thomas Yeboah | Super Admin | thomas.yeboah@goodlifefitnessghana.de | thomas@2024 | 055-626-0810 |
| Ibrahim Kabore | Staff | ibrahim.kabore@goodlifefitnessghana.de | ibrahim@2024 | 024-645-8898 |
| Famous Nkrumah | Staff | famous.nkrumah@goodlifefitnessghana.de | famous@2024 | 024-350-5882 |
| Dauda Yahaya | Staff | dauda.yahaya@goodlifefitnessghana.de | dauda@2024 | 024-513-2923 |
| Anna Awuah | Staff | anna.awuah@goodlifefitnessghana.de | anna@2024 | 025-642-7304 |

## Security Recommendations

1. **Change Default Passwords**: All staff should change their passwords after first login
2. **Password Policy**: Consider implementing:
   - Minimum 8 characters
   - Mix of letters, numbers, and special characters
   - Regular password updates
3. **Email Verification**: Ensure all staff emails are valid and accessible
4. **Access Control**: Review privileges for each staff member based on their role

## Troubleshooting

### Staff Cannot Log In

1. **Check Supabase Connection**: Verify your `.env` file has correct Supabase credentials
2. **Verify Staff Exists**: Run the verification SQL query above
3. **Check Password**: Ensure password matches exactly (case-sensitive)
4. **Check Email**: Email must match exactly (case-sensitive)

### Staff Not Appearing in Team Presence

1. **Check Email Match**: Staff must sign in with the exact email from the database
2. **Verify Attendance Records**: Check if attendance records are being created
3. **Check Permissions**: Super Admin can see all, Staff see only their own

### Migration Errors

If you get errors when running the migration:

1. **Password Column Already Exists**: This is fine, the migration uses `ADD COLUMN IF NOT EXISTS`
2. **Duplicate Email**: The migration uses `ON CONFLICT DO UPDATE` to handle existing staff
3. **Role Constraint**: Ensure the role values match: 'PUBLIC', 'STAFF', or 'SUPER_ADMIN'

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Test login with each staff member
3. ✅ Verify team presence tracking works
4. ⚠️ Change default passwords (recommended)
5. ⚠️ Set up email notifications for staff (optional)
6. ⚠️ Configure privileges for each staff member (optional)

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the server console for errors
3. Verify Supabase connection and credentials
4. Review the SQL migration output for any warnings

