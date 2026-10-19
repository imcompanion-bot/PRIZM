import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office');
  const unileverProjs = projs.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name');
  
  let sum = 0;
  tes?.forEach(t => {
      const p = unileverProjs.find(p => t.opportunity_name === p.title || t.opportunity_name.startsWith(p.title + " ") || p.title.startsWith(t.opportunity_name));
      if (p && (p.office === 'United Kingdom' || p.office === 'UK')) {
          if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
              let displayAmount = Number(t.amount);
              sum += displayAmount;
          }
      }
  });
  console.log("UK Unilever (office = United Kingdom) 25/26 TEs sum:", sum);
}
run();
