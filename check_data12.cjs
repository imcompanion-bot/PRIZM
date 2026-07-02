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
  const { data: raw } = await supabase.from('time_entries')
    .select('id, person_id, hours, notes, date')
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-05')
    .limit(5000);
    
  let emptyNotes = 0;
  let withNotes = 0;
  for (const r of raw) {
    if (!r.notes || r.notes.trim() === '') emptyNotes++;
    else withNotes++;
  }
  
  console.log(`May 1-5 sample (total ${raw.length}):`);
  console.log(`With notes: ${withNotes}`);
  console.log(`Empty notes: ${emptyNotes}`);
  
  // Find a specific person other than Charlie Hurrell
  const peopleIds = [...new Set(raw.map(r => r.person_id))];
  const otherPid = peopleIds.find(id => id !== 'e3b4eec9-7b20-5d09-9a2c-82717a801070');
  
  if (otherPid) {
    const entries = raw.filter(r => r.person_id === otherPid && r.date === '2026-05-01');
    console.log(`\nEntries on May 1st for another person (${otherPid}):`);
    console.log(entries.map(e => ({ hours: e.hours, notes: e.notes })));
  }
}
run();
