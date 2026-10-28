import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(amount);',
  'return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(amount);'
);

fs.writeFileSync(file, code);
