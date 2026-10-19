import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('*').ilike('opportunity_name', '%Hellmann%');
  console.log("Hellmanns TEs:");
  tes.forEach(t => console.log(t.month_date, t.office, t.opportunity_name, t.amount));
  
  const { data: skincare } = await supabase.from('talent_efficiencies').select('*').ilike('opportunity_name', '%Dove UK - Skincare%');
  console.log("\nDove UK Skincare TEs:");
  skincare.forEach(t => console.log(t.month_date, t.office, t.opportunity_name, t.amount));

  const { data: proj1 } = await supabase.from('projects').select('office, ultimate_parent, sf_account, title').ilike('title', '%Hellmann%Production Shoot%');
  console.log("\nHellmanns Production Shoot Project:");
  console.log(proj1);
}
run();
