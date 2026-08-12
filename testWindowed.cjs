const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const { data, error } = await supabase.rpc("get_project_person_hours_windowed", {
    _start_date: "2026-01-30",
    _end_date: "2026-07-30"
  }).eq('project_id', '97ccc513-3a38-5c75-8083-0be6dd6804e6');
  console.log("Windowed:", data);
  if (error) console.error(error);
}
run();
