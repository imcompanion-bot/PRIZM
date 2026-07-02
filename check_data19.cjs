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
  let totalRows = 0;
  let totalHours = 0;
  let from = 0;
  
  while (true) {
    const { data: raw } = await supabase.from('time_entries')
      .select('hours')
      .eq('person_id', pid)
      .gte('date', '2026-05-01')
      .lte('date', '2026-05-31')
      .range(from, from + 999);
      
    if (!raw || raw.length === 0) break;
    totalRows += raw.length;
    totalHours += raw.reduce((a, b) => a + Number(b.hours), 0);
    if (raw.length < 1000) break;
    from += 1000;
  }
  
  console.log("Charlie Hurrell Actual Hours for May after full cleanup:", totalHours);
}
run();
