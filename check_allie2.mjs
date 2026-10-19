import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    'ec5f2440-83c7-590c-a59a-99f5a832b782',
    'eb6dd771-e965-595f-aefd-9db290fd16ce'
  ];
  const { data: entries } = await supabase.from('time_entries').select('person_id, date, hours').in('person_id', ids).gte('date', '2026-04-01').lte('date', '2026-09-30');
  
  let totalHours = 0;
  for (const e of entries || []) {
    totalHours += Number(e.hours);
  }
  console.log("Allie total hours in 6 months:", totalHours);
}
run();
