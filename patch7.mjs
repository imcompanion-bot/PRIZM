import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '// 3. Missing data',
  `// 2.5 Net Budget > Gross Budget
        const currency = p.extra_data?.project_currency || "GBP";
        const isGBP = currency === "GBP";
        const exchangeRate = (!isGBP && p.extra_data?.project_currency_revenue && p.revenue) ? (p.extra_data.project_currency_revenue / p.revenue) : 1;
        const netBudgetLocal = (p.budget_cost !== null && p.budget_cost !== undefined) ? p.budget_cost * exchangeRate : null;
        const grossBudgetLocal = p.extra_data?.project_currency_gross_budget;
        
        if (netBudgetLocal !== null && grossBudgetLocal !== null && grossBudgetLocal !== undefined) {
          if (netBudgetLocal > grossBudgetLocal + 1) { // 1 unit leeway for rounding errors
            flags.push(\`Net Budget (\${formatCurrency(netBudgetLocal, currency)}) > Gross Budget (\${formatCurrency(grossBudgetLocal, currency)})\`);
          }
        }

        // 3. Missing data`
);

fs.writeFileSync(file, code);
