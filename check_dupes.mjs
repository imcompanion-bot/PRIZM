import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    '7a4da826-31ed-5698-8d0a-7ff429cd0990',
    '7e5e974a-4aa5-5100-b171-340bd71ac6d7',
    'a4dc9e97-1d8f-56b2-ac32-4b716b38cd64'
  ];
  const { data: entries } = await supabase.from('time_entries').select('person_id, date').in('person_id', ids).gte('date', '2026-04-01').lte('date', '2026-09-30');
  
  const byPerson = {};
  for (const e of entries || []) {
    if (!byPerson[e.person_id]) byPerson[e.person_id] = { min: e.date, max: e.date };
    if (e.date < byPerson[e.person_id].min) byPerson[e.person_id].min = e.date;
    if (e.date > byPerson[e.person_id].max) byPerson[e.person_id].max = e.date;
  }
  console.table(byPerson);
}
run();
