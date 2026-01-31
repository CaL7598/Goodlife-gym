/**
 * Import data from JSON files into Supabase
 * Run: NEW_SUPABASE_URL=... NEW_SUPABASE_ANON_KEY=... node scripts/import-supabase-data.js
 * IMPORTANT: Create all tables in the new project first (run SUPABASE_SETUP.sql + migrations)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = process.env.NEW_SUPABASE_URL;
const key = process.env.NEW_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Set NEW_SUPABASE_URL and NEW_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const dir = './supabase-export';
if (!fs.existsSync(dir)) {
  console.error(`Run export-supabase-data.js first to create ${dir}/`);
  process.exit(1);
}

const tables = [
  'members', 'staff', 'payments', 'announcements', 'gallery',
  'activity_logs', 'attendance', 'client_checkins',
  'maintenance_logs', 'expenses', 'equipment_posts'
];

for (const table of tables) {
  const path = `${dir}/${table}.json`;
  if (!fs.existsSync(path)) continue;
  try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  Skip ${table}: empty or invalid`);
      continue;
    }
    const { error } = await supabase.from(table).insert(data);
    if (error) {
      console.warn(`  Error ${table}:`, error.message);
    } else {
      console.log(`Imported ${data.length} rows into ${table}`);
    }
  } catch (e) {
    console.warn(`  Error ${table}:`, e.message);
  }
}

console.log('\nDone.');
