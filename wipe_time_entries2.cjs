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
  console.log("Wiping all time entries...");
  const { data, error } = await supabase.from('time_entries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (error) {
     console.error("Error wiping database:", error);
  } else {
     console.log("Database wiped successfully!");
  }
}

run();
