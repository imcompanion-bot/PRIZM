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
  const { data: people } = await supabase.from('people').select('id, name').eq('name', 'Christina Drollas').single();
  const pid = people.id;
  
  const { data: raw } = await supabase.from('time_entries')
    .select('id, hours, notes, date, project_id, project_name')
    .eq('person_id', pid)
    .eq('date', '2026-05-01');
    
  console.log(`Christina's Entries for May 1st (Total: ${raw.reduce((a,b)=>a+Number(b.hours), 0)} hrs):`);
  console.log(raw);
}
run();
