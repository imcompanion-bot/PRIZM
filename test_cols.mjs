import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data } = await supabase.from("projects").select("*").limit(1);
  console.log(Object.keys(data[0]));
}
run();
