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
  const personId = "26df2eb5-fc6e-5147-a137-170ee8103a1e";

  // Let's get distinct project IDs she logged time on
  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("project_id, date, hours")
    .eq("person_id", personId);

  if (error) throw error;

  const projectIds = [...new Set(entries.map(e => e.project_id))].filter(Boolean);

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id, title, start_date, end_date")
    .in("id", projectIds);

  if (pErr) throw pErr;

  console.log("Projects where Hillary Yatou has logged hours:");
  projects.forEach(p => {
    // Find min and max date she logged on this project
    const pEntries = entries.filter(e => e.project_id === p.id);
    const dates = pEntries.map(e => new Date(e.date));
    const minDate = new Date(Math.min(...dates)).toISOString().split("T")[0];
    const maxDate = new Date(Math.max(...dates)).toISOString().split("T")[0];
    const hours = pEntries.reduce((s, e) => s + Number(e.hours), 0);

    console.log(`- "${p.title}" (ID: ${p.id})`);
    console.log(`  Project: ${p.start_date} to ${p.end_date}`);
    console.log(`  Hillary logged: ${hours.toFixed(2)}h total, first: ${minDate}, last: ${maxDate}`);
  });
}

run();
