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

const allowedTeams = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data"]);

function addDashes(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}

async function run() {
  try {
    const START_DATE = "2026-03-01";
    const END_DATE = "2026-05-31";

    // 1. Fetch people from Supabase
    let people = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/people?select=id,name,office,team&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      people.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    const allowedPeopleIds = new Set(
      people
        .filter(p => allowedTeams.has((p.team || "").toLowerCase().trim()))
        .map(p => p.id)
    );

    // 2. Fetch projects from Supabase
    console.log("Fetching projects from Supabase...");
    let sbProjects = [];
    offset = 0;
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
    const sbProjectsMap = new Map(sbProjects.map(p => [p.id, p]));

    // 3. Fetch projects from Data Connect
    console.log("Fetching projects from Data Connect...");
    const dcRes = await listProjects();
    const dcProjects = dcRes.data.projectss || [];
    const dcProjectIds = new Set(dcProjects.map(p => addDashes(p.id)));

    // Identify missing projects
    const missingProjectsMap = new Map();
    for (const p of sbProjects) {
      if (!dcProjectIds.has(p.id)) {
        missingProjectsMap.set(p.id, p);
      }
    }
    console.log(`Unique projects missing from Data Connect: ${missingProjectsMap.size}`);

    // 4. Fetch time entries from Supabase
    console.log("Fetching time entries in range...");
    let timeEntries = [];
    offset = 0;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?select=id,hours,notes,project_id,project_name,date,person_id&date=gte.${START_DATE}&date=lte.${END_DATE}&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      timeEntries.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    console.log(`Loaded ${timeEntries.length} time entries.`);

    let missingProjectsHours = 0;
    let missingEntriesCount = 0;
    const missingProjectBreakdown = {};

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;

    for (const entry of timeEntries) {
      if (!entry.person_id || !allowedPeopleIds.has(entry.person_id)) continue;
      const hrs = entry.hours || 0;
      const projName = entry.project_name;
      const notes = entry.notes || "";
      const isLeave = (
        (entry.project_id && sbProjectsMap.get(entry.project_id) && leaveRegex.test(sbProjectsMap.get(entry.project_id).title)) ||
        (!entry.project_id && projName && leaveRegex.test(projName)) ||
        (notes && leaveRegex.test(notes))
      );

      if (isLeave) continue;

      if (entry.project_id && missingProjectsMap.has(entry.project_id)) {
        missingProjectsHours += hrs;
        missingEntriesCount++;
        const p = missingProjectsMap.get(entry.project_id);
        const key = `${p.title} (${entry.project_id}) [Stage: ${p.stage}, Rev: ${p.revenue}]`;
        missingProjectBreakdown[key] = (missingProjectBreakdown[key] || 0) + hrs;
      }
    }

    console.log(`\n=== Missing Projects Diagnostic ===`);
    console.log(`Total time entries linked to missing projects: ${missingEntriesCount}`);
    console.log(`Total hours linked to missing projects: ${missingProjectsHours.toFixed(2)}h`);

    console.log("\nBreakdown of missing projects and hours:");
    const sortedBreakdown = Object.entries(missingProjectBreakdown).sort((a,b)=>b[1]-a[1]);
    sortedBreakdown.forEach(([proj, hrs]) => {
      console.log(`- ${proj}: ${hrs.toFixed(2)}h`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
