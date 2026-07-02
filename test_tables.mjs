import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data, error } = await supabase.rpc("get_tables");
  console.log("Tables:", data, error);
}
run();
