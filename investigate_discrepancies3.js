import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes } = await supabase.from('talent_efficiencies').select('*');
  console.log("TEs near 951:");
  tes.forEach(t => {
      const amt = Number(t.amount);
      if (amt > 900 && amt < 1000) {
          console.log(t.month_date, t.office, t.opportunity_name, t.amount);
      }
  });
}
run();
