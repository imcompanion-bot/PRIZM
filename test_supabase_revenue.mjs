import fs from 'fs';
import path from 'path';

const envPath = path.join('/Users/jamesbrazier/Documents/GitHub/PRIZM', '.env');
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
    let projects = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      projects.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    console.log(`Fetched ${projects.length} projects from Supabase.`);

    let nullRevenueCount = 0;
    let zeroRevenueCount = 0;
    let positiveRevenueCount = 0;
    const samples = [];

    for (const p of projects) {
      if (p.revenue === undefined) {
        nullRevenueCount++;
      } else if (p.revenue === null || p.revenue === 0) {
        zeroRevenueCount++;
      } else {
        positiveRevenueCount++;
        if (samples.length < 10) {
          samples.push(p);
        }
      }
    }

    console.log(`Revenue stats in Supabase projects:`);
    console.log(`- Undefined: ${nullRevenueCount}`);
    console.log(`- Null or Zero: ${zeroRevenueCount}`);
    console.log(`- Positive (>0): ${positiveRevenueCount}`);

  } catch (err) {
    console.error(err);
  }
}

run();
