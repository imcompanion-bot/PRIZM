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
  console.log("Fetching all time entries to delete...");
  
  let totalDeleted = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data: raw, error } = await supabase.from('time_entries')
      .select('id')
      .limit(3000);
      
    if (error) {
       console.error("Error fetching entries:", error);
       break;
    }
    
    if (!raw || raw.length === 0) {
       console.log("No more entries found. Database is completely wiped.");
       break;
    }
    
    const ids = raw.map(r => r.id);
    const BATCH_SIZE = 100;
    const promises = [];
    
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
       const batch = ids.slice(i, i + BATCH_SIZE);
       promises.push(
         supabase.from('time_entries').delete().in('id', batch)
       );
    }
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
       console.error("Errors occurred during deletion:", errors[0].error);
       break;
    }
    
    totalDeleted += ids.length;
    console.log(`Successfully deleted ${ids.length} entries. Total deleted so far: ${totalDeleted}`);
  }
  
  console.log(`\nWipe Complete! Deleted a total of ${totalDeleted} time entries.`);
}

run();
