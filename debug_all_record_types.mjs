import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const __dirname = "/Users/jamesbrazier/Documents/GitHub/PRIZM";
const envContent = fs.readFileSync(path.resolve(__dirname, ".env"), "utf8");
const envLines = envContent.split("\n");
for (const line of envLines) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projects, error } = await supabase.from("projects")
    .select(`opportunity_record_type`);
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const counts = {};
  for (const p of projects) {
    const t = p.opportunity_record_type;
    counts[t] = (counts[t] || 0) + 1;
  }
  console.log(counts);
}
run();
