const strVal = "Feb 1";
const parentHeaders = ["", "", "", "Q4 25/26"];
const j = 3;
const shortMatch = strVal.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+1)?$/i);
const monthStr = shortMatch[1];
const parentVal = parentHeaders[j] ? String(parentHeaders[j]).trim() : "";
const fyMatch = parentVal.match(/(\d{2})\/(\d{2})/);
const startYear = 2000 + parseInt(fyMatch[1]);
const endYear = 2000 + parseInt(fyMatch[2]);
const m = new Date(`${monthStr} 1, 2000`).getMonth();
const year = (m >= 4) ? startYear : endYear;

console.log(year);
