const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function run() {
  const allData = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase.from('people').select('id').range(from, from + pageSize - 1);
    if (!data) break;
    allData.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const uniqueIds = new Set(allData.map(d => d.id));
  console.log("Total fetched:", allData.length);
  console.log("Unique fetched:", uniqueIds.size);
}
run();
