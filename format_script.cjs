const fs = require('fs');
const content = fs.readFileSync('src/pages/ProfitabilityPage.tsx', 'utf8');

const replacement = `      // Proportion agency fee / scope to the portion of the project that overlaps the selected window
      // by spreading across months (exactly matching the ProfitabilityTrendChart logic).
      const projStart = parseISO(p.start_date);
      const projEnd = parseISO(p.end_date);
      const isComplete = projEnd <= today;

      const totalScopedFull = (p.project_scopes || []).reduce((s: number, sc: any) => s + (sc.scoped_hours || 0), 0);

      // Window bounds (cap "elapsed" end at today so we never count future work)
      const windowStart = parseISO(cutoffDate);
      const windowEndRaw = parseISO(endDateStr);
      const windowEnd = windowEndRaw > today ? today : windowEndRaw;

      // Identify the target months string array for matching
      const targetMonths = eachMonthOfInterval({ start: startOfMonth(windowStart), end: startOfMonth(windowEnd) })
        .map(m => format(m, "yyyy-MM-01"));

      let revenue = 0;
      let totalScoped = 0;
      const effectiveScopedHoursByScopeId: Record<string, number> = {};

      const projPhases = projectPhases.filter((ph: any) => ph.project_id === p.id);
      const projPhaseIds = new Set(projPhases.map((ph: any) => ph.id));
      const projPhaseAllocs = phaseAllocations.filter((pa: any) => projPhaseIds.has(pa.phase_id));

      let totalAllocatedValue = 0;
      for (const pa of projPhaseAllocs) {
        const scope = (p.project_scopes || []).find((sc: any) => sc.id === pa.project_scope_id);
        const rate = scope ? (roleRates[scope.role_id] || 0) : 0;
        totalAllocatedValue += Number(pa.hours) * rate;
      }
      
      const hasPhaseData = projPhases.length > 0 && projPhaseAllocs.length > 0 && totalAllocatedValue > 0;

      if (hasPhaseData) {
        for (const phase of projPhases) {
          if (!phase.start_date || !phase.end_date) continue;
          const phaseStart = parseISO(phase.start_date);
          const phaseEnd = parseISO(phase.end_date);

          const phaseAllocationsForThisPhase = projPhaseAllocs.filter((pa: any) => pa.phase_id === phase.id);

          const phaseValue = phaseAllocationsForThisPhase.reduce((sum: number, pa: any) => {
            const scope = (p.project_scopes || []).find((sc: any) => sc.id === pa.project_scope_id);
            const rate = scope ? (roleRates[scope.role_id] || 0) : 0;
            return sum + Number(pa.hours) * rate;
          }, 0);

          const phaseFee = fullRevenue * (phaseValue / totalAllocatedValue);
          if (phaseFee <= 0) continue;

          const totalPhaseDays = countWorkingDays(phaseStart, phaseEnd);
          if (totalPhaseDays === 0) continue;

          const phaseMonths = eachMonthOfInterval({ start: startOfMonth(phaseStart), end: startOfMonth(phaseEnd) });
          for (const m of phaseMonths) {
            const mEnd = endOfMonth(m);
            const overlapStart = m < phaseStart ? phaseStart : m;
            const overlapEnd = mEnd > phaseEnd ? phaseEnd : mEnd;
            const overlapDays = countWorkingDays(overlapStart, overlapEnd);
            const monthKey = format(m, "yyyy-MM-01");
            if (targetMonths.includes(monthKey)) {
              revenue += phaseFee * (overlapDays / totalPhaseDays);
              for (const pa of phaseAllocationsForThisPhase) {
                const h = Number(pa.hours) * (overlapDays / totalPhaseDays);
                effectiveScopedHoursByScopeId[pa.project_scope_id] = (effectiveScopedHoursByScopeId[pa.project_scope_id] || 0) + h;
                totalScoped += h;
              }
            }
          }
        }
      } else {
        const totalDays = countWorkingDays(projStart, projEnd);
        if (totalDays > 0) {
          const projMonths = eachMonthOfInterval({ start: startOfMonth(projStart), end: startOfMonth(projEnd) });
          for (const m of projMonths) {
            const mEnd = endOfMonth(m);
            const overlapStart = m < projStart ? projStart : m;
            const overlapEnd = mEnd > projEnd ? projEnd : mEnd;
            const overlapDays = countWorkingDays(overlapStart, overlapEnd);
            const monthKey = format(m, "yyyy-MM-01");
            if (targetMonths.includes(monthKey)) {
              revenue += fullRevenue * (overlapDays / totalDays);
              for (const sc of p.project_scopes || []) {
                const h = (sc.scoped_hours || 0) * (overlapDays / totalDays);
                effectiveScopedHoursByScopeId[sc.id] = (effectiveScopedHoursByScopeId[sc.id] || 0) + h;
                totalScoped += h;
              }
            }
          }
        }
      }
`;

const startIndex = content.indexOf('      // Proportion agency fee / scope to the portion of the project');
const endIndex = content.indexOf('      const projCost = costMap[p.id]') - 6;

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/pages/ProfitabilityPage.tsx', newContent);
  console.log('Replaced successfully');
} else {
  console.log('Could not find bounds', startIndex, endIndex);
}
