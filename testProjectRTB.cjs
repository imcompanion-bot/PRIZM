const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const { data, error } = await supabase.from('projects').select('id, title, budget_cost, start_date, end_date').eq('id', 'f62b577f-3618-506e-8ab4-185efe5e631a').single();
  console.log("RTB Project:", data);
  const { data: costs } = await supabase.rpc("get_project_costs").eq('project_id', 'f62b577f-3618-506e-8ab4-185efe5e631a');
  console.log("RTB Costs:", costs);
}
run();
