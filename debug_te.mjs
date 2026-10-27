import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: tes } = await supabase.from("talent_efficiencies").select("*").gte("month_date", "2026-03-01").lte("month_date", "2026-08-31").ilike("office", "%US%");
  let sum = 0;
  for (const t of tes) sum += t.amount;
  console.log("Total US TEs Mar-Aug 2026:", sum);
}
run();
