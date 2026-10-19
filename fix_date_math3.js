// Ah! In PRIZM, Q4 25/26 is Jan/Feb/Mar/Apr 2026.
// But the spreadsheet has Q1 26/27 as April?? No, Q4 is Feb/Mar/Apr. Let me check the screenshot!
// Screenshot says: Q4 25/26 = Jan, Feb, Mar, Apr. Wait, Q4 is Jan, Feb, Mar, Apr in the screenshot!
// Q1 26/27 is May, Jun, Jul.
// But Apr is 2026, and May is 2026!
// My script:
// Apr (m=3) < 4, so it uses endYear of Q4 25/26 which is 2026. Correct!
// May (m=4) >= 4, so it uses startYear of Q1 26/27 which is 2026. Correct!

const rows = [
  ['Q4 25/26', 'Q4 25/26', 'Q1 26/27', 'Q1 26/27'],
  ['Mar 1', 'Apr 1', 'May 1', 'Jun 1']
];

for (let j=0; j<4; j++) {
   const monthStr = rows[1][j].split(' ')[0];
   const parentVal = rows[0][j];
   const fyMatch = parentVal.match(/(\d{2})\/(\d{2})/);
   const startYear = 2000 + parseInt(fyMatch[1]);
   const endYear = 2000 + parseInt(fyMatch[2]);
   const m = new Date(`${monthStr} 1, 2000`).getMonth();
   const year = (m >= 4) ? startYear : endYear;
   console.log(parentVal, monthStr, year);
}
