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
  
  // Group by person_id + project_id + date + hours
  const groups = {};
  for (const e of allEntries) {
    const key = `${e.person_id}_${e.project_id}_${e.date}_${e.hours}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  
  const toDelete = [];
  
  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length > 1) {
      // Find entries with notes and without notes
      const withNotes = entries.filter(e => e.notes && e.notes.trim() !== '');
      const withoutNotes = entries.filter(e => !e.notes || e.notes.trim() === '');
      
      // If we have both, we can safely delete the ones without notes (up to the number of ones with notes)
      if (withNotes.length > 0 && withoutNotes.length > 0) {
         // Delete as many empty-note entries as there are with-note entries, or all of them if less
         const deleteCount = Math.min(withNotes.length, withoutNotes.length);
         for (let i = 0; i < deleteCount; i++) {
            toDelete.push(withoutNotes[i].id);
         }
      }
    }
  }
  
  console.log(`Found ${toDelete.length} exact duplicates (empty notes matching entries with notes).`);
  
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
