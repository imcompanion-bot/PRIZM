const rows = [
  ['Client', 'Opportunity Name', 'Stage', 'Office', 'FY 25/26', 'FY 26/27', 'Q3 25/26', 'Q3 25/26', 'Q3 25/26', 'Q4 25/26', 'Q4 25/26', 'Q4 25/26', 'Q1 26/27', 'Q1 26/27', 'Q1 26/27'],
  ['', '', '', '', '', '', 'Oct 1', 'Nov 1', 'Dec 1', 'Jan 1', 'Feb 1', 'Mar 1', 'Apr 1', 'May 1', 'Jun 1']
];

const headerRowIdx = 1;
const rawMonthCols = [];
const headers = rows[headerRowIdx];
const parentHeaders = headerRowIdx > 0 ? rows[headerRowIdx - 1] : [];

for (let j = 0; j < headers.length; j++) {
   const val = headers[j];
   if (!val) continue;
   
   const strVal = String(val).trim();
   
   // Handle headers like "Feb 1" or "Feb" by looking at the parent header (e.g., "Q4 25/26")
   const shortMatch = strVal.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+1)?$/i);
   if (shortMatch) {
       const monthStr = shortMatch[1];
       const parentVal = parentHeaders[j] ? String(parentHeaders[j]).trim() : "";
       const fyMatch = parentVal.match(/(\d{2})\/(\d{2})/);
       if (fyMatch) {
           const startYear = 2000 + parseInt(fyMatch[1]);
           const endYear = 2000 + parseInt(fyMatch[2]);
           // FY runs May to April
           const m = new Date(`${monthStr} 1, 2000`).getMonth();
           const year = (m >= 4) ? startYear : endYear;
           const d = new Date(`${monthStr} 1, ${year}`);
           if (!isNaN(d.getTime())) {
               rawMonthCols.push({ colIdx: j, monthDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`});
               continue;
           }
       }
   }
}

const uniqueMonths = new Map();
for (const mc of rawMonthCols) {
    uniqueMonths.set(mc.monthDate, mc);
}
const monthCols = Array.from(uniqueMonths.values());

console.log(monthCols);
