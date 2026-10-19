import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs, error: projsErr } = await supabase.from('projects').select('opportunity_name, sf_account');
  const ukProjs = projs.filter(p => p.sf_account === '0014J000021N5dQQAS');
  
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name');
  
  let sum = 0;
  tes?.forEach(t => {
      // Find matching project by seeing if opportunity_name starts with project name
      const p = ukProjs.find(p => t.opportunity_name === p.opportunity_name || t.opportunity_name.startsWith(p.opportunity_name + " "));
      if (p) {
          if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
              sum += Number(t.amount);
          }
      }
  });
  console.log("UK Unilever 25/26 TEs sum:", sum);
}
run();
