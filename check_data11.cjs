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
  const pid = 'e3b4eec9-7b20-5d09-9a2c-82717a801070';
  
  // Total actual hours in database for May for this person
  const { data: raw } = await supabase.from('time_entries')
    .select('hours')
    .eq('person_id', pid)
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-31');
    
  const actualHours = raw.reduce((a, b) => a + Number(b.hours), 0);
  console.log("Charlie Hurrell Actual Hours for May:", actualHours);
}
run();
