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
  
  let ukClients = {};
  allData.forEach(p => {
     const client = p.ultimate_parent || p.sf_account || "Unknown";
     const o = p.office?.toUpperCase() || "";
     let isUK = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
     if (isUK) {
        if (!ukClients[client]) ukClients[client] = { gp: 0, prior: 0 };
        ukClients[client].gp += Number(p.extra_data?.gp_fy25_26) || 0;
        ukClients[client].prior += Number(p.extra_data?.gp_fy24_25) || 0;
     }
  });
  
  const compiled = Object.entries(ukClients).map(([c, data]) => ({ client: c, gp: data.gp, prior: data.prior })).filter(x => x.gp > 0 || x.prior > 0);
  compiled.sort((a,b) => b.gp - a.gp);
  
  const others = compiled.slice(10);
  
  let othersPriorWithGp = 0;
  let othersPriorWithoutGp = 0;
  let othersPriorMaterial = 0;
  
  others.forEach(x => {
    if (x.gp > 0) othersPriorWithGp += x.prior;
    else othersPriorWithoutGp += x.prior;
    
    // In legacyPharaoh.js, MATERIALITY is 20000.
    if (x.gp > 20000 || x.prior > 20000) othersPriorMaterial += x.prior;
  });
  
  console.log("Others Prior (all):", others.reduce((s,x) => s + x.prior, 0));
  console.log("Others Prior (only if GP > 0):", othersPriorWithGp);
  console.log("Others Prior (only if GP === 0):", othersPriorWithoutGp);
  console.log("Others Prior (material > 20k):", othersPriorMaterial);
  
  // Let's also check if legacyPharaoh filters out clients that have < 20k change?
  // "All numbers are de-risked Gross Profit. Only showing opportunities with greater than c. 20k de-risked GP change for this FY in total."
  let filteredPharaohPrior = 0;
  let filteredPharaohActive = 0;
  
  compiled.forEach(x => {
     if (Math.abs(x.gp - x.prior) >= 20000) {
        // let's see how this affects top 10 vs others
     }
  });
  
  let othersPriorPharaohFilter = 0;
  others.forEach(x => {
     if (Math.abs(x.gp - x.prior) >= 20000) {
        othersPriorPharaohFilter += x.prior;
     }
  });
  console.log("Others Prior (Pharaoh filter abs(diff) > 20k):", othersPriorPharaohFilter);
}
run();
