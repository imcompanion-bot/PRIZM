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
  const projectId = "97ccc513-3a38-5c75-8083-0be6dd6804e6";

  // Fetch all people
  const { data: people, error: pErr } = await supabase
    .from("people")
    .select("*, roles(name)")
    .order("name");

  if (pErr) throw pErr;

  // Fetch time entries on this project
  const { data: entries, error: teErr } = await supabase
    .from("time_entries")
    .select("person_id, hours")
    .eq("project_id", projectId);

  if (teErr) throw teErr;

  const hoursByPerson = {};
  entries.forEach(e => {
    hoursByPerson[e.person_id] = (hoursByPerson[e.person_id] || 0) + Number(e.hours);
  });

  const results = [];
  Object.keys(hoursByPerson).forEach(pid => {
    const person = people.find(p => p.id === pid);
    if (person) {
      results.push({
        name: person.name,
        role: person.roles?.name || "Unknown",
        hours: Number(hoursByPerson[pid].toFixed(1))
      });
    }
  });

  results.sort((a, b) => b.hours - a.hours);

  console.log("Logged hours on this project by person:");
  console.log(JSON.stringify(results, null, 2));
}

run();
