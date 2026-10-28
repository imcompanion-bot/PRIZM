import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const newRuleDoc = `                  <li><strong>Stale Pipeline:</strong> Project start date is more than 2 weeks in the past, but the project is not marked as Committed or Closed Won.</li>
                  <li><strong>Speculative:</strong> Any project in 'Speculative' stage where the RTB or Project start date is in the past or next 2 weeks.</li>`;

code = code.replace(
  '<li><strong>Stale Pipeline:</strong> Project start date is more than 2 weeks in the past, but the project is not marked as Committed or Closed Won.</li>',
  newRuleDoc
);

fs.writeFileSync(file, code);
