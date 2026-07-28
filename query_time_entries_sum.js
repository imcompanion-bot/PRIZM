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

  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("hours")
    .eq("project_id", projectId);

  if (error) {
    console.error("Error:", error);
    return;
  }

  let totalHours = 0;
  entries.forEach(e => totalHours += Number(e.hours) || 0);

  console.log(`Time entries count for project ${projectId}:`, entries.length);
  console.log(`Total hours logged from time_entries table:`, totalHours);
}

run();
