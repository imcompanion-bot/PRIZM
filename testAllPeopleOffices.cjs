const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const { data } = await supabase.rpc("get_project_person_hours_windowed", {
    _start_date: "2026-01-30",
    _end_date: "2026-07-30"
  }).eq('project_id', '97ccc513-3a38-5c75-8083-0be6dd6804e6');
  
  const personIds = data.map(d => d.person_id);
  const { data: people } = await supabase.from('people').select('id, name, office').in('id', personIds);
  console.log(people);
}
run();
