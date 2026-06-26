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

function addDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}

async function run() {
  try {
    // 1. Fetch one project from Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,title&limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const sbData = await res.json();
    const sbProj = sbData[0];

    // 2. Fetch one project from Data Connect
    const dcRes = await listProjects();
    const dcProjects = dcRes.data.projectss || [];
    const dcProj = dcProjects.find(p => p.title === sbProj.title) || dcProjects[0];

    console.log("=== ID Matching Test ===");
    console.log("Supabase Project ID:", sbProj.id, "Type:", typeof sbProj.id, "Length:", sbProj.id?.length);
    console.log("Data Connect Project ID:", dcProj.id, "Type:", typeof dcProj.id, "Length:", dcProj.id?.length);
    console.log("Data Connect Project ID with addDashes:", addDashes(dcProj.id));
    console.log("Equals check:", sbProj.id === addDashes(dcProj.id));
    
  } catch (err) {
    console.error(err);
  }
}

run();
