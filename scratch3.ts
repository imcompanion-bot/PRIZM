const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/ProfitabilityPage.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ ── Per-project gross-up factors \(always computed for Y-axis domain\) ──[\s\S]*?return map;\n  \}, \[completenessData\]\);/;

const replaceStr = `// ── Per-project monthly gross-up factors (always computed for Y-axis domain) ──
  const allGrossUpFactorsMonthly = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    // Helper to get expected hours for a person in a month
    const getExpectedHours = (personId: string, monthKey: string) => {
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
      
      const normName = (person.name || "").trim().toLowerCase();
      const leaveIntervals = parentalLeaveMap.get(normName);
      
      // Calculate working days considering part-time configs
      let workingDays = 0;
      const ptConfigs = partTimeConfigs
        .filter(c => c.person_id === person.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      for (const d of days) {
        if (isWeekend(d)) continue;
        if (isOnParentalLeave(d, leaveIntervals)) continue;
        
        let daysPerWeek = 5;
        const activeConfig = ptConfigs.find(c => {
          const start = c.start_date ? new Date(c.start_date) : null;
          const end = c.end_date ? new Date(c.end_date) : null;
          return (!start || d >= start) && (!end || d <= end);
        });
        if (activeConfig && activeConfig.days_per_week) {
          daysPerWeek = activeConfig.days_per_week;
        }
        workingDays += (daysPerWeek / 5.0);
      }
      return workingDays * 8; // 8 hours per day
    };

    // Calculate person monthly completeness
    const personMonthComp = new Map<string, Map<string, number>>();
    // Group monthly logged hours
    const personMonthTotal = new Map<string, Map<string, number>>();
    for (const row of utilisationSummaryMonthly) {
      if (row.project_id === null) {
        if (!personMonthTotal.has(row.person_id)) personMonthTotal.set(row.person_id, new Map());
        personMonthTotal.get(row.person_id)!.set(row.month_date, (row.total_hours || 0) + (row.leave_hours || 0));
      }
    }
    
    for (const [personId, months] of personMonthTotal) {
      if (!personMonthComp.has(personId)) personMonthComp.set(personId, new Map());
      for (const [monthKey, total] of months) {
        const expected = getExpectedHours(personId, monthKey);
        if (expected > 0) {
          personMonthComp.get(personId)!.set(monthKey, Math.min((total / expected) * 100, 100));
        }
      }
    }

    // Now project monthly completeness
    const projMonthComps = new Map<string, Map<string, { sum: number, count: number }>>();
    for (const row of utilisationSummaryMonthly) {
      if (row.project_id !== null && row.total_hours > 0) {
        const comp = personMonthComp.get(row.person_id)?.get(row.month_date);
        if (comp !== undefined) {
          if (!projMonthComps.has(row.project_id)) projMonthComps.set(row.project_id, new Map());
          if (!projMonthComps.get(row.project_id)!.has(row.month_date)) {
            projMonthComps.get(row.project_id)!.set(row.month_date, { sum: 0, count: 0 });
          }
          const mData = projMonthComps.get(row.project_id)!.get(row.month_date)!;
          mData.sum += comp;
          mData.count++;
        }
      }
    }

    for (const [projId, months] of projMonthComps) {
      const pMap = new Map<string, number>();
      for (const [monthKey, data] of months) {
        if (data.count > 0) {
          const comp = data.sum / data.count;
          if (comp > 0 && comp < 99.5) {
            pMap.set(monthKey, 100 / comp);
          }
        }
      }
      if (pMap.size > 0) map.set(projId, pMap);
    }
    
    return map;
  }, [utilisationSummaryMonthly, people, partTimeConfigs, parentalLeaveMap]);

  const grossUpFactorsMonthly = useMemo(() => {
    if (!grossUp) return new Map<string, Map<string, number>>();
    return allGrossUpFactorsMonthly;
  }, [grossUp, allGrossUpFactorsMonthly]);`;

if (content.match(regex)) {
  content = content.replace(regex, replaceStr);
  console.log("Match found and replaced");
} else {
  console.log("No match found!");
}

fs.writeFileSync(file, content, 'utf8');
