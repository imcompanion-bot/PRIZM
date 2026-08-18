const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function main() {
    const appliedStartDate = '2026-02-01';
    const appliedEndDate = '2026-08-17';
    
    // 2. Fetch utilisationSummary
    let utilisationSummary = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.rpc('get_utilisation_summary', {
            _start_date: appliedStartDate,
            _end_date: appliedEndDate
        }).order('project_id').order('person_id').range(from, from + 999);
        if (!data || data.length === 0) break;
        utilisationSummary = utilisationSummary.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    const { data: people } = await supabase.from('people').select('id, name');
    
    const projId = '4374255d-4343-57d0-b641-f85a66839e37';
    
    const projectPersonHoursMap = new Map();
    for (const row of utilisationSummary) {
      if (!row.person_id) continue;
      if (row.project_id) {
        if (!projectPersonHoursMap.has(row.project_id)) projectPersonHoursMap.set(row.project_id, new Map());
        projectPersonHoursMap.get(row.project_id).set(row.person_id, Number(row.total_hours));
      }
    }
    
    const hoursMap = projectPersonHoursMap.get(projId);
    console.log('hoursMap for project has keys:', Array.from(hoursMap.keys()).length);
    for (const [pid, hrs] of hoursMap.entries()) {
        const p = people.find(x => x.id === pid);
        console.log(p ? p.name : pid, hrs);
    }
}
main();
