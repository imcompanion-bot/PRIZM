import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
async function run() {
  const { data: projs } = await supabase.from("projects").select("title, revenue, updated_at").ilike("title", "%King%");
  const totalRev = projs.reduce((s, p) => s + p.revenue, 0);
  console.log("Total King Revenue:", totalRev);
}
run();
