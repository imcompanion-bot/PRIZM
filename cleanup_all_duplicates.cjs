const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const i = line.indexOf('=');
  if (i > 0) {
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log("Fetching all time entries for May...");
  let allEntries = [];
  let from = 0;
  while (true) {
    const { data: raw, error } = await supabase.from('time_entries')
      .select('id, person_id, project_id, date, hours, notes')
      .gte('date', '2026-05-01')
      .lte('date', '2026-05-31')
      .range(from, from + 999);
      
    if (error) throw error;
    if (!raw || raw.length === 0) break;
    allEntries = allEntries.concat(raw);
    if (raw.length < 1000) break;
    from += 1000;
  }
  
  console.log(`Fetched ${allEntries.length} entries.`);
  
  // Group by exact match
  const groups = {};
  for (const e of allEntries) {
    const noteKey = (e.notes || '').trim().toLowerCase();
    const key = `${e.person_id}_${e.project_id}_${e.date}_${e.hours}_${noteKey}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  
  const toDelete = [];
  let totalSaved = 0;
  
  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length > 1) {
      // Keep the first one, delete the rest
      totalSaved += 1;
      for (let i = 1; i < entries.length; i++) {
        toDelete.push(entries[i].id);
      }
    }
  }
  
  console.log(`Found ${toDelete.length} exact duplicates (same person, project, date, hours, and notes).`);
  
  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    return;
  }
  
  console.log("Deleting duplicates in batches of 500...");
  for (let i = 0; i < toDelete.length; i += 500) {
    const batch = toDelete.slice(i, i + 500);
    const { error } = await supabase.from('time_entries').delete().in('id', batch);
    if (error) {
      console.error("Error deleting batch:", error);
    } else {
      console.log(`Deleted batch ${i/500 + 1} (${batch.length} rows)`);
    }
  }
  console.log("Cleanup complete!");
}

run();
