import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
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
  const { data: tes, error } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').in('opportunity_name', oppNames);
  
  if (error) console.error(error);
  
  let sum = 0;
  tes?.forEach(t => {
      // 25/26 is May 1 2025 to April 1 2026 inclusive
      if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
          console.log(t.opportunity_name, t.month_date, t.amount);
          sum += Number(t.amount);
      }
  });
  console.log("UK Unilever 25/26 TEs sum:", sum);
}
run();
