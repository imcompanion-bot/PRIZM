import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Exclude dead stages from flaggedProjects
code = code.replace(
  '    const result = projects.map(p => {\n      const flags: string[] = [];',
  '    const result = projects.map(p => {\n      if (p.stage === "Churned" || p.stage === "Closed Lost") return { ...p, flags: [], allFlags: [], review: null };\n      const flags: string[] = [];'
);

// 2. Fix stages dropdown logic to respect the 30 day rule
code = code.replace(
  `  const stages = useMemo(() => {
    const set = new Set<string>();
    flaggedProjects.forEach(p => p.stage && set.add(p.stage));
        const order = ["Closed Won", "Committed", "Negotiation", "Pitch", "Brief", "Speculative"];`,
  `  const stages = useMemo(() => {
    const set = new Set<string>();
    const today = new Date();
    const cutoffStr = format(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    flaggedProjects.forEach(p => {
      if (p.end_date && p.end_date >= cutoffStr && p.stage) {
        set.add(p.stage);
      }
    });
    const order = ["Closed Won", "Committed", "Negotiation", "Pitch", "Brief", "Speculative"];`
);

fs.writeFileSync(file, code);
