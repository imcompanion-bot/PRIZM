import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data } = await supabase.from("projects").select("title, opportunity_number, extra_data").limit(5000);
  
  let nullOppNumberButInExtra = 0;
  for (const p of data) {
    if (!p.opportunity_number && p.extra_data) {
      let found = false;
      for (const [k, v] of Object.entries(p.extra_data)) {
        if (k.toLowerCase().includes("opp") || k.toLowerCase().includes("number")) {
           console.log(`Project: ${p.title} has ${k} = ${v} in extra_data`);
           found = true;
        }
      }
      if (found) nullOppNumberButInExtra++;
    }
  }
  console.log(`Found ${nullOppNumberButInExtra} projects where opp number is in extra_data but not opportunity_number column`);
}
run();
