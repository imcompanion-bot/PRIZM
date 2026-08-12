const { format, startOfMonth, subMonths, eachMonthOfInterval } = require('date-fns');

const today = new Date("2026-07-31T10:22:18+01:00");
const lastFullMonth = startOfMonth(today);

const endDate = "2026-04-30";
const cutoffDate = "2026-02-01";

const selectedEnd = new Date(endDate);
const effectiveEndMonth = selectedEnd < lastFullMonth ? startOfMonth(selectedEnd) : lastFullMonth;

const allMonths = eachMonthOfInterval({
  start: startOfMonth(new Date(cutoffDate)),
  end: effectiveEndMonth,
});
const months = allMonths.filter((m) => m < lastFullMonth || m.getTime() === effectiveEndMonth.getTime());

console.log(months.map(m => format(m, 'yyyy-MM-dd')));
