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

const allowedTeams = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data"]);

async function run() {
  try {
    const START_DATE = "2026-03-01";
    const END_DATE = "2026-05-31";

    console.log(`Analyzing orphan time entries between ${START_DATE} and ${END_DATE}...`);

    // Fetch people
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

    // Fetch projects
    let projects = [];
    offset = 0;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      projects.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    const projectsMap = new Map(projects.map(p => [p.id, p]));

    // Fetch time entries in range that have project_id as null
    let timeEntries = [];
    offset = 0;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?select=id,hours,notes,project_id,project_name,date,person_id&date=gte.${START_DATE}&date=lte.${END_DATE}&project_id=is.null&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      timeEntries.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    console.log(`Loaded ${timeEntries.length} time entries in range with project_id: null.`);

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;

    const projectNamesMap = {};
    let totalOrphanNetHours = 0;
    let sampleOrphans = [];

    for (const entry of timeEntries) {
      if (!entry.person_id || !allowedPeopleIds.has(entry.person_id)) continue;
      const hrs = entry.hours || 0;
      const projName = entry.project_name;
      const notes = entry.notes || "";
      const isLeave = (
        (projName && leaveRegex.test(projName)) ||
        (notes && leaveRegex.test(notes))
      );

      if (isLeave) continue; // Skip leave

      totalOrphanNetHours += hrs;
      projectNamesMap[projName] = (projectNamesMap[projName] || 0) + hrs;

      if (sampleOrphans.length < 20) {
        sampleOrphans.push(entry);
      }
    }

    console.log(`\nTotal Non-Leave Orphan Worked Hours: ${totalOrphanNetHours.toFixed(2)}h`);

    console.log("\nBreakdown by project_name:");
    const sortedProjectNames = Object.entries(projectNamesMap).sort((a, b) => b[1] - a[1]);
    sortedProjectNames.forEach(([name, hrs]) => {
      console.log(`- "${name}": ${hrs.toFixed(2)}h`);
    });

    console.log("\nSample orphan entries:");
    console.log(JSON.stringify(sampleOrphans, null, 2));

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
