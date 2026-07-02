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
  const { data: people } = await supabase.from('people').select('id, name, team').eq('name', 'Christina Drollas');
  
  for (const p of people) {
    let tFrom = 0;
    let total = 0;
    while(true) {
      const { data: raw } = await supabase.from('time_entries')
        .select('hours')
        .eq('person_id', p.id)
        .gte('date', '2026-05-01')
        .lte('date', '2026-05-31')
        .range(tFrom, tFrom + 999);
      if(!raw || raw.length === 0) break;
      total += raw.reduce((a,b)=>a+Number(b.hours),0);
      if(raw.length < 1000) break;
      tFrom += 1000;
    }
    console.log(`Christina (${p.id} - ${p.team}): ${total} hours`);
  }
}
run();
