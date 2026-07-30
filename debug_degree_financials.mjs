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
    .select(`id, title, revenue, price, media_cost, gross_budget, budget_cost, extra_data`)
    .eq("title", "Degree 2027 Planning");
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log(projects[0]);
}
run();
