const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/FeeCalculatorPage.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add props to Section component
content = content.replace(
  `  insight?: { label: string; ratio: number; projectCount: number } | null;\n}) {\n  const [open, setOpen] = useState(enabled);\n\n  // Auto-open when toggled on\n  useEffect(() => {\n    if (enabled) setOpen(true);\n  }, [enabled]);\n\n  return (\n    <Collapsible open={open && enabled} onOpenChange={setOpen}>`,
  `  insight?: { label: string; ratio: number; projectCount: number } | null;\n  uncollapsible?: boolean;\n  expandSignal?: number;\n  collapseSignal?: number;\n}) {\n  const [open, setOpen] = useState(enabled);\n\n  useEffect(() => {\n    if (enabled) setOpen(true);\n  }, [enabled]);\n\n  useEffect(() => {\n    if (expandSignal && expandSignal > 0) setOpen(true);\n  }, [expandSignal]);\n\n  useEffect(() => {\n    if (collapseSignal && collapseSignal > 0 && !uncollapsible) setOpen(false);\n  }, [collapseSignal]);\n\n  return (\n    <Collapsible open={uncollapsible ? true : (open && enabled)} onOpenChange={setOpen}>`
);

// 2. Hide trigger in Section
content = content.replace(
  `          <CollapsibleTrigger asChild>\n            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!enabled}>\n              {open && enabled ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}\n            </Button>\n          </CollapsibleTrigger>`,
  `          {!uncollapsible && (\n            <CollapsibleTrigger asChild>\n              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!enabled}>\n                {open && enabled ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}\n              </Button>\n            </CollapsibleTrigger>\n          )}`
);

// 3. Add states to FeeCalculatorPageInner
content = content.replace(
  `  const [appliedRecs, setAppliedRecs] = useState<Recommendation[]>([]);\n\n  const updateSection = <K extends keyof FeeCalcState["sections"]>(`,
  `  const [appliedRecs, setAppliedRecs] = useState<Recommendation[]>([]);\n  const [expandAllSignal, setExpandAllSignal] = useState(0);\n  const [collapseAllSignal, setCollapseAllSignal] = useState(0);\n  const [isAllCollapsed, setIsAllCollapsed] = useState(false);\n\n  const updateSection = <K extends keyof FeeCalcState["sections"]>(`
);

// 4. Update Overview section and add Collapse All button
content = content.replace(
  `        {/* Step 1: Project Setup */}\n          <Section icon={Settings2} title="Overview" enabled={true} onToggle={() => {}} alwaysOn>`,
  `        {/* Step 1: Project Setup */}\n          <Section icon={Settings2} title="Overview" enabled={true} onToggle={() => {}} alwaysOn uncollapsible>`
);

content = content.replace(
  `          </Section>\n        {/* Step 2: Services */}`,
  `          </Section>\n\n          <div className="flex justify-end my-2">\n            <Button \n              variant="outline" \n              size="sm"\n              className="text-xs h-8"\n              onClick={() => {\n                if (isAllCollapsed) {\n                  setExpandAllSignal(s => s + 1);\n                  setIsAllCollapsed(false);\n                } else {\n                  setCollapseAllSignal(s => s + 1);\n                  setIsAllCollapsed(true);\n                }\n              }}\n            >\n              {isAllCollapsed ? "Expand All" : "Collapse All"}\n            </Button>\n          </div>\n\n        {/* Step 2: Services */}`
);

// 5. Add expandSignal and collapseSignal to all other sections
content = content.replace(/insight=\{getInsight\((.*?)\)\}/g, 'insight={getInsight($1)}\n              expandSignal={expandAllSignal}\n              collapseSignal={collapseAllSignal}');

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
