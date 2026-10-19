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
  
  const top10 = compiled.slice(0, 10);
  const others = compiled.slice(10);
  const othersPrior = others.reduce((s,x) => s + x.prior, 0);
  const othersGp = others.reduce((s,x) => s + x.gp, 0);
  
  console.log("Top 10:");
  top10.forEach(c => console.log(`${c.client}: GP=${c.gp}, Prior=${c.prior}`));
  console.log("Others GP:", othersGp);
  console.log("Others Prior:", othersPrior);
  
  // Total Prior:
  const totalPrior = compiled.reduce((s,x) => s + x.prior, 0);
  console.log("Total Prior:", totalPrior);
}
run();
