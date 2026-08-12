const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);
async function run() {
  const { data, error } = await supabase.rpc("get_utilisation_summary", { _start_date: "2025-01-01", _end_date: "2025-01-31" }).limit(5);
  console.log(error || data);
}
run();
