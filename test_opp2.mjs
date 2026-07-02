import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data } = await supabase.from("projects").select("title, opportunity_number, extra_data").not("opportunity_number", "is", null).limit(5);
  console.log("Projects with opportunity_number:", data);
  
  const { data: data2 } = await supabase.from("projects").select("title, opportunity_number, extra_data").limit(5);
  console.log("Projects without opp number (first 5):");
  for (const p of data2) {
    if (!p.opportunity_number) {
       console.log(p.title, "extra_data keys:", Object.keys(p.extra_data || {}));
       if (p.extra_data) {
         for (const key of Object.keys(p.extra_data)) {
           if (key.toLowerCase().includes("opp")) {
             console.log("   Found opp in extra_data:", key, p.extra_data[key]);
           }
         }
       }
    }
  }
}

run();
