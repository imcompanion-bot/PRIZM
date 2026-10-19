import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const titles = [
    "Unilever - Hellmann's Sandwich & BBQ 2025",
    "Unilever - Hellmann's Ranch Launch [Execution]",
    "Dove US Pilot - Dauphine & Diptique Awareness 2025",
    "Unilever - Marmite Pride 2025",
    "Rexona: Football Partnerships",
    "Unilever Food Global Toolkit",
    "Dove Jarvis Pulse [Creative Development only]",
    "Unilever - Hellmann's Big Simon Content",
    "Hellmann's Production Shoot (Nov. 2025)",
    "Dove UK - Hair Execution",
    "Dove UK - Skincare",
    "Hellmann's Sweet Sandwich Time - Summer 2026"
  ];
  
  const { data: projs } = await supabase.from('projects').select('title, extra_data').in('title', titles);
  
  projs.forEach(p => {
     console.log(p.title);
     console.log('GP FY25/26:', p.extra_data?.gp_fy25_26);
  });
}
run();
