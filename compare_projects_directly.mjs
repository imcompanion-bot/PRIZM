import { initializeApp } from 'firebase/app';
import { listProjects } from './src/dataconnect-generated/esm/index.esm.js';
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

// Helper to add dashes back to a 32-char UUID
function addDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}

async function run() {
  try {
    // 1. Fetch from Supabase
    console.log("Fetching projects from Supabase...");
    let sbProjects = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,title,opportunity_record_type,revenue,stage,office&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      sbProjects.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    const sbMap = new Map(sbProjects.map(p => [p.id, p]));

    // 2. Fetch from Data Connect
    console.log("Fetching projects from Data Connect...");
    const dcRes = await listProjects();
    const dcProjects = dcRes.data.projectss || [];
    const dcMap = new Map(dcProjects.map(p => [addDashes(p.id), p]));

    console.log(`\nComparing ${sbProjects.length} Supabase projects with ${dcProjects.length} Data Connect projects...`);

    let mismatchesCount = 0;
    const mismatches = [];

    for (const [id, sbProj] of sbMap.entries()) {
      const dcProj = dcMap.get(id);
      if (!dcProj) {
        // Missing in Data Connect
        continue;
      }

      const diffs = [];
      if (sbProj.revenue !== dcProj.revenue) {
        diffs.push(`revenue: ${sbProj.revenue} vs ${dcProj.revenue}`);
      }
      if (sbProj.stage !== dcProj.stage) {
        diffs.push(`stage: "${sbProj.stage}" vs "${dcProj.stage}"`);
      }
      if (sbProj.opportunity_record_type !== dcProj.opportunity_record_type) {
        diffs.push(`type: "${sbProj.opportunity_record_type}" vs "${dcProj.opportunity_record_type}"`);
      }
      if (sbProj.office !== dcProj.office) {
        diffs.push(`office: "${sbProj.office}" vs "${dcProj.office}"`);
      }

      if (diffs.length > 0) {
        mismatchesCount++;
        mismatches.push({
          id,
          title: sbProj.title,
          diffs
        });
      }
    }

    console.log(`\nFound ${mismatchesCount} projects with mismatched properties between Supabase and Data Connect.`);
    
    if (mismatchesCount > 0) {
      console.log("\nSample mismatches:");
      mismatches.slice(0, 30).forEach(m => {
        console.log(`- Project: "${m.title}" (${m.id})`);
        m.diffs.forEach(d => console.log(`  * Difference: ${d}`));
      });
    }

  } catch (err) {
    console.error(err);
  }
}

run();
