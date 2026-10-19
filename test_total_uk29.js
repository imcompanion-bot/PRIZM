const oppNames = [
    "Unilever - Hellmann's Sandwich & BBQ 2025",
    "Unilever - Hellmann's Ranch Launch [Execution]",
    "Dove US Pilot - Dauphine & Diptique Awareness 2025",
    "Unilever - Marmite Pride 2025",
    "Rexona: Football Partnerships",
    "Unilever Food Global Toolkit",
    "Dove Jarvis Pulse [Creative Development only]",
    "Unilever - Hellmann's Big Simon Content",
    "Hellmann's Production Shoot (Nov. 2025)",
    "Hello Fresh - Stacey Production Shoot",
    "Dove UK - Hair Execution",
    "Dove UK - Skincare",
    "Hellmann's Sweet Sandwich Time - Summer 2026"
];

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').in('opportunity_name', oppNames);
  
  let sum = 0;
  tes?.forEach(t => {
      if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
          sum += Number(t.amount);
      }
  });
  console.log("Expected sum:", sum);
}
run();
