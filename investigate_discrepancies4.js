import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('*').ilike('opportunity_name', '%Skincare%');
  console.log("Skincare TEs:");
  tes.forEach(t => console.log(t.month_date, t.office, t.opportunity_name, t.amount));
}
run();
