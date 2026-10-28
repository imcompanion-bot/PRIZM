import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add initialization logic
code = code.replace(
  'const [selectedStages, setSelectedStages] = useState<string[]>([]);',
  'const [selectedStages, setSelectedStages] = useState<string[]>([]);\n  const [isStagesInitialized, setIsStagesInitialized] = useState(false);'
);

code = code.replace(
  '  const filteredProjects = useMemo(() => {',
  `  React.useEffect(() => {
    if (!isStagesInitialized && stages.length > 0) {
      setSelectedStages(stages);
      setIsStagesInitialized(true);
    }
  }, [stages, isStagesInitialized]);

  const filteredProjects = useMemo(() => {`
);

// 2. Modify filtering logic
// Now that selectedStages tracks all selected stages, if it's empty, we show nothing (or show all? If clear all is pressed, they want to clear everything and select what they want)
code = code.replace(
  '      if (selectedStages.length > 0 && (!p.stage || !selectedStages.includes(p.stage))) return false;',
  '      if (isStagesInitialized && (!p.stage || !selectedStages.includes(p.stage))) return false;'
);

// 3. Update the Popover button text and remove bg-white
code = code.replace(
  '<Button variant="outline" className="w-[200px] justify-between text-left font-normal bg-white">',
  '<Button variant="outline" className="w-[200px] justify-between text-left font-normal bg-transparent">'
);

code = code.replace(
  '{selectedStages.length === 0 ? "All Stages" : `${selectedStages.length} Stages Selected`}',
  '{selectedStages.length === stages.length && stages.length > 0 ? "All Stages" : `${selectedStages.length} Stages Selected`}'
);

fs.writeFileSync(file, code);
