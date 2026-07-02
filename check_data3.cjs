const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const i = line.indexOf('=');
  if (i > 0) {
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc("get_utilisation_summary", {
    _start_date: "2026-05-01",
    _end_date: "2026-05-31",
  }).range(0, 999);
  
  if (error) console.error(error);
  
  console.log("Total rows in page 1:", data ? data.length : 0);
  
  if (data && data.length > 0) {
    const sum = data.reduce((acc, row) => acc + Number(row.total_hours), 0);
    console.log("Total hours page 1:", sum);
  }

  const { data: data2, error: error2 } = await supabase.rpc("get_utilisation_summary", {
    _start_date: "2026-05-01",
    _end_date: "2026-05-31",
  }).range(1000, 1999);
  
  console.log("Total rows in page 2:", data2 ? data2.length : 0);
  if (data2 && data2.length > 0) {
    const sum = data2.reduce((acc, row) => acc + Number(row.total_hours), 0);
    console.log("Total hours page 2:", sum);
    
    // Check intersection
    const p1Ids = new Set(data.map(d => d.person_id + '-' + d.project_id));
    let dupes = 0;
    for (const d of data2) {
      if (p1Ids.has(d.person_id + '-' + d.project_id)) dupes++;
    }
    console.log("Duplicate rows in page 2:", dupes);
  }
}
run();
