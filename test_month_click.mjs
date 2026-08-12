import { format, endOfMonth, isBefore, isAfter, isSameMonth, parseISO } from "date-fns";

let currentYear = 2026;
let start = undefined;
let end = undefined;
let isSelectingRange = false;

function onSelect(range) {
  start = range.start;
  end = range.end;
  console.log(`onSelect called with: start=${start}, end=${end}`);
}

function handleMonthClick(monthIndex) {
  const clickedStart = new Date(currentYear, monthIndex, 1);
  const clickedEnd = endOfMonth(clickedStart);

  if (!isSelectingRange) {
    onSelect({ start: clickedStart, end: clickedEnd });
    isSelectingRange = true;
  } else {
    if (start && isBefore(clickedStart, start)) {
      onSelect({ start: clickedStart, end: endOfMonth(start) });
    } else if (start) {
      onSelect({ start, end: clickedEnd });
    }
    isSelectingRange = false;
  }
}

// User clicks Jan
handleMonthClick(0);
// Wait, the parent updates the props. So start and end are what they were.
// Let's say ProfitabilityPage formats them and parses them.
let startStr = format(start, "yyyy-MM-dd");
let endStr = format(end, "yyyy-MM-dd");
console.log(`Parent state: ${startStr} to ${endStr}`);

// Parent passes them back, ProfitabilityPage uses parseISO:
start = parseISO(startStr);
end = parseISO(endStr);
console.log(`Props passed back: start=${start}, end=${end}`);

// User clicks Apr
handleMonthClick(3);
