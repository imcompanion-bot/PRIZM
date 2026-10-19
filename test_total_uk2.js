import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name, projects!inner(sf_account)').eq('projects.sf_account', '0014J000021N5dQQAS');
  
  if (error) console.error(error);
  
  let sum = 0;
  tes?.forEach(t => {
      if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
          sum += Number(t.amount);
      }
  });
  console.log("UK Unilever 25/26 TEs sum:", sum);
}
run();
