// If the sync didn't update to the de-risked numbers, it means the spreadsheet headers for the de-risked columns are slightly different than what I am trying to match, or the deduplication logic is failing.

const rows = [
  ['Client', 'Opportunity Name', 'Stage', 'Office', 'FY 25/26', 'FY 26/27', 'Q3 25/26', 'Q3 25/26', 'Q3 25/26', 'Q4 25/26', 'Q4 25/26', 'Q4 25/26', 'Q1 26/27', 'Q1 26/27', 'Q1 26/27'],
  ['', '', '', '', '', '', 'Oct 1', 'Nov 1', 'Dec 1', 'Jan 1', 'Feb 1', 'Mar 1', 'Apr 1', 'May 1', 'Jun 1']
];

const uniqueMonths = new Map();
uniqueMonths.set('2026-02-01', { colIdx: 15, monthDate: '2026-02-01' }); // Gross
uniqueMonths.set('2026-02-01', { colIdx: 120, monthDate: '2026-02-01' }); // De-risked
console.log(Array.from(uniqueMonths.values()));
