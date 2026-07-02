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
  const { data: people } = await supabase.from('people').select('id, name, office').eq('office', 'London');
  console.log(`Found ${people.length} people in London.`);
  
  const ids = people.map(p => p.id);
  
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
  
  let totalLondonHours = 0;
  for (const id of ids) {
     totalLondonHours += (hoursByPerson[id] || 0);
  }
  
  console.log(`Total Actual Hours for London people in May: ${totalLondonHours}`);
}
run();
