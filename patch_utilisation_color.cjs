const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/time-tracking/UtilisationTab.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Tooltip imports if not present, and rename recharts Tooltip to RechartsTooltip
if (content.includes('Tooltip, ResponsiveContainer')) {
  content = content.replace(
    'Tooltip, ResponsiveContainer',
    'Tooltip as RechartsTooltip, ResponsiveContainer'
  );
  content = content.replace(
    /import \{ Badge \} from "@\/components\/ui\/badge";/,
    'import { Badge } from "@/components/ui/badge";\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";'
  );
}

// 2. Add the color helper function before the component
const helperFn = `
function getUtilisationColorClass(utilisation: number, expected: number) {
  if (utilisation >= expected) return "bg-green-100 text-green-900";
  if (utilisation >= expected - 5) return "bg-yellow-100 text-yellow-900";
  return "bg-red-100 text-red-800";
}

`;

if (!content.includes('getUtilisationColorClass')) {
  content = content.replace(
    'const UtilisationTab = ({ startDate, endDate, officeFilter, showFormer }: UtilisationTabProps) => {',
    helperFn + 'const UtilisationTab = ({ startDate, endDate, officeFilter, showFormer }: UtilisationTabProps) => {'
  );
}

// 3. Replace the Team row utilisation rendering
const teamRowTarget = `<TableCell>
                        <span className={cn("text-sm font-medium px-1.5 py-0.5 rounded", utilisation >= expectedUtilisation - 5 ? "bg-green-100 text-green-900" : utilisation >= expectedUtilisation - 10 ? "bg-red-100 text-red-800" : "bg-red-200 text-red-900")}>
                          {fmt(utilisation)}%
                        </span>
                        <span className="text-sm text-muted-foreground"> / {fmt(expectedUtilisation)}%</span>
                      </TableCell>`;

const teamRowReplacement = `<TableCell>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <span className={cn("text-sm font-medium px-1.5 py-0.5 rounded cursor-help", getUtilisationColorClass(utilisation, expectedUtilisation))}>
                                {fmt(utilisation)}%
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Expected: {fmt(expectedUtilisation)}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>`;

content = content.replace(teamRowTarget, teamRowReplacement);


// 4. Replace the Person row utilisation rendering
const personRowTarget = `<TableCell>
                            <span className={cn("text-sm px-1.5 py-0.5 rounded", m.utilisation >= m.expectedUtilisation - 5 ? "bg-green-100 text-green-900" : m.utilisation >= m.expectedUtilisation - 10 ? "bg-red-100 text-red-800" : "bg-red-200 text-red-900")}>
                              {fmt(m.utilisation)}%
                            </span>
                            <span className="text-sm text-muted-foreground"> / {fmt(m.expectedUtilisation)}%</span>
                          </TableCell>`;

const personRowReplacement = `<TableCell>
                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <span className={cn("text-sm px-1.5 py-0.5 rounded cursor-help", getUtilisationColorClass(m.utilisation, m.expectedUtilisation))}>
                                    {fmt(m.utilisation)}%
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Expected: {fmt(m.expectedUtilisation)}%</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>`;

content = content.replace(personRowTarget, personRowReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched utilisation coloring successfully.");
