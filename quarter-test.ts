function getMostRecentlyCompletedQuarter(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0=Jan, 11=Dec)

  // FY runs May (4) to April (3)
  let completedQ = "";
  let fyYear1 = 0;
  let fyYear2 = 0;

  if (month >= 7 && month <= 9) { // Aug, Sep, Oct -> Q2, recently completed is Q1 (May-Jul)
    completedQ = "Q1";
    fyYear1 = year;
    fyYear2 = year + 1;
  } else if (month >= 10 || month === 0) { // Nov, Dec, Jan -> Q3, recently completed is Q2 (Aug-Oct)
    completedQ = "Q2";
    fyYear1 = month === 0 ? year - 1 : year;
    fyYear2 = fyYear1 + 1;
  } else if (month >= 1 && month <= 3) { // Feb, Mar, Apr -> Q4, recently completed is Q3 (Nov-Jan)
    completedQ = "Q3";
    fyYear1 = year - 1;
    fyYear2 = year;
  } else if (month >= 4 && month <= 6) { // May, Jun, Jul -> Q1, recently completed is Q4 (Feb-Apr)
    completedQ = "Q4";
    fyYear1 = year - 1;
    fyYear2 = year;
  }

  const yr1Str = fyYear1.toString().slice(-2);
  const yr2Str = fyYear2.toString().slice(-2);

  return `${completedQ} ${yr1Str}/${yr2Str}`;
}

console.log(getMostRecentlyCompletedQuarter(new Date(2026, 8, 9))); // Sep 2026 -> Q1 26/27
console.log(getMostRecentlyCompletedQuarter(new Date(2026, 0, 15))); // Jan 2026 -> Q2 25/26
console.log(getMostRecentlyCompletedQuarter(new Date(2026, 1, 15))); // Feb 2026 -> Q3 25/26
console.log(getMostRecentlyCompletedQuarter(new Date(2026, 4, 15))); // May 2026 -> Q4 25/26
console.log(getMostRecentlyCompletedQuarter(new Date(2026, 10, 15))); // Nov 2026 -> Q2 26/27
