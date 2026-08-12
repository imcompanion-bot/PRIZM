const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const { data, error } = await supabase.from('projects').select('id, title, start_date, end_date').eq('id', '97ccc513-3a38-5c75-8083-0be6dd6804e6').single();
  console.log("Project:", data);
}
run();
