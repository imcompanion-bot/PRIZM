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
  const { data: people } = await supabase.from('people').select('id, name, team, employment_start_date, employment_end_date, code').in('id', ids);
  
  console.table(people);
}
run();
