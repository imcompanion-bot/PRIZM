const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const res1 = await supabase.rpc('get_utilisation_summary', { _start_date: '2026-01-01', _end_date: '2026-07-31' });
  console.log('get_utilisation_summary without range:', res1.error || (res1.data.length + ' rows'));
  
  const res2 = await supabase.rpc('get_project_costs_by_role');
  console.log('get_project_costs_by_role without range:', res2.error || (res2.data.length + ' rows'));
}
run();
