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
  const { data: rawEntries } = await supabase.from('time_entries')
    .select('person_id, hours')
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-31')
    .limit(50000); // just to get all
    
  let nullPerson = 0;
  let hasPerson = 0;
  
  const byPerson = {};
  for (const e of rawEntries) {
    if (!e.person_id) {
       nullPerson += Number(e.hours);
    } else {
       hasPerson += Number(e.hours);
       byPerson[e.person_id] = (byPerson[e.person_id] || 0) + Number(e.hours);
    }
  }
  
  console.log(`Hours with null person_id: ${nullPerson}`);
  console.log(`Hours with valid person_id: ${hasPerson}`);
  
  const { data: people } = await supabase.from('people').select('id');
  const validIds = new Set(people.map(p => p.id));
  
  let unlinked = 0;
  let linked = 0;
  for (const [id, hrs] of Object.entries(byPerson)) {
    if (validIds.has(id)) linked += hrs;
    else unlinked += hrs;
  }
  
  console.log(`Hours linked to existing people: ${linked}`);
  console.log(`Hours linked to deleted/missing people: ${unlinked}`);
}
run();
