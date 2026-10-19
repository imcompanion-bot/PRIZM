import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: people } = await supabase.from('people').select('id, name, employment_start_date, employment_end_date').ilike('name', '%Allie%');
  console.table(people);
  
  const ids = people.map(p => p.id);
  const { data: entries } = await supabase.from('time_entries').select('id, person_id, date').in('person_id', ids);
  
  let outsideCount = 0;
  for (const e of entries) {
    const p = people.find(x => x.id === e.person_id);
    if (p.employment_start_date && e.date < p.employment_start_date) outsideCount++;
    else if (p.employment_end_date && e.date > p.employment_end_date) outsideCount++;
  }
  console.log("Allie entries outside employment dates:", outsideCount);
}
run();
