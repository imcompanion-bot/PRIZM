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
  const { data: entries } = await supabase.from('time_entries')
    .select('person_id, date, hours, project_id')
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-31');
    
  console.log(`Raw time entries for May: ${entries.length}`);
  
  const byPerson = {};
  for (const e of entries) {
    if (!byPerson[e.person_id]) byPerson[e.person_id] = 0;
    byPerson[e.person_id] += Number(e.hours);
  }
  
  const topIds = Object.entries(byPerson).sort((a,b) => b[1] - a[1]).slice(0, 5);
  console.log("Top logged hours by person_id:");
  for (const [id, hours] of topIds) {
    const { data: p } = await supabase.from('people').select('name').eq('id', id).single();
    console.log(`${p ? p.name : id}: ${hours}`);
  }
}
run();
