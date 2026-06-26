import { initializeApp } from 'firebase/app';
import { listBillabilityRules, listBillabilityRuleConditions } from './src/dataconnect-generated/esm/index.esm.js';
import fs from 'fs';
import path from 'path';

const envPath = path.join('/Users/jamesbrazier/Documents/GitHub/PRIZM', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const firebaseConfig = {
  projectId: "pharaoh-54a0e",
  appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
  storageBucket: "pharaoh-54a0e.firebasestorage.app",
  apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
  authDomain: "pharaoh-54a0e.firebaseapp.com",
  messagingSenderId: "909637352706",
};

initializeApp(firebaseConfig);

async function run() {
  try {
    // 1. Fetch from Supabase
    console.log("Fetching rules from Supabase...");
    const sbRulesRes = await fetch(`${SUPABASE_URL}/rest/v1/billability_rules?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const sbRules = await sbRulesRes.json();

    const sbCondsRes = await fetch(`${SUPABASE_URL}/rest/v1/billability_rule_conditions?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const sbConds = await sbCondsRes.json();

    // 2. Fetch from Data Connect
    console.log("Fetching rules from Data Connect...");
    const dcRulesRes = await listBillabilityRules();
    const dcRules = dcRulesRes.data.billabilityRuless || [];

    const dcCondsRes = await listBillabilityRuleConditions();
    const dcConds = dcCondsRes.data.billabilityRuleConditionss || [];

    console.log(`\n=== Supabase Stats ===`);
    console.log(`Rules: ${sbRules.length}, Conditions: ${sbConds.length}`);

    console.log(`\n=== Data Connect Stats ===`);
    console.log(`Rules: ${dcRules.length}, Conditions: ${dcConds.length}`);

    console.log(`\n--- Supabase Rules Details ---`);
    sbRules.sort((a,b)=>a.priority-b.priority).forEach(r => {
      console.log(`Rule: "${r.name}" (${r.id}) | isBillable: ${r.is_billable} | Priority: ${r.priority}`);
      sbConds.filter(c => c.rule_id === r.id).forEach(c => {
        console.log(`  - Condition: ${c.logic_operator} ${c.field} ${c.operator} "${c.value}" (ID: ${c.id})`);
      });
    });

    console.log(`\n--- Data Connect Rules Details ---`);
    dcRules.sort((a,b)=>a.priority-b.priority).forEach(r => {
      console.log(`Rule: "${r.name}" (${r.id}) | isBillable: ${r.is_billable} | Priority: ${r.priority}`);
      dcConds.filter(c => c.rule_id === r.id).forEach(c => {
        console.log(`  - Condition: ${c.logic_operator} ${c.field} ${c.operator} "${c.value}" (ID: ${c.id})`);
      });
    });

  } catch (err) {
    console.error(err);
  }
}

run();
