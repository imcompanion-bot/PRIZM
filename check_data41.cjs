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
  console.log("Fetching all time entries for May...");
  let allEntries = [];
  let from = 0;
  while (true) {
    const { data: raw, error } = await supabase.from('time_entries')
      .select('id, person_id, date, hours')
      .gte('date', '2026-05-01')
      .lte('date', '2026-05-31')
      .range(from, from + 999);
      
    if (error) throw error;
    if (!raw || raw.length === 0) break;
    allEntries = allEntries.concat(raw);
    if (raw.length < 1000) break;
    from += 1000;
  }
  
  const dailySums = {};
  for (const e of allEntries) {
    const key = `${e.person_id}_${e.date}`;
    if (!dailySums[key]) dailySums[key] = 0;
    dailySums[key] += Number(e.hours);
  }
  
  let countOver15 = 0;
  let countOver10 = 0;
  for (const [key, sum] of Object.entries(dailySums)) {
     if (sum > 15) countOver15++;
     if (sum > 10) countOver10++;
  }
  
  console.log(`Person-Days with >15 hours: ${countOver15}`);
  console.log(`Person-Days with >10 hours: ${countOver10}`);
}
run();
