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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?project_id=is.null&project_code=not.is.null&date=gte.2026-05-01&date=lte.2026-05-31&select=project_code,project_name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("Error fetching data:", data);
      return;
    }

    const counts = {};
    for (const te of data) {
      const key = `${te.project_code} - ${te.project_name}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log(`Unmatched time entries in May 2026: ${data.length}`);
    console.log("Top unmatched project codes/names:");
    console.log(sorted.slice(0, 30));

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
