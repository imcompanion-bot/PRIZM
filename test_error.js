import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const fromDate = '2026-09-01';
  const toDate = '2026-09-30';
  const chunk = [
    'ec5f2440-83c7-590c-a59a-99f5a832b782',
    'eb6dd771-e965-595f-aefd-9db290fd16ce'
  ];
  
  const baseQuery = () => {
    let q = supabase.from('time_entries').delete();
    if (fromDate && toDate) return q.gte('date', fromDate).lte('date', toDate);
    if (fromDate) return q.gte('date', fromDate);
    return q;
  };
  
  const { error } = await baseQuery().in('person_id', chunk);
  console.log("Error from baseQuery():", error);
}
run();
