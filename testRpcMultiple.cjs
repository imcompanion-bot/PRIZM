const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  for (let i = 0; i < 5; i++) {
    let allData = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data } = await supabase.rpc("get_project_person_hours").range(from, from + PAGE_SIZE - 1);
      allData = allData.concat(data || []);
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    const uniqueRows = new Set(allData.map(r => r.project_id + "_" + r.person_id));
    console.log(`Run ${i+1}: fetched ${allData.length}, unique ${uniqueRows.size}`);
  }
}
run();
