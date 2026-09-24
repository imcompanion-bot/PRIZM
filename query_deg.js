import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data } = await supabase
    .from('talent_efficiencies')
    .select('efficiency_type,amount,month_date,opportunity_name')
    .ilike('opportunity_name', '%Degree%');
  console.log(data);
}
run();
