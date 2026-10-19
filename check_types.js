import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('*').in('opportunity_name', [
      'Dove UK - Skincare',
      'Dove UK - Hair Execution',
      'Dove US Pilot - Dauphine & Diptique Awareness 2025'
  ]);
  
  tes.forEach(t => console.log(t.opportunity_name, t.efficiency_type, t.amount, t.month_date));
}
run();
