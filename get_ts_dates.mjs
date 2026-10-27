import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
async function run() {
  const { data } = await supabase.from("data_imports").select("*").eq("dataset", "timesheets");
  console.log("Timesheets import:", data);
  const { data: latest } = await supabase.from("time_entries").select("date").order("date", {ascending: false}).limit(1);
  console.log("Latest time entry date:", latest[0].date);
}
run();
