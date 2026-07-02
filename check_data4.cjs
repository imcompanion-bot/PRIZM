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
  // Get summary for a specific person
  const { data: summary } = await supabase.rpc("get_utilisation_summary", {
    _start_date: "2026-05-01",
    _end_date: "2026-05-31",
  }).order('total_hours', { ascending: false }).limit(10);
  
  console.log("Top 10 highest hours in a single group (May):");
  console.log(summary);
  
  if (summary && summary.length > 0) {
    const pid = summary[0].person_id;
    console.log("Fetching raw time entries for person:", pid, "and project:", summary[0].project_id);
    
    let allEntries = [];
    let from = 0;
    while (true) {
        const { data: raw } = await supabase.from('time_entries')
          .select('*')
          .eq('person_id', pid)
          .eq('project_id', summary[0].project_id)
          .gte('date', '2026-05-01')
          .lte('date', '2026-05-31')
          .range(from, from + 999);
        if (!raw || raw.length === 0) break;
        allEntries = allEntries.concat(raw);
        if (raw.length < 1000) break;
        from += 1000;
    }
    
    console.log(`Found ${allEntries.length} raw time entries.`);
    // Are there duplicates? (Same date)
    const dates = {};
    let duplicates = 0;
    for (const e of allEntries) {
      if (dates[e.date]) {
         duplicates++;
      } else {
         dates[e.date] = 0;
      }
      dates[e.date] += e.hours;
    }
    console.log(`Duplicate dates: ${duplicates}`);
    console.log("Sample of daily totals:", Object.entries(dates).slice(0, 5));
  }
}
run();
