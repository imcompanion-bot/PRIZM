const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const { data: data1 } = await supabase.rpc("get_project_person_hours").range(0, 9);
  const { data: data2 } = await supabase.rpc("get_project_person_hours").range(10, 19);
  
  // Try to find an overlap, meaning ordering is unstable
  const ids1 = data1.map(d => d.project_id + d.person_id);
  const ids2 = data2.map(d => d.project_id + d.person_id);
  
  console.log("Overlap count:", ids1.filter(id => ids2.includes(id)).length);
}
run();
