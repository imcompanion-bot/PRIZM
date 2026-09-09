import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

let envStr = '';
if (fs.existsSync('.env')) envStr += fs.readFileSync('.env', 'utf-8') + '\n';

const lines = envStr.split('\n');
const env: Record<string, string> = {};
for (const line of lines) {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
  }
}

const supabase = createClient(env['VITE_SUPABASE_URL']!, env['VITE_SUPABASE_PUBLISHABLE_KEY']!);

async function run() {
  const allData: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, ultimate_parent, sf_account, office, extra_data')
      .not('extra_data', 'is', null)
      .order('id')
      .range(from, from + pageSize - 1);
    
    if (error) return;
    allData.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  
  const kingProjects = allData.filter(p => {
    const client = p.ultimate_parent || p.sf_account || "Unknown Client";
    if (client !== "King") return false;
    
    const o = p.office?.toUpperCase() || "";
    return o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION";
  });
  
  let q4_24_25 = 0;
  let q1_25_26 = 0;
  let q2_25_26 = 0;
  let q3_25_26 = 0;
  let q4_25_26 = 0;
  let q1_26_27 = 0;
  
  for (const p of kingProjects) {
    q4_24_25 += p.extra_data?.gp_q4_24_25 || 0;
    q1_25_26 += p.extra_data?.gp_q1_25_26 || 0;
    q2_25_26 += p.extra_data?.gp_q2_25_26 || 0;
    q3_25_26 += p.extra_data?.gp_q3_25_26 || 0;
    q4_25_26 += p.extra_data?.gp_q4_25_26 || 0;
    q1_26_27 += p.extra_data?.gp_q1_26_27 || 0;
  }
  
  console.log(`Q4 24/25: ${q4_24_25}`);
  console.log(`Q1 25/26: ${q1_25_26}`);
  console.log(`Q2 25/26: ${q2_25_26}`);
  console.log(`Q3 25/26: ${q3_25_26}`);
  console.log(`Q4 25/26: ${q4_25_26}`);
  console.log(`Q1 26/27: ${q1_26_27}`);
}

run();
