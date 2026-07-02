import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data } = await supabase.from("projects").select("title, opportunity_number, sf_account, extra_data").limit(100);
  
  for (const p of data) {
    if (!p.opportunity_number) {
       console.log(p.title, Object.keys(p.extra_data || {}));
    }
  }
}
run();
