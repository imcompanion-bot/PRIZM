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

  const { data: scopes, error } = await supabase
    .from("project_scopes")
    .select("*, roles(name)")
    .eq("project_id", projectId);

  if (error) {
    console.error("Error:", error);
    return;
  }

  let totalHours = 0;
  scopes.forEach(s => totalHours += Number(s.scoped_hours) || 0);

  console.log("Project Scopes count:", scopes.length);
  console.log("Scopes list:");
  console.log(JSON.stringify(scopes, null, 2));
  console.log("Total Scoped Hours:", totalHours);
}

run();
