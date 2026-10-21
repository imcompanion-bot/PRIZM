import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('opportunity_name').ilike('opportunity_name', "%Sainsbury's%Underspend%");
  console.log("TEs:", tes);
  
  const { data: projs } = await supabase.from('projects').select('title, sf_account, parent_account').ilike('title', "%Sainsbury's%Underspend%");
  console.log("Projs:", projs);
  
  const { data: projs2 } = await supabase.from('projects').select('title, sf_account, parent_account').ilike('title', "%Sainsbury's - Argos A-List%");
  console.log("Projs A-List:", projs2);
}
run();
