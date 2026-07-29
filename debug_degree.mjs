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
    .select(`id, title, ultimate_parent, sf_account, parent_account, office, start_date, end_date, opportunity_record_type`)
    .eq("title", "Degree Clinicals - TVC 2026 PT 1");
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log(projects[0]);
}
run();
