const { format, parseISO, endOfMonth, isBefore } = require('date-fns');

let currentYear = 2026;
let start = null;
let end = null;
let customStartDate = "";
let customEndDate = "";

function onSelect({ start: s, end: e }) {
  customStartDate = s ? format(s, "yyyy-MM-dd") : "";
  customEndDate = e ? format(e, "yyyy-MM-dd") : "";
  console.log("onSelect called:", customStartDate, customEndDate);
}

// First click Jan
let clickedStart = new Date(currentYear, 0, 1);
let clickedEnd = endOfMonth(clickedStart);
onSelect({ start: clickedStart, end: clickedEnd });

start = customStartDate ? parseISO(customStartDate) : undefined;
end = customEndDate ? parseISO(customEndDate) : undefined;

console.log("Start after first click:", start);

// Second click Apr
let clickedStart2 = new Date(currentYear, 3, 1);
let clickedEnd2 = endOfMonth(clickedStart2);

if (start && isBefore(clickedStart2, start)) {
  onSelect({ start: clickedStart2, end: endOfMonth(start) });
} else if (start) {
  onSelect({ start, end: clickedEnd2 });
}
