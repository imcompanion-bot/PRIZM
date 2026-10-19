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
  
  let usClients = {};
  allData.forEach(p => {
     const client = p.ultimate_parent || p.sf_account || "Unknown";
     const o = p.office?.toUpperCase() || "";
     let isUS = (o === "US" || o === "UNITED STATES");
     if (isUS) {
        if (!usClients[client]) usClients[client] = 0;
        usClients[client] += Number(p.extra_data?.gp_fy25_26) || 0;
     }
  });
  
  console.log("US Unilever Full GP:", usClients["Unilever"]);
  console.log("US Its Full GP:", usClients["Its"]);
}
run();
