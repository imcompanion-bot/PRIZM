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
  // Fetch Hillary Yatou rows
  const { data: people, error: pErr } = await supabase
    .from("people")
    .select("*, roles(name, billable_capacity_hours)")
    .ilike("name", "%Hillary Yatou%");

  if (pErr) throw pErr;

  console.log("Hillary Yatou profile rows:");
  console.log(JSON.stringify(people, null, 2));
}

run();
