import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '{selectedFlags.length > 0 && (\\n                <div className="space-y-4 bg-slate-50 p-3 rounded-md border border-slate-100">',
  '{dismissDialog?.project?.flags?.length > 0 && (\\n                <div className="space-y-4 bg-slate-50 p-3 rounded-md border border-slate-100">'
);
// fallback
code = code.replace(
  '{selectedFlags.length > 0 && (',
  '{dismissDialog?.project?.flags?.length > 0 && ('
);
fs.writeFileSync(file, code);
