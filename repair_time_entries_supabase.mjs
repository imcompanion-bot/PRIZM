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
    console.log("Fetching all projects from Supabase...");
    let projects = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,opportunity_number,title&limit=${batchSize}&offset=${offset}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      projects.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    console.log(`Loaded ${projects.length} projects.`);

    const projectMapByCode = new Map();
    for (const p of projects) {
      if (p.opportunity_number) {
        projectMapByCode.set(p.opportunity_number.toLowerCase().trim(), p.id);
      }
    }
    console.log(`Mapped ${projectMapByCode.size} projects by opportunity number.`);

    console.log("Fetching orphan time entries month-by-month to avoid timeouts...");
    const orphanEntries = [];
    
    // Scan from Jan 2025 to Dec 2026 (the active ranges)
    const startYear = 2025;
    const startMonth = 1;
    const endYear = 2026;
    const endMonth = 12;

    for (let year = startYear; year <= endYear; year++) {
      const mStart = (year === startYear) ? startMonth : 1;
      const mEnd = (year === endYear) ? endMonth : 12;
      for (let month = mStart; month <= mEnd; month++) {
        const yyyy = year;
        const mm = String(month).padStart(2, '0');
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMm = String(nextMonth).padStart(2, '0');
        
        const dateStart = `${yyyy}-${mm}-01`;
        const dateEnd = `${nextYear}-${nextMm}-01`;

        let offset = 0;
        let monthCount = 0;
        while (true) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?project_id=is.null&project_code=not.is.null&date=gte.${dateStart}&date=lt.${dateEnd}&limit=${batchSize}&offset=${offset}`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          });
          const data = await res.json();
          if (!Array.isArray(data)) {
            console.error(`Error for ${yyyy}-${mm}:`, data);
            break;
          }
          if (data.length === 0) break;
          const filtered = data.filter(te => te.project_code && te.project_code.trim() !== "");
          orphanEntries.push(...filtered);
          monthCount += filtered.length;
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        if (monthCount > 0) {
          console.log(`  Found ${monthCount} orphans in ${yyyy}-${mm}`);
        }
      }
    }

    console.log(`Total orphan time entries found: ${orphanEntries.length}`);

    let matchedCount = 0;
    const updates = [];

    for (const te of orphanEntries) {
      const code = te.project_code.toLowerCase().trim();
      const matchedProjectId = projectMapByCode.get(code);
      if (matchedProjectId) {
        updates.push({ id: te.id, project_id: matchedProjectId });
        matchedCount++;
      }
    }

    console.log(`Matched: ${matchedCount} / ${orphanEntries.length}`);

    if (updates.length > 0) {
      console.log(`Updating time entries in Supabase in parallel batches...`);
      const CONCURRENCY_LIMIT = 50;
      for (let i = 0; i < updates.length; i += CONCURRENCY_LIMIT) {
        const batch = updates.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(batch.map(async (up) => {
          try {
            const upRes = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?id=eq.${up.id}`, {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ project_id: up.project_id })
            });
            if (!upRes.ok) {
              console.error(`Failed to update ${up.id}: ${upRes.statusText}`);
            }
          } catch (e) {
            console.error(`Error updating ${up.id}:`, e);
          }
        }));
        console.log(`  Processed ${Math.min(i + CONCURRENCY_LIMIT, updates.length)} / ${updates.length}...`);
      }
      console.log("✓ Supabase time entries repair complete!");
    } else {
      console.log("No entries matched to repair.");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
