import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('title, last_fee_calc_url').not('last_fee_calc_url', 'is', null).limit(5);
  console.log("URLs:", data);
}
run();
