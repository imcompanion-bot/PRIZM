const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/time-tracking/UtilisationTab.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import for startOfWeek, endOfWeek, eachWeekOfInterval, isBefore
if (!content.includes('eachWeekOfInterval')) {
  content = content.replace(/import \{([^}]+)\} from "date-fns";/, (match, p1) => {
    return `import { ${p1}, eachWeekOfInterval, startOfWeek, endOfWeek, isBefore, isAfter, min } from "date-fns";`;
  });
}

// 2. Add raw time entries fetch
const fetchQuery = `  const { data: rawTimeEntries = [] } = useQuery({
    queryKey: ["raw_time_entries_for_completeness", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      let allData = [];
      let from = 0;
      const PAGE_SIZE = 5000;
      while (true) {
        const { data, error } = await supabase
          .from("time_entries")
          .select("person_id, date, hours")
          .gte("date", format(startDate, "yyyy-MM-dd"))
          .lte("date", format(endDate, "yyyy-MM-dd"))
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allData = allData.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      return allData;
    }
  });`;

if (!content.includes('raw_time_entries_for_completeness')) {
  content = content.replace(
    'const { data: utilisationSummary = [] } = useQuery({',
    `${fetchQuery}\n\n  const { data: utilisationSummary = [] } = useQuery({`
  );
}

// 3. Update the personSummaries useMemo dependencies
content = content.replace(
  '  }, [people, hoursByPerson, startDate, endDate, officeFilter, parentalLeaveMap]);',
  '  }, [people, hoursByPerson, startDate, endDate, officeFilter, parentalLeaveMap, rawTimeEntries]);'
);

// 4. Update the logic inside personSummaries to compute capped weekly completeness
// We will replace the final `map.set(...)` with our weekly logic.

const replacementLogic = `      // ----------------------------------------------------
      // compute accurate weekly capped completeness
      // ----------------------------------------------------
      const today = new Date();
      const personEffectiveEnd = today < endDate ? today : endDate;
      
      let completenessSum = 0;
      let completenessCount = 0;

      // Group their raw time entries by week
      const entriesForPerson = rawTimeEntries.filter(r => siblingIds.has(r.person_id));
      const hoursByWeek = new Map();
      for (const r of entriesForPerson) {
        const d = new Date(r.date);
        const ws = startOfWeek(d, { weekStartsOn: 1 }).toISOString();
        hoursByWeek.set(ws, (hoursByWeek.get(ws) || 0) + Number(r.hours));
      }

      // Generate all weeks in the period
      let pStart = startOfWeek(effectiveStart, { weekStartsOn: 1 });
      let pEnd = endOfWeek(personEffectiveEnd, { weekStartsOn: 1 });
      if (pStart <= pEnd) {
        const weeks = eachWeekOfInterval({ start: pStart, end: pEnd }, { weekStartsOn: 1 });
        
        for (const weekStart of weeks) {
          const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          
          let clampedStart = weekStart;
          let clampedEnd = wEnd > personEffectiveEnd ? personEffectiveEnd : wEnd;
          
          // Clamp to employment dates
          const empStart = person.employment_start_date ? new Date(person.employment_start_date) : null;
          const empEnd = person.overall_end_date ? new Date(person.overall_end_date) : (person.employment_end_date ? new Date(person.employment_end_date) : null);
          
          if (empStart && empStart > clampedStart) clampedStart = empStart;
          if (empEnd && empEnd < clampedEnd) clampedEnd = empEnd;
          
          if (clampedEnd < clampedStart) continue; // Not employed this week
          
          // Calculate expected hours for this specific week
          let weekExpectedDays = 0;
          const weekDays = eachDayOfInterval({ start: clampedStart, end: clampedEnd });
          for (const d of weekDays) {
            if (!isWeekend(d) && !isOnParentalLeave(d, leaveIntervals)) {
              weekExpectedDays++;
            }
          }
          const weekExpected = weekExpectedDays * 7.5;
          
          if (weekExpected > 0) {
            const actual = hoursByWeek.get(weekStart.toISOString()) || 0;
            completenessSum += Math.min(actual / weekExpected, 1);
            completenessCount++;
          }
        }
      }

      const accurateCompleteness = completenessCount > 0 ? (completenessSum / completenessCount) * 100 : 0;

      const displayRole = uniqueRoles.length > 0 ? uniqueRoles.join(" → ") : entry.role;

      map.set(entry.id, {
        id: entry.id,
        name: entry.name,
        team: entry.team,
        role: displayRole,
        expectedTotalHours: entry.expectedTotalHours,
        expectedBillableHours: entry.expectedBillableHours,
        actualHours: entry.actualHours,
        billableHours: entry.billableHours,
        leaveHours: entry.leaveHours,
        hasEnded: entry.hasEnded,
        accurateCompleteness // Store accurate completeness
      });`;

content = content.replace(
  `      const displayRole = uniqueRoles.length > 0 ? uniqueRoles.join(" → ") : entry.role;

      map.set(entry.id, {
        id: entry.id,
        name: entry.name,
        team: entry.team,
        role: displayRole,
        expectedTotalHours: entry.expectedTotalHours,
        expectedBillableHours: entry.expectedBillableHours,
        actualHours: entry.actualHours,
        billableHours: entry.billableHours,
        leaveHours: entry.leaveHours,
        hasEnded: entry.hasEnded,
      });`,
  replacementLogic
);

// 5. Update team member mapping to use accurateCompleteness
content = content.replace(
  `        completeness: p.expectedTotalHours > 0 ? Math.min((p.actualHours / p.expectedTotalHours) * 100, 100) : 0,`,
  `        completeness: p.accurateCompleteness,`
);

// 6. Update personData mapping to use accurateCompleteness
content = content.replace(
  `        completeness: Math.round(p.expectedTotalHours > 0 ? Math.min((p.actualHours / p.expectedTotalHours) * 100, 100) : 0),`,
  `        completeness: Math.round(p.accurateCompleteness),`
);

// 7. Update raw export logic to use accurateCompleteness
content = content.replace(
  `      const completeness = p.expectedTotalHours > 0 ? Math.min((p.actualHours / p.expectedTotalHours) * 100, 100) : 0;`,
  `      const completeness = p.accurateCompleteness;`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
