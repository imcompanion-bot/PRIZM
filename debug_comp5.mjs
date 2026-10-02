import { createClient } from '@supabase/supabase-js';
import { eachDayOfInterval, isWeekend, endOfMonth } from 'date-fns';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function debug() {
  const { data: people } = await supabase.from('people').select('*');
  const { data: ptConfigs } = await supabase.from('part_time_configs').select('*');
  const { data: leave } = await supabase.from('parental_leave').select('*');
  
  const { data: utilisation } = await supabase.rpc('get_utilisation_summary_monthly', {
    _start_date: '2026-06-01',
    _end_date: '2026-06-30'
  });
  
  // getExpectedHours
  const getExpectedHours = (personId, monthKey) => {
      const person = people.find(p => p.id === personId);
      if (!person) return 0;
      
      const monthStart = new Date(monthKey);
      const monthEnd = endOfMonth(monthStart);
      
      const empStart = person.employment_start_date ? new Date(person.employment_start_date)
        : person.overall_start_date ? new Date(person.overall_start_date) : null;
      const empEnd = person.employment_end_date ? new Date(person.employment_end_date)
        : person.overall_end_date ? new Date(person.overall_end_date) : null;

      if (empStart && empStart > monthEnd) return 0;
      if (empEnd && empEnd < monthStart) return 0;

      const effectiveStart = empStart && empStart > monthStart ? empStart : monthStart;
      const effectiveEnd = empEnd && empEnd < monthEnd ? empEnd : monthEnd;
      if (effectiveStart > effectiveEnd) return 0;
      
      let workingDays = 0;
      const configs = ptConfigs
        .filter(c => c.person_id === person.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      for (const d of days) {
        if (isWeekend(d)) continue;
        let daysPerWeek = 5;
        const activeConfig = configs.find(c => {
          const start = c.start_date ? new Date(c.start_date) : null;
          const end = c.end_date ? new Date(c.end_date) : null;
          return (!start || d >= start) && (!end || d <= end);
        });
        if (activeConfig && activeConfig.days_per_week) {
          daysPerWeek = activeConfig.days_per_week;
        }
        workingDays += (daysPerWeek / 5.0);
      }
      return workingDays * 8;
  };

  const personMonthComp = new Map();
  const personMonthTotal = new Map();
  
  for (const row of utilisation) {
    if (row.project_id === null) {
      if (!personMonthTotal.has(row.person_id)) personMonthTotal.set(row.person_id, new Map());
      personMonthTotal.get(row.person_id).set(row.month_date, (row.total_hours || 0) + (row.leave_hours || 0));
    }
  }
  
  for (const [personId, months] of personMonthTotal) {
    if (!personMonthComp.has(personId)) personMonthComp.set(personId, new Map());
    for (const [monthKey, total] of months) {
      const expected = getExpectedHours(personId, monthKey);
      if (expected > 0) {
        personMonthComp.get(personId).set(monthKey, Math.min((total / expected) * 100, 100));
      }
    }
  }

  const projMonthComps = new Map();
  for (const row of utilisation) {
    if (row.project_id !== null && row.total_hours > 0) {
      const comp = personMonthComp.get(row.person_id)?.get(row.month_date);
      if (comp !== undefined) {
        if (!projMonthComps.has(row.project_id)) projMonthComps.set(row.project_id, new Map());
        if (!projMonthComps.get(row.project_id).has(row.month_date)) {
          projMonthComps.get(row.project_id).set(row.month_date, { sum: 0, count: 0 });
        }
        const mData = projMonthComps.get(row.project_id).get(row.month_date);
        mData.sum += comp;
        mData.count++;
      }
    }
  }

  const factors = [];
  for (const [projId, months] of projMonthComps) {
    for (const [monthKey, data] of months) {
      if (data.count > 0 && monthKey === '2026-06-01') {
        const comp = data.sum / data.count;
        if (comp > 0 && comp < 99.5) {
          factors.push(Math.min(100 / comp, 3));
        }
      }
    }
  }
  
  console.log("Factors for June:", factors);
  const avgFactor = factors.reduce((a, b) => a + b, 0) / factors.length;
  console.log("Avg factor:", avgFactor);
}
debug();
