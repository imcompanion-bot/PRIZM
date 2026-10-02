import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function debug() {
  const { data: people } = await supabase.from('people').select('*').eq('office', 'US');
  const personIds = people.map(p => p.id);
  
  const { data: utilisation } = await supabase.rpc('get_utilisation_summary_monthly', {
    _start_date: '2026-04-01',
    _end_date: '2026-09-30'
  });
  
  const usUtil = utilisation.filter(u => personIds.includes(u.person_id) && u.month_date === '2026-06-01');
  console.log("Total US rows in June:", usUtil.length);
  
  const personMonthTotal = new Map();
  for (const row of usUtil) {
    if (row.project_id === null) {
      personMonthTotal.set(row.person_id, (row.total_hours || 0) + (row.leave_hours || 0));
    }
  }
  
  console.log("US People with total hours in June:", personMonthTotal.size);
  let sum = 0;
  for (const [pid, total] of personMonthTotal) {
    sum += total;
  }
  console.log("Total hours logged by US in June:", sum);
}
debug();
