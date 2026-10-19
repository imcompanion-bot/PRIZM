import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', "%Skincare%");
  console.log("Skincare TEs (Should be de-risked ~2604):");
  data.forEach(t => console.log(t.month_date, t.amount));
  
  const { data: proj } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', "%Production Shoot%");
  console.log("\nProduction Shoot TEs (Should now exist):");
  proj.forEach(t => console.log(t.month_date, t.opportunity_name, t.amount));
}
run();
