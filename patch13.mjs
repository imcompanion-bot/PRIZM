import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `    const order = ["Closed Won", "Committed", "Negotiation", "Pitch", "Brief", "Speculative"];
    return Array.from(set).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });`;

code = code.replace(
  'return Array.from(set).sort();',
  replacement
);

fs.writeFileSync(file, code);
