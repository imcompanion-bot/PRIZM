const monthStr = "Apr";
const parentVal = "Q1 26/27"; // This means April should be 2027!
const fyMatch = parentVal.match(/(\d{2})\/(\d{2})/);
const startYear = 2000 + parseInt(fyMatch[1]); // 2026
const endYear = 2000 + parseInt(fyMatch[2]); // 2027

const m = new Date(`${monthStr} 1, 2000`).getMonth();
const year = (m >= 4) ? startYear : endYear;
console.log(monthStr, m, year);
