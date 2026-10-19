import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    '7e5e974a-4aa5-5100-b171-340bd71ac6d7',
    'a4dc9e97-1d8f-56b2-ac32-4b716b38cd64'
  ];
  const { data: entries } = await supabase.from('time_entries').select('person_id, date, hours').in('person_id', ids).gte('date', '2026-08-01').lte('date', '2026-08-05');
  
  console.table(entries);
}
run();
