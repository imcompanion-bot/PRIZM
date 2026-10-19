import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.from('fx_rates').select('*').limit(5);
  console.log("fx_rates:", data, error);
  const { data: d2, error: e2 } = await supabase.from('exchange_rates').select('*').limit(5);
  console.log("exchange_rates:", d2, e2);
}
run();
