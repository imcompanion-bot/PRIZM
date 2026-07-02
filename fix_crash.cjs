const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/time-tracking/UtilisationTab.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove from second loop
const badLogic = `      // ----------------------------------------------------
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

      const accurateCompleteness = completenessCount > 0 ? (completenessSum / completenessCount) * 100 : 0;`;

content = content.replace(badLogic, '');

// 2. Insert into the first loop right before deduped.set(...)
const goodLogic = `
        // ----------------------------------------------------
        // compute accurate weekly capped completeness
        // ----------------------------------------------------
        const today = new Date();
        const personEffectiveEnd = today < endDate ? today : endDate;
        
        let completenessSum = 0;
        let completenessCount = 0;
        let accurateCompleteness = 0;

        // Group their raw time entries by week
        const entriesForPerson = rawTimeEntries.filter((r: any) => siblingIds.has(r.person_id));
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

        accurateCompleteness = completenessCount > 0 ? (completenessSum / completenessCount) * 100 : 0;
`;

const targetAnchor = `
        const overallEnd2 = person.overall_end_date ? new Date(person.overall_end_date) : null;
        const hasEnded = overallEnd2 ? overallEnd2 < new Date() : false;`;

content = content.replace(targetAnchor, targetAnchor + goodLogic);

// We need to make sure the deduped.set in the else block includes accurateCompleteness
content = content.replace(
`        deduped.set(dedupKey, {
          id: person.id,
          personIds: [person.id],
          name: person.name,
          team: person.team || "Unassigned",
          role: role?.name || "Unknown",
          roleHistory: role?.name ? [{ name: role.name, start: person.employment_start_date ? new Date(person.employment_start_date) : null }] : [],
          expectedTotalHours: personWorkingDays * HOURS_PER_DAY,
          expectedBillableHours: personWorkingDays * billableCapacityHrs,
          actualHours: total,
          billableHours: billable,
          leaveHours: leave,
          hoursSet: true,
          countedDays,
          hasEnded,
        });`,
`        deduped.set(dedupKey, {
          id: person.id,
          personIds: [person.id],
          name: person.name,
          team: person.team || "Unassigned",
          role: role?.name || "Unknown",
          roleHistory: role?.name ? [{ name: role.name, start: person.employment_start_date ? new Date(person.employment_start_date) : null }] : [],
          expectedTotalHours: personWorkingDays * HOURS_PER_DAY,
          expectedBillableHours: personWorkingDays * billableCapacityHrs,
          actualHours: total,
          billableHours: billable,
          leaveHours: leave,
          hoursSet: true,
          countedDays,
          hasEnded,
          accurateCompleteness,
        });`
);

// We also need to add accurateCompleteness to the deduped Map type definition
content = content.replace(
`      expectedTotalHours: number; expectedBillableHours: number;
      actualHours: number; billableHours: number; leaveHours: number;
      hoursSet: boolean; countedDays: Set<string>; hasEnded: boolean;
    }>();`,
`      expectedTotalHours: number; expectedBillableHours: number;
      actualHours: number; billableHours: number; leaveHours: number;
      hoursSet: boolean; countedDays: Set<string>; hasEnded: boolean;
      accurateCompleteness: number;
    }>();`
);

// And when the second loop maps \`deduped\` to \`map\`, it must pass accurateCompleteness along
content = content.replace(
`      map.set(entry.id, {
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
        accurateCompleteness
      });`,
`      map.set(entry.id, {
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
        accurateCompleteness: entry.accurateCompleteness
      });`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
