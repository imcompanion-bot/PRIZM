import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<li><strong>RTB & Talent Savings:</strong> Margin should be 100%.</li>',
  '<li><strong>RTB & Talent Savings:</strong> Margin should be 100%.</li>\n                  <li><strong>Budgets:</strong> Net Budget is strictly greater than Gross Budget.</li>'
);

fs.writeFileSync(file, code);
