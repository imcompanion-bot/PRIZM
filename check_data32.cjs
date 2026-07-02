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
  const { data: people } = await supabase.from('people').select('id, name');
  const drollas = people.find(p => p.name.includes('Drollas'));
  const pid = drollas ? drollas.id : null;
  
  if (!pid) { console.log("Not found"); return; }
  
  const { data: raw } = await supabase.from('time_entries')
    .select('id, hours, notes, date, project_name')
    .eq('person_id', pid)
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-31');
    
  console.log(`Christina's Total Entries for May: ${raw.length}`);
  
  // Group by date
  const byDate = {};
  for (const r of raw) {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  }
  
  const sortedDates = Object.keys(byDate).sort();
  for (const date of sortedDates.slice(0, 3)) {
     console.log(`\nDate: ${date}`);
     const entries = byDate[date];
     console.log(entries);
  }
}
run();
