import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projects } = await supabase.from('projects').select('*');
  let gp = 0;
  projects.forEach(p => {
      const client = p.ultimate_parent || p.sf_account || "Unknown Client";
      const o = p.office?.toUpperCase() || "";
      if (client === "Unilever" && (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION")) {
          gp += Number(p.extra_data?.gp_fy25_26) || 0;
      }
  });
  console.log("Unilever UK GP FY25_26:", gp);
}
run();
