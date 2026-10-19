import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: people } = await supabase.from('people').select('id, employment_start_date, employment_end_date');
  const { data: entries } = await supabase.from('time_entries').select('id, person_id, date');
  
  const peopleMap = new Map();
  for (const p of people) {
    peopleMap.set(p.id, p);
  }
  
  let outsideCount = 0;
  for (const e of entries) {
    const p = peopleMap.get(e.person_id);
    if (!p) continue;
    if (p.employment_start_date && e.date < p.employment_start_date) outsideCount++;
    else if (p.employment_end_date && e.date > p.employment_end_date) outsideCount++;
  }
  console.log("Time entries outside employment dates:", outsideCount);
}
run();
