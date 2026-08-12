const projStart = new Date("2026-04-15");
const projEnd = new Date("2026-09-30") < new Date() ? new Date("2026-09-30") : new Date();

const empStart = "2025-08-18";
const empEnd = "2040-12-31";

let effectiveStart = empStart && new Date(empStart) > projStart ? new Date(empStart) : projStart;
let effectiveEnd = empEnd && new Date(empEnd) < projEnd ? new Date(empEnd) : projEnd;

const today = new Date();
const appliedStartDate = "2026-01-30";
const appliedEndDate = "2026-07-30";
const windowStart = new Date(appliedStartDate);
const windowEndRaw = new Date(appliedEndDate);
const windowEnd = windowEndRaw > today ? today : windowEndRaw;

effectiveStart = effectiveStart > windowStart ? effectiveStart : windowStart;
effectiveEnd = effectiveEnd < windowEnd ? effectiveEnd : windowEnd;

console.log("effectiveStart:", effectiveStart.toISOString());
console.log("effectiveEnd:", effectiveEnd.toISOString());
console.log("effectiveStart > effectiveEnd?", effectiveStart > effectiveEnd);

function getWorkingDaysExcludingLeave(startDate, endDate, leaveIntervals) {
  if (startDate > endDate) return 0;
  let totalWorkingDays = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      let isLeave = false;
      if (leaveIntervals && leaveIntervals.length > 0) {
        for (const interval of leaveIntervals) {
          if (currentDate >= interval.start && currentDate <= interval.end) {
            isLeave = true;
            break;
          }
        }
      }
      if (!isLeave) {
        totalWorkingDays++;
      }
    }
    // Increment to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalWorkingDays;
}

const workingDays = getWorkingDaysExcludingLeave(effectiveStart, effectiveEnd, []);
console.log("workingDays:", workingDays);
console.log("expected:", workingDays * 7.5);
