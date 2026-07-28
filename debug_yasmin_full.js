import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Simple custom .env parser
const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const [key, ...valParts] = line.split("=");
  if (key && valParts.length > 0) {
    env[key.trim()] = valParts.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Get all Yasmin Brougham rows
  const { data: people, error: pErr } = await supabase
    .from("people")
    .select("*, roles(name, billable_capacity_hours)")
    .ilike("name", "%Yasmin Brougham%");

  if (pErr) throw pErr;
  console.log("Yasmin Brougham profiles:");
  people.forEach(p => {
    console.log(`- ID: ${p.id}, name: ${p.name}, start: ${p.employment_start_date}, end: ${p.employment_end_date}, status: ${p.status}, capacity: ${p.roles?.billable_capacity_hours}`);
  });

  // 2. Find Crocs - JD Syncro Max Launch
  const { data: projects, error: prErr } = await supabase
    .from("projects")
    .select("*")
    .ilike("title", "%JD Syncro%");

  if (prErr) throw prErr;
  if (projects.length === 0) {
    console.log("No JD Syncro project found!");
    return;
  }

  const proj = projects[0];
  console.log(`\nFound Project: "${proj.title}"`);
  console.log(`Start: ${proj.start_date}, End: ${proj.end_date}`);

  // 3. Let's calculate working days from project start to today (or end date if today is past end date)
  const projectStartDate = proj.start_date;
  const projectEndDate = proj.end_date;
  const today = new Date("2026-07-28");
  const projectEnd = new Date(projectEndDate);
  const limitDate = today < projectEnd ? today : projectEnd;
  const limitDateStr = limitDate.toISOString().split("T")[0];

  let workingDaysSoFar = 0;
  let curr = new Date(projectStartDate);
  while (curr <= limitDate) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) workingDaysSoFar++;
    curr.setDate(curr.getDate() + 1);
  }
  console.log(`Working days from ${projectStartDate} to ${limitDateStr}: ${workingDaysSoFar}`);

  // 4. Query all hours logged by Yasmin's sibling IDs in this range
  const siblingIds = people.map(p => p.id);
  const { data: timeEntries, error: teErr } = await supabase
    .from("time_entries")
    .select("hours, date")
    .in("person_id", siblingIds)
    .gte("date", projectStartDate)
    .lte("date", limitDateStr);

  if (teErr) throw teErr;

  let totalHoursLogged = 0;
  timeEntries.forEach(e => {
    totalHoursLogged += Number(e.hours) || 0;
  });

  console.log(`Total hours logged by Yasmin Brougham in range: ${totalHoursLogged}`);
  console.log(`Number of time entry rows: ${timeEntries.length}`);

  // 5. Let's inspect the active profile row start/end dates
  const activeProfile = people.find(p => {
    const todayStr = "2026-07-28";
    const start = p.employment_start_date ? new Date(p.employment_start_date) : null;
    const end = p.employment_end_date ? new Date(p.employment_end_date) : null;
    if (start && start > new Date(todayStr)) return false;
    if (end && end < new Date(todayStr)) return false;
    return true;
  });

  if (activeProfile) {
    console.log(`\nActive profile during project range:`);
    console.log(`- ID: ${activeProfile.id}`);
    console.log(`- Start: ${activeProfile.employment_start_date}`);
    console.log(`- End: ${activeProfile.employment_end_date}`);
  }
}

run();
