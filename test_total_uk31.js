const monthRate = 1.28;
const amount = 24058.14; // in GBP
// In the widget, for effectiveCurrency="GBP":
// if (o === "US") displayAmount /= monthRate;
// But UK amounts (o === "UK") are not converted. They stay GBP.
// If your total was 28k for Unilever, and I just got 24k, there's still a 4k gap.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office');
  const unileverProjs = projs.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name');
  
  let sum = 0;
  tes?.forEach(t => {
      const p = unileverProjs.find(p => t.opportunity_name === p.title || t.opportunity_name.startsWith(p.title + " ") || p.title.startsWith(t.opportunity_name));
      if (p) {
          if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
              let displayAmount = Number(t.amount);
              // For GBP view, US projects get converted from USD to GBP
              if (p.office === 'US') {
                  displayAmount /= 1.27; // rough approximation
              }
              sum += displayAmount;
          }
      }
  });
  console.log("Global Unilever (Converted to GBP) 25/26 TEs sum:", sum);
}
run();
