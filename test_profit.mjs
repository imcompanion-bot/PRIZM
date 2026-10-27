import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: projData } = await supabase.from("projects").select("id, office, revenue, gross_budget, start_date, end_date, extra_data").in("office", ["US", "United States"]);
  // This is complex to reproduce exactly.
  console.log("Projects:", projData.length);
}
run();
