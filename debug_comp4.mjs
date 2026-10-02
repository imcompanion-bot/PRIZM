import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function debug() {
  const { data: utilisation } = await supabase.rpc('get_utilisation_summary_monthly', {
    _start_date: '2026-04-01',
    _end_date: '2026-09-30'
  }).order("month_date").order("person_id").order("project_id").range(0, 9999);
  
  const usUtil = utilisation.filter(u => u.month_date === '2026-06-01');
  
  const personMonthTotal = new Map();
  for (const row of usUtil) {
    if (row.project_id === null) {
      personMonthTotal.set(row.person_id, (row.total_hours || 0) + (row.leave_hours || 0));
    }
  }
  console.log("Total June log rows (project_id = null):", personMonthTotal.size);
  
  let lowComps = 0;
  for (const [pid, total] of personMonthTotal) {
    if (total < 10) lowComps++;
  }
  console.log("People with < 10 hours in June:", lowComps);
}
debug();
