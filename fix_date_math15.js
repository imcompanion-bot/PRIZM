const strVal = "1929.527808";
const amount = parseFloat(String(strVal).replace(/,/g, "").replace(/£|\$|€|%/g, ""));
console.log(amount);
