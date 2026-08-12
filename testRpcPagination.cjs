const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  let allData = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase.rpc("get_project_person_hours").range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allData = allData.concat(data || []);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  
  const uniqueRows = new Set(allData.map(r => r.project_id + "_" + r.person_id));
  console.log("Total rows fetched via paginated RPC:", allData.length);
  console.log("Unique rows fetched via paginated RPC:", uniqueRows.size);
}
run();
