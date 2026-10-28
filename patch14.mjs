import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const newRule = `        // 1.5 Speculative project starting soon
        const twoWeeksFromNowStr = format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        if (p.stage === 'Speculative') {
          if ((p.start_date && p.start_date <= twoWeeksFromNowStr) || (p.extra_data?.rtb_start_date && p.extra_data.rtb_start_date <= twoWeeksFromNowStr)) {
            flags.push("Speculative project with start date in past or next 2 weeks");
          }
        }`;

code = code.replace(
  '        // 2. Margin out of bounds based on record type',
  newRule + '\n\n        // 2. Margin out of bounds based on record type'
);

// Also add to the "What gets flagged?" section at the bottom
const newRuleDoc = `                  <li><strong>Dates:</strong> Any project where the start date passed over 2 weeks ago but is not Committed or Won.</li>
                  <li><strong>Speculative:</strong> Any project in 'Speculative' stage where the RTB or Project start date is in the past or next 2 weeks.</li>`;

code = code.replace(
  '<li><strong>Dates:</strong> Any project where the start date passed over 2 weeks ago but is not Committed or Won.</li>',
  newRuleDoc
);

fs.writeFileSync(file, code);
