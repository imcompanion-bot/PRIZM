import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: ppl } = await supabase.from("people").select("id, name, annual_salary, uk_percentage, us_percentage, office").ilike("name", "%Jake Frisbie%");
  console.log(ppl);
}
run();
