import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', "%Unilever Foods Global RFP%");
  console.log("RFP:");
  tes.forEach(t => console.log(t.month_date, t.amount));
  
  const { data: tes2 } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', "%Hellmann's Workshop%");
  console.log("\nWorkshop:");
  tes2.forEach(t => console.log(t.month_date, t.amount));
}
run();
