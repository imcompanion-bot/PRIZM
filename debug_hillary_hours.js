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

  // Let's query her time entries for this year
  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("person_id", personId)
    .order("date", { ascending: true });

  if (error) throw error;

  console.log(`Hillary Yatou has ${entries.length} total time entries.`);

  let totalHours = 0;
  entries.forEach(e => totalHours += Number(e.hours) || 0);
  console.log(`Total hours logged this year: ${totalHours}h`);

  // Let's group by week and see how much she logs
  const weeklyHours = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff)).toISOString().split("T")[0];
    weeklyHours[monday] = (weeklyHours[monday] || 0) + Number(e.hours);
  });

  console.log("\nWeekly logged hours:");
  Object.keys(weeklyHours).sort().forEach(w => {
    console.log(`- Week of ${w}: ${weeklyHours[w].toFixed(2)}h`);
  });
}

run();
