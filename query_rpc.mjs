import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.rpc('get_utilisation_summary', {
    _start_date: '2026-07-01',
    _end_date: '2026-09-30'
  });
  console.log("first row:", data[0]);
}
run();
