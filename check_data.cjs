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
  const { data: people } = await supabase.from('people').select('id, name, team').ilike('name', '%Elisheba%').limit(1);
  if (!people || people.length === 0) {
    console.log("Person not found");
    return;
  }
  const person = people[0];
  console.log("Checking data for:", person.name);

  const { data: entries } = await supabase.from('time_entries')
    .select('id, date, hours, project_id')
    .eq('person_id', person.id)
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-31');
    
  console.log(`Raw time entries for May: ${entries.length}`);
  const sum = entries.reduce((a, b) => a + Number(b.hours), 0);
  console.log(`Total hours from raw time entries: ${sum}`);
  
  // Also check if any duplicate entries on the same date/project
  const dates = {};
  for (const e of entries) {
    const key = e.date + '_' + e.project_id;
    if (!dates[key]) dates[key] = 0;
    dates[key] += Number(e.hours);
  }
  console.log("Sample of dates/hours:", Object.entries(dates).slice(0, 5));
}
run();
