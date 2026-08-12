const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const { data: allTimeProjectPersonHours } = await supabase.rpc("get_project_person_hours").eq('project_id', '97ccc513-3a38-5c75-8083-0be6dd6804e6');
  const personIds = allTimeProjectPersonHours.map(r => r.person_id);
  const { data: peopleList } = await supabase.from('people').select('id, name, office, employment_start_date, employment_end_date, overall_start_date, overall_end_date').in('id', personIds);
  console.log(peopleList);
}
run();
