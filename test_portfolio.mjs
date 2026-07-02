import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const allData = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, sf_account, parent_account, ultimate_parent, office, start_date, end_date, project_scopes(id, role_id, scoped_hours, phase_percentages)")
      .not("project_scopes", "is", null)
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("Error:", error);
      break;
    }
    allData.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  
  const filtered = allData.filter((p) => p.project_scopes && p.project_scopes.length > 0);
  console.log("Filtered length:", filtered.length);
  
  if (filtered.length > 0) {
    const p = filtered[0];
    console.log("First filtered project:", p.title, p.ultimate_parent, p.start_date, p.end_date);
  }
}

run();
