import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add imports
code = code.replace(
  'import { Textarea } from "@/components/ui/textarea";',
  'import { Textarea } from "@/components/ui/textarea";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Checkbox } from "@/components/ui/checkbox";'
);

// Add state
code = code.replace(
  '  const [selectedClient, setSelectedClient] = useState<string>("All Clients");',
  '  const [selectedClient, setSelectedClient] = useState<string>("All Clients");\n  const [selectedStages, setSelectedStages] = useState<string[]>([]);'
);

// Add stages memo before filteredProjects
code = code.replace(
  '  const filteredProjects = useMemo(() => {',
  `  const stages = useMemo(() => {
    const set = new Set<string>();
    flaggedProjects.forEach(p => p.stage && set.add(p.stage));
    return Array.from(set).sort();
  }, [flaggedProjects]);

  const filteredProjects = useMemo(() => {`
);

// Update filteredProjects logic
code = code.replace(
  '      if (selectedClient !== "All Clients" && pClient !== selectedClient) return false;\n      return true;',
  '      if (selectedClient !== "All Clients" && pClient !== selectedClient) return false;\n      if (selectedStages.length > 0 && (!p.stage || !selectedStages.includes(p.stage))) return false;\n      return true;'
);

// Add the stages to the dependency array
code = code.replace(
  '  }, [flaggedProjects, selectedOffice, selectedClient]);',
  '  }, [flaggedProjects, selectedOffice, selectedClient, selectedStages]);'
);

// Add the popover UI next to the selectedClient select
code = code.replace(
  '            </SelectContent>\n          </Select>\n        </div>',
  `            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between text-left font-normal bg-white">
                {selectedStages.length === 0 ? "All Stages" : \`\${selectedStages.length} Stages Selected\`}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="end">
              <div className="flex p-2 border-b gap-2 justify-between bg-slate-50 rounded-t-md">
                <Button variant="ghost" size="sm" onClick={() => setSelectedStages(stages)} className="text-xs h-7 flex-1 border border-slate-200 bg-white shadow-sm">Select All</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStages([])} className="text-xs h-7 flex-1 border border-slate-200 bg-white shadow-sm">Clear All</Button>
              </div>
              <div className="max-h-[300px] overflow-auto p-2">
                {stages.map(stage => (
                  <label key={stage} className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 cursor-pointer rounded transition-colors">
                    <Checkbox 
                      checked={selectedStages.includes(stage)} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStages([...selectedStages, stage]);
                        } else {
                          setSelectedStages(selectedStages.filter(s => s !== stage));
                        }
                      }} 
                    />
                    <span className="text-sm font-medium text-slate-700">{stage}</span>
                  </label>
                ))}
                {stages.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-500">No stages found</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>`
);

fs.writeFileSync(file, code);
