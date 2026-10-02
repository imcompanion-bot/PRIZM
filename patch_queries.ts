const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/ProfitabilityPage.tsx');
let content = fs.readFileSync(file, 'utf8');

const queryCode = `
  const { data: utilisationSummaryMonthly = [] } = useQuery({
    queryKey: ["profitability_utilisation_summary_monthly", cutoffDate, endDateStr],
    staleTime: 5 * 60 * 1000,
    enabled: monthlyCosts.length > 0,
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase.rpc("get_utilisation_summary_monthly", {
          _start_date: cutoffDate,
          _end_date: endDateStr
        })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allData = allData.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      return allData as { person_id: string; project_id: string | null; month_date: string; total_hours: number; leave_hours: number }[];
    }
  });
`;

content = content.replace(
  /const { data: utilisationSummary = \[\] } = useQuery\({[\s\S]*?return allData as [^;]*;\n    }\n  }\);/g,
  match => match + "\n" + queryCode
);

fs.writeFileSync(file, content, 'utf8');
