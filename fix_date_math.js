const monthStr = "Apr";
const startYear = 2025;
const endYear = 2026;

// FY runs May to April.
// So May-Dec are in startYear
// Jan-Apr are in endYear
const m = new Date(`${monthStr} 1, 2000`).getMonth(); // Apr -> 3
// m >= 4 means May or later
const year = (m >= 4) ? startYear : endYear;
console.log(monthStr, m, year);
