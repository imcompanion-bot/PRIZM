import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: projs } = await supabase.from("projects").select("updated_at").order("updated_at", {ascending: false}).limit(1);
  console.log("Last project update:", projs[0].updated_at);
}
run();
