import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: timesheets, error } = await supabase.from("utilisation_summary").select("*").limit(1);
  if (error) console.log("error", error);
  else console.log("OK summary");
}
run();
