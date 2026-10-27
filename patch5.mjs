import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<span className="text-muted-foreground inline-block w-24">',
  '<span className="text-muted-foreground inline-block w-24 flex-shrink-0">'
);
code = code.replace(
  '<div><span className="text-muted-foreground inline-block w-24">RTB Dates:</span> <span>{formatDateRange(p.extra_data?.rtb_start_date, p.extra_data?.rtb_end_date)}</span></div>',
  '<div className="flex"><span className="text-muted-foreground inline-block w-[90px] flex-shrink-0">RTB Dates:</span> <span className="truncate">{formatDateRange(p.extra_data?.rtb_start_date, p.extra_data?.rtb_end_date)}</span></div>'
);
code = code.replace(
  '<div><span className="text-muted-foreground inline-block w-24">Project Dates:</span> <span>{formatDateRange(p.start_date, p.end_date)}</span></div>',
  '<div className="flex"><span className="text-muted-foreground inline-block w-[90px] flex-shrink-0">Proj Dates:</span> <span className="truncate">{formatDateRange(p.start_date, p.end_date)}</span></div>'
);
code = code.replace(
  '<div><span className="text-muted-foreground inline-block w-24">Price:</span> <span className="font-medium">{formatCurrency(projCurrencyRevenue, currency)}</span></div>',
  '<div className="flex"><span className="text-muted-foreground inline-block w-[90px] flex-shrink-0">Price:</span> <span className="font-medium truncate">{formatCurrency(projCurrencyRevenue, currency)}</span></div>'
);
code = code.replace(
  '<div><span className="text-muted-foreground inline-block w-24">Gross Profit:</span> <span>{formatCurrency(grossProfit, currency)}</span></div>',
  '<div className="flex"><span className="text-muted-foreground inline-block w-[90px] flex-shrink-0">Gross Profit:</span> <span className="truncate">{formatCurrency(grossProfit, currency)}</span></div>'
);
code = code.replace(
  '<div><span className="text-muted-foreground inline-block w-24">GP Margin:</span> <span>{margin !== null ? `${(margin * 100).toFixed(1)}%` : "-"}</span></div>',
  '<div className="flex"><span className="text-muted-foreground inline-block w-[90px] flex-shrink-0">GP Margin:</span> <span className="truncate">{margin !== null ? `${(margin * 100).toFixed(1)}%` : "-"}</span></div>'
);


fs.writeFileSync(file, code);
