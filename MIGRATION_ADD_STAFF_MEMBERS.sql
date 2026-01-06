-- Migration: Add Goodlife Fitness Staff Members
-- Run this in your Supabase SQL Editor

-- First, ensure the staff table has a password column for authentication
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN staff.password IS 'Hashed or plain text password for staff authentication. For initial setup, using simple passwords that should be changed on first login.';

-- Insert staff members with their credentials
-- Note: Passwords are set to a default format: firstname@2024 (should be changed on first login)
-- CEO - Super Admin
INSERT INTO staff (full_name, email, role, position, phone, password) VALUES
  (
    'Thomas Yeboah',
    'thomas.yeboah@goodlifefitnessghana.de',
    'SUPER_ADMIN',
    'CEO',
    '0556260810',
    'thomas@2024'
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Operation Manager / Technician - Staff
INSERT INTO staff (full_name, email, role, position, phone, password) VALUES
  (
    'Ibrahim Kabore',
    'ibrahim.kabore@goodlifefitnessghana.de',
    'STAFF',
    'Operation Manager / Technician',
    '0246458898',
    'ibrahim@2024'
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  updated_at = NOW();

-- General Manager / Trainer - Staff
INSERT INTO staff (full_name, email, role, position, phone, password) VALUES
  (
    'Famous Nkrumah',
    'famous.nkrumah@goodlifefitnessghana.de',
    'STAFF',
    'General Manager / Trainer',
    '0243505882',
    'famous@2024'
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Trainer - Staff
INSERT INTO staff (full_name, email, role, position, phone, password) VALUES
  (
    'Dauda Yahaya',
    'dauda.yahaya@goodlifefitnessghana.de',
    'STAFF',
    'Trainer',
    '0245132923',
    'dauda@2024'
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Receptionist - Staff
INSERT INTO staff (full_name, email, role, position, phone, password) VALUES
  (
    'Anna Awuah',
    'anna.awuah@goodlifefitnessghana.de',
    'STAFF',
    'Receptionist',
    '0256427304',
    'anna@2024'
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Verify the staff members were added
SELECT 
  full_name,
  email,
  role,
  position,
  phone,
  CASE WHEN password IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status,
  created_at
FROM staff
WHERE email LIKE '%@goodlifefitnessghana.de'
ORDER BY 
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'STAFF' THEN 2
    ELSE 3
  END,
  full_name;

