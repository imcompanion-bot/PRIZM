import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '        <div>\n          <h1 className="text-3xl font-bold tracking-tight">WIP Tracker</h1>\n          <p className="text-muted-foreground mt-2">Flagging projects that require financial review or missing data</p>\n        </div>',
  '        <div>\n          <h1 className="text-3xl font-bold tracking-tight">WIP Tracker</h1>\n        </div>'
);

fs.writeFileSync(file, code);
