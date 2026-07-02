import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data } = await supabase.from("project_scopes").select("id, phase_percentages").limit(100);
  let emptyCount = 0;
  for (const row of data) {
    if (!row.phase_percentages || Object.keys(row.phase_percentages).length === 0) {
      emptyCount++;
    }
  }
  console.log(`Out of ${data.length} scopes, ${emptyCount} have empty phase_percentages.`);
}
run();
