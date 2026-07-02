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
  let rawEntries = [];
  let tFrom = 0;
  while (true) {
     const { data } = await supabase.rpc('get_utilisation_summary', {
        _start_date: '2026-05-01',
        _end_date: '2026-05-31'
     }).range(tFrom, tFrom + 999);
     if (!data || data.length === 0) break;
     rawEntries = rawEntries.concat(data);
     if (data.length < 1000) break;
     tFrom += 1000;
  }
  
  const hoursByPerson = {};
  for (const e of rawEntries) {
    if (!hoursByPerson[e.person_id]) hoursByPerson[e.person_id] = 0;
    hoursByPerson[e.person_id] += Number(e.total_hours);
  }
  
  const { data: people } = await supabase.from('people').select('id, name');
  const nameMap = {};
  for (const p of people) nameMap[p.id] = p.name;
  
  const sorted = Object.entries(hoursByPerson)
    .map(([id, hours]) => ({ name: nameMap[id] || id, hours }))
    .sort((a, b) => b.hours - a.hours);
    
  console.log("Top 20 highest logged hours for May:");
  for (let i = 0; i < 20; i++) {
     console.log(`${i+1}. ${sorted[i].name}: ${sorted[i].hours}`);
  }
}
run();
