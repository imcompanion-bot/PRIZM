import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: ts } = await supabase.from("time_entries")
    .select("*")
    .limit(1);
    
  console.log(Object.keys(ts[0]));
}
run();
