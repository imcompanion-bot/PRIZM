import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase
    .from('talent_efficiencies')
    .select('*')
    .ilike('opportunity_name', "%Hellmann's Sweet Sandwich Time - Summer 2026%");
  
  console.log("Database entries for Hellmann's Sweet Sandwich Time - Summer 2026:");
  data.forEach(d => console.log(d.month_date, d.amount, d.office, d.efficiency_type));
  
  const { data: proj } = await supabase
    .from('projects')
    .select('title, probability, stage, extra_data')
    .ilike('title', "%Hellmann's Sweet Sandwich Time - Summer 2026%");
    
  console.log("\nProject data:");
  console.log(proj);
}
run();
