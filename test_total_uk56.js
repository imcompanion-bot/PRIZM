import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').limit(1);
  console.log(tes);
}
run();
