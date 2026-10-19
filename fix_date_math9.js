const strVal = "Feb";
const shortMatch = strVal.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+1)?$/i);
console.log(shortMatch);
