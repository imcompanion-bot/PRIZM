const monthStr = "Apr";
const parentVal = "Q4 25/26"; // My script extracted Apr as Q1 26/27. Wait! In my test script `rows[0]` I had:
// 'Q4 25/26', 'Q4 25/26', 'Q4 25/26', 'Q1 26/27', 'Q1 26/27', 'Q1 26/27'
// 'Jan 1', 'Feb 1', 'Mar 1', 'Apr 1', 'May 1', 'Jun 1'
// If Apr 1 is under Q1 26/27, it becomes 2027!!
// BUT wait, Q4 usually includes Apr! Look at the screenshot!
// The screenshot shows Q4 25/26 covers Feb 1, Mar 1, Apr 1.
// And Q1 26/27 covers May 1, Jun 1, Jul 1.
// So in the REAL data, Apr is under Q4 25/26. So it becomes 2026.
