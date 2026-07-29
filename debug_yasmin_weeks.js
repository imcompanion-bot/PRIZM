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
  const siblingIds = [
    "41c958fd-0649-580e-86b4-1e97f2347076",
    "a92e53a6-42bf-5f59-b85b-e1a665f55917",
    "22324c9e-097b-51cd-b273-49c6bdb5447b",
    "00c2ead2-9fab-5e23-8e01-87adf23eb9f1",
    "c94ac827-fd3d-53b5-b67f-c81ccc02b912",
    "01f653cd-7ccc-5e2f-91a4-8e80cddc2cf4",
    "0807c61b-7074-50e3-ba24-cdb103d2401b"
  ];

  const startDate = "2026-05-18";
  const endDate = "2026-07-28";

  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("date, hours")
    .in("person_id", siblingIds)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  // Group by week (start of week)
  const weeklyHours = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    // Find monday
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff)).toISOString().split("T")[0];
    weeklyHours[monday] = (weeklyHours[monday] || 0) + Number(e.hours);
  });

  console.log("Weekly logged hours for Yasmin Brougham (May 18 to July 28):");
  Object.keys(weeklyHours).sort().forEach(w => {
    console.log(`- Week of ${w}: ${weeklyHours[w].toFixed(2)}h`);
  });
}

run();
