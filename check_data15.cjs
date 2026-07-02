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
  const pid = '4331b42d-02b6-5a46-ac83-ac0a6e837483';
  const { data: raw } = await supabase.from('time_entries')
    .select('*')
    .eq('person_id', pid)
    .eq('date', '2026-05-01');
    
  console.log(`Entries for May 1st:`);
  console.log(raw.map(r => ({ hours: r.hours, notes: r.notes })));
  
  // Let's also check if there are other duplicates by checking how many records exist grouped by notes!
  const { data: allRaw } = await supabase.from('time_entries')
    .select('*')
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-05')
    .limit(5000);
    
  const notesCount = {};
  for (const r of allRaw) {
    if (!r.notes) continue;
    const key = `${r.person_id}_${r.date}_${r.hours}_${r.notes}`;
    if (!notesCount[key]) notesCount[key] = 0;
    notesCount[key]++;
  }
  
  let dupesWithNotes = 0;
  for (const [key, count] of Object.entries(notesCount)) {
    if (count > 1) {
       dupesWithNotes += (count - 1);
       console.log(`Duplicate found: ${key} (count: ${count})`);
    }
  }
  console.log(`Found ${dupesWithNotes} duplicates WITH exactly the same notes.`);
}
run();
