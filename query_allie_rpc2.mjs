import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    'ec5f2440-83c7-590c-a59a-99f5a832b782',
    'eb6dd771-e965-595f-aefd-9db290fd16ce'
  ];
  
  let allData = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while(true) {
    const { data } = await supabase.rpc('get_utilisation_summary', {
      _start_date: '2026-04-01',
      _end_date: '2026-09-30'
    }).order('person_id').range(from, from + PAGE_SIZE - 1);
    
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  
  let rpcHours = 0;
  for (const s of allData) {
    if (ids.includes(s.person_id)) {
      rpcHours += Number(s.total_hours);
    }
  }
  console.log("Allie total hours from RPC in 6 months:", rpcHours);
}
run();
