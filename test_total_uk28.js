import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', '%Unilever%');
  
  let sum = 0;
  tes?.forEach(t => {
      if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
          sum += Number(t.amount);
      }
  });
  console.log("Anything with Unilever in the name 25/26 TEs sum:", sum);
}
run();
