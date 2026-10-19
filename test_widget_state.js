import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function getFYForDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  if (m >= 5) {
    return `fy${y.toString().slice(-2)}_${(y + 1).toString().slice(-2)}`;
  } else {
    return `fy${(y - 1).toString().slice(-2)}_${y.toString().slice(-2)}`;
  }
}

async function run() {
  const { data: projects } = await supabase.from('projects').select('*');
  const projectOfficeMap = new Map();
  projects.forEach(p => {
    if (p.title) {
       const client = p.ultimate_parent || p.sf_account || "Unknown Client";
       const cleanName = p.title.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
       projectOfficeMap.set(cleanName, { office: p.office, client });
    }
  });
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('*');
  let clientData = {};
  
  // I will just mock getFyRate
  const getFyRate = (fyKey) => 1.27;

  const activeFy = "fy25_26";
  const priorFy = "fy24_25";
  const effectiveCurrency = "GBP";

  projects.forEach(p => {
      const client = p.ultimate_parent || p.sf_account || "Unknown Client";
      if (!clientData[client]) clientData[client] = { gpActive: 0, gpPrior: 0, teActive: 0, tePrior: 0 };
      const o = p.office?.toUpperCase() || "";
      let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
      if (!matchesOffice) return;

      const ext = p.extra_data || {};
      const processGp = (fyKey, rate) => {
        const val = Number(ext[`gp_${fyKey}`]) || 0;
        let converted = val;
        if (effectiveCurrency === "USD" && o !== "US" && o !== "UNITED STATES") converted = val * rate;
        else if (effectiveCurrency === "GBP" && (o === "US" || o === "UNITED STATES")) converted = val / rate;
        return converted;
      };

      clientData[client].gpActive += processGp(activeFy, 1.27);
      clientData[client].gpPrior += processGp(priorFy, 1.27);
  });

  tes.forEach(eff => {
    const oppName = eff.opportunity_name || "Unknown Opportunity";
    const cleanName = oppName.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
    
    const mapInfo = projectOfficeMap.get(cleanName);
    let effOffice = eff.office;
    let client = "Unknown Client";
    
    if (mapInfo) {
      if (!effOffice || effOffice === "Unknown") effOffice = mapInfo.office;
      client = mapInfo.client;
    }
    
    if (!clientData[client]) clientData[client] = { gpActive: 0, gpPrior: 0, teActive: 0, tePrior: 0 };
    
    const o = effOffice?.toUpperCase() || "";
    let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
    if (!matchesOffice) return;

    const fy = getFYForDate(eff.month_date);
    if (!fy) return;

    let displayAmount = Number(eff.amount) || 0;
    const monthRate = 1.27; // mock

    if (effectiveCurrency === "USD" && o !== "US" && o !== "UNITED STATES") displayAmount *= monthRate;
    else if (effectiveCurrency === "GBP" && (o === "US" || o === "UNITED STATES")) displayAmount /= monthRate;

    if (fy === activeFy) clientData[client].teActive += displayAmount;
    if (fy === priorFy) clientData[client].tePrior += displayAmount;
  });
  
  const compiled = Object.entries(clientData).map(([client, data]) => {
      const activeVal = data.teActive;
      const priorVal = data.tePrior;
      return { client, activeVal, priorVal };
  }).filter(x => x.activeVal > 0);
  
  compiled.sort((a,b) => b.activeVal - a.activeVal);
  console.log("Widget Table for UK TE 25_26:");
  compiled.forEach(c => console.log(`${c.client}: ${c.activeVal}`));
}
run();
