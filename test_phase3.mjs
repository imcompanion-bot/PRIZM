import { eachDayOfInterval, isWeekend, format } from "date-fns";

function computeMonthlyHours(
  projectStart,
  projectEnd,
  scopedHours,
  phasePercentagesRaw
) {
  if (scopedHours <= 0) return {};
  
  const parsePct = (v) => {
    if (v == null) return 0;
    const parsed = parseFloat(String(v).replace(/[%]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  const hasAnyPct = Object.values(phasePercentagesRaw || {}).some(v => parsePct(v) > 0);
  const phaseCount = hasAnyPct ? 12 : 4;
  const effectivePcts = hasAnyPct 
    ? (phasePercentagesRaw || {})
    : { "Phase 1": 30, "Phase 2": 30, "Phase 3": 20, "Phase 4": 20 };

  const totalDays = Math.max(1, Math.round((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysPerPhase = totalDays / phaseCount;
  const monthlyHours = {};

  for (let phase = 1; phase <= phaseCount; phase++) {
    const rawVal = effectivePcts[`Phase ${phase}`] ?? effectivePcts[`phase ${phase}`] ?? effectivePcts[`Phase${phase}`] ?? effectivePcts[`phase${phase}`] ?? effectivePcts[String(phase)];
    const pct = parsePct(rawVal);
    
    if (pct <= 0) continue;
    const phaseHours = (pct / 100) * scopedHours;
    const phaseStartDay = Math.round((phase - 1) * daysPerPhase);
    const phaseEndDay = Math.round(phase * daysPerPhase) - 1;
    const phaseStart = new Date(projectStart.getTime() + phaseStartDay * 24 * 60 * 60 * 1000);
    const phaseEnd = new Date(projectStart.getTime() + phaseEndDay * 24 * 60 * 60 * 1000);
    const phaseDays = eachDayOfInterval({ start: phaseStart, end: phaseEnd });
    const workingDays = phaseDays.filter((d) => !isWeekend(d));
    if (workingDays.length === 0) continue;
    const hoursPerDay = phaseHours / workingDays.length;
    for (const day of workingDays) {
      const monthKey = format(day, "yyyy-MM");
      monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + hoursPerDay;
    }
  }
  return monthlyHours;
}

const res1 = computeMonthlyHours(new Date("2024-01-01"), new Date("2024-12-31"), 100, {});
console.log("Empty:", res1);

const res2 = computeMonthlyHours(new Date("2024-01-01"), new Date("2024-12-31"), 100, { "phase1": "33.0%", "phase2": "33.0%", "phase3": "34.0%" });
console.log("String phase:", res2);
