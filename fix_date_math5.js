const rows = [
  ['Q3 25/26', 'Q3 25/26', 'Q3 25/26', 'Q4 25/26', 'Q4 25/26', 'Q4 25/26', 'Q1 26/27', 'Q1 26/27', 'Q1 26/27'],
  ['Oct 1', 'Nov 1', 'Dec 1', 'Jan 1', 'Feb 1', 'Mar 1', 'Apr 1', 'May 1', 'Jun 1']
];

// Q1 = May, Jun, Jul  -> startYear
// Q2 = Aug, Sep, Oct  -> startYear
// Q3 = Nov, Dec, Jan  -> Nov,Dec(startYear), Jan(endYear)
// Q4 = Feb, Mar, Apr  -> endYear

for (let j=0; j<9; j++) {
   const monthStr = rows[1][j].split(' ')[0];
   const parentVal = rows[0][j];
   
   // Actually, the simplest way is to look at the Q!
   // Or better yet: wait, Q4 25/26 has Jan, Feb, Mar in the sheet.
   // But my screenshot says Q4 25/26 is Jan, Feb, Mar, Apr ?
   // Let's just trust the FY! 25/26 means 2025/2026.
   // Wait, my output was `Q1 26/27 Apr 2027`. That's wrong! Apr should be 2027 if it's in 26/27?
   // No, 26/27 runs May 2026 to April 2027. So April IS 2027. That is correct!
}
