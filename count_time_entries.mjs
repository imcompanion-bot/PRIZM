import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", Array.from(res.headers.entries()));
    const body = await res.json();
    console.log("Body:", body);

    // Let's query all entries for May 2026 to see if they exist
    const resMay = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?date=gte.2026-05-01&date=lte.2026-05-31&select=id,project_code,project_id,project_name&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("May 2026 Status:", resMay.status);
    const mayEntries = await resMay.json();
    console.log(`May 2026 Entries Sample (count: ${mayEntries.length}):`, JSON.stringify(mayEntries, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
