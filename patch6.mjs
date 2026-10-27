import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<div><span className="text-muted-foreground inline-block w-24 flex-shrink-0">RTB Dates:</span> <span>{formatDateRange(p.extra_data?.rtb_start_date, p.extra_data?.rtb_end_date)}</span></div>',
  '<div className="flex"><span className="text-muted-foreground inline-block w-[90px] flex-shrink-0">RTB Dates:</span> <span className="truncate">{formatDateRange(p.extra_data?.rtb_start_date, p.extra_data?.rtb_end_date)}</span></div>'
);

code = code.replace(
  '<TableHead className="w-[300px]">Project</TableHead>\n                  <TableHead className="w-[280px]">Key Info</TableHead>',
  '<TableHead className="w-[280px]">Project</TableHead>\n                  <TableHead className="w-[280px]">Key Info</TableHead>'
);


fs.writeFileSync(file, code);
