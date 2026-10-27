import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: projs } = await supabase.from("projects")
    .select("id, title, revenue, budget_cost, start_date, end_date, rate_card_id, rate_cards(name)")
    .ilike("title", "%King%")
    .gte("start_date", "2026-03-01")
    .lte("start_date", "2026-08-31");
  console.log("King Projects Mar-Aug 2026:");
  console.log(JSON.stringify(projs, null, 2));
}
run();
