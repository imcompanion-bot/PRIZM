import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    'a4dc9e97-1d8f-56b2-ac32-4b716b38cd64',
    '9cb6bde5-baa4-55a2-8971-92c4d83aa642',
    '7a4da826-31ed-5698-8d0a-7ff429cd0990',
    '7e5e974a-4aa5-5100-b171-340bd71ac6d7'
  ];
  const { data: entries } = await supabase.from('time_entries').select('person_id, date, hours').in('person_id', ids).gte('date', '2026-04-01').lte('date', '2026-09-30');
  
  let totalHours = 0;
  for (const e of entries || []) {
    totalHours += Number(e.hours);
  }
  console.log("Total hours from time_entries in 6 months:", totalHours);
}
run();
