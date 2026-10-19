const strVal = "Feb 1";
const parentVal = "Q4 25/26 ";
const shortMatch = strVal.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+1)?$/i);
console.log(shortMatch);
