const monthCols = [
  { colIdx: 4, monthDate: '2026-02-01' },
  { colIdx: 92, monthDate: '2026-02-01' },
  { colIdx: 93, monthDate: '2026-03-01' }
];

// Deduplicate, keeping the highest colIdx
const uniqueMonths = new Map();
for (const mc of monthCols) {
    uniqueMonths.set(mc.monthDate, mc);
}
const finalMonthCols = Array.from(uniqueMonths.values());
console.log(finalMonthCols);
