const parentVal = "Q3 25/26";
const fyMatch = parentVal.match(/(\d{2})\/(\d{2})/);
const startYear = 2000 + parseInt(fyMatch[1]);
const endYear = 2000 + parseInt(fyMatch[2]);
console.log(startYear, endYear);

const rows = [
  ['Q3 25/26', 'Q3 25/26', 'Q3 25/26', 'Q4 25/26', 'Q4 25/26', 'Q4 25/26', 'Q1 26/27', 'Q1 26/27', 'Q1 26/27'],
  ['Oct 1', 'Nov 1', 'Dec 1', 'Jan 1', 'Feb 1', 'Mar 1', 'Apr 1', 'May 1', 'Jun 1']
];

for (let j=0; j<9; j++) {
   const monthStr = rows[1][j].split(' ')[0];
   const parentVal = rows[0][j];
   const fyMatch = parentVal.match(/(\d{2})\/(\d{2})/);
   const startYear = 2000 + parseInt(fyMatch[1]);
   const endYear = 2000 + parseInt(fyMatch[2]);
   // In FY (May-April)
   // May(4) to Dec(11) = startYear
   // Jan(0) to Apr(3) = endYear
   const m = new Date(`${monthStr} 1, 2000`).getMonth();
   const year = (m >= 4) ? startYear : endYear;
   console.log(parentVal, monthStr, year);
}
