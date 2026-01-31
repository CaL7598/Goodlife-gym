/**
 * Export all data from Supabase to JSON files
 * Run: OLD_SUPABASE_URL=... OLD_SUPABASE_ANON_KEY=... node scripts/export-supabase-data.js
 * Or add to .env and run: node scripts/export-supabase-data.js
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = process.env.OLD_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.OLD_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// For export, default to current project (VITE_ vars in .env)

if (!url || !key) {
  console.error('Set OLD_SUPABASE_URL and OLD_SUPABASE_ANON_KEY (or VITE_SUPABASE_*)');
  process.exit(1);
}

const supabase = createClient(url, key);

const tables = [
  'members', 'staff', 'payments', 'announcements', 'gallery',
  'activity_logs', 'attendance', 'client_checkins',
  'maintenance_logs', 'expenses', 'equipment_posts'
];

const dir = './supabase-export';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`  Skip ${table}: ${error.message}`);
      continue;
    }
    const count = (data || []).length;
    fs.writeFileSync(`${dir}/${table}.json`, JSON.stringify(data || [], null, 2));
    console.log(`Exported ${count} rows from ${table}`);
  } catch (e) {
    console.warn(`  Error ${table}:`, e.message);
  }
}

console.log(`\nDone. Files saved to ${dir}/`);
