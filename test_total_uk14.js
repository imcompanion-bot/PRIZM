import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('name, ultimate_parent').eq('ultimate_parent', 'Unilever UK');
  const projNames = projs.map(p => p.name);
  
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name');
  
  if (error) console.error(error);
  
  let sum = 0;
  tes?.forEach(t => {
      // Find matching project
      const p = projs.find(p => t.opportunity_name.includes(p.name));
      if (p) {
          if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
              sum += Number(t.amount);
          }
      }
  });
  console.log("UK Unilever 25/26 TEs sum:", sum);
}
run();
