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
  
  // Group by person_id + date + hours
  const groups = {};
  for (const e of allEntries) {
    const key = `${e.person_id}_${e.date}_${e.hours}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  
  const toDelete = [];
  
  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length > 1) {
      const withProject = entries.filter(e => e.project_id);
      const withoutProject = entries.filter(e => !e.project_id);
      
      if (withProject.length > 0 && withoutProject.length > 0) {
         // Sort both to try to match them up, or just delete the withoutProject ones up to the count of withProject ones
         const deleteCount = Math.min(withProject.length, withoutProject.length);
         for (let i = 0; i < deleteCount; i++) {
            toDelete.push(withoutProject[i].id);
         }
      }
    }
  }
  
  console.log(`Found ${toDelete.length} duplicates where one has a project_id and the other does not (but same hours, date, and person).`);
  
  if (toDelete.length > 0) {
     console.log("Deleting these duplicates...");
     for (let i = 0; i < toDelete.length; i += 500) {
       const batch = toDelete.slice(i, i + 500);
       await supabase.from('time_entries').delete().in('id', batch);
       console.log(`Deleted batch ${i/500 + 1}`);
     }
     console.log("Done!");
  }
}

run();
