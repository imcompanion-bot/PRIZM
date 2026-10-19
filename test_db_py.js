import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const allData = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('projects')
      .select('office, ultimate_parent, sf_account, extra_data')
      .not('extra_data', 'is', null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    allData.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  
  let totalPY = 0;
  let pyByClient = {};
  allData.forEach(p => {
     const client = p.ultimate_parent || p.sf_account || "Unknown";
     const o = p.office?.toUpperCase() || "";
     let isUK = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
     if (isUK) {
        const val = Number(p.extra_data?.gp_fy24_25) || 0;
        totalPY += val;
        if (!pyByClient[client]) pyByClient[client] = 0;
        pyByClient[client] += val;
     }
  });
  
  console.log("Total UK PY GP (FY24/25):", totalPY);
}
run();
