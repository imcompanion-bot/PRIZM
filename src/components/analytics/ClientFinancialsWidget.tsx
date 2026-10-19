import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatCurrencyCompact } from "@/lib/calculations";
import * as RechartsPrimitive from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getMonthlyBatchFxRates } from "@/lib/fx";

type OfficeFilter = "Global" | "UK" | "US";
type MetricType = "gp" | "te" | "af";

function FilterToggleGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border-border p-0 bg-black/5 items-stretch border-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            value === opt.value
              ? "bg-[#4b70d8] text-white shadow-sm"
              : "text-slate-700 hover:bg-black/5"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function getFYForDate(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  if (m >= 5) {
    return `fy${y.toString().slice(-2)}_${(y + 1).toString().slice(-2)}`;
  } else {
    return `fy${(y - 1).toString().slice(-2)}_${y.toString().slice(-2)}`;
  }
}

export function ClientFinancialsWidget({ 
  officeFilter, 
  displayCurrency 
}: { 
  officeFilter: OfficeFilter; 
  displayCurrency: "GBP" | "USD";
}) {
  const [metric, setMetric] = useState<MetricType>("gp");
  const [activeFy, setActiveFy] = useState("fy25_26");
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [localOfficeFilter, setLocalOfficeFilter] = useState<OfficeFilter>(officeFilter);
  const effectiveCurrency = localOfficeFilter === "US" ? "USD" : localOfficeFilter === "UK" ? "GBP" : displayCurrency;

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["dashboard-client-financials-projects"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("projects")
          .select("id, ultimate_parent, sf_account, gp_full_value, start_date, extra_data, office, fx_rate_gbp, fx_rate_usd, title")
          .order("id")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    }
  });

  const { data: tes = [], isLoading: isLoadingTes } = useQuery({
    queryKey: ["dashboard-client-financials-tes"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("talent_efficiencies")
          .select("*")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    }
  });
  const { data: monthlyFxRates = {}, isLoading: isLoadingFx } = useQuery({
    queryKey: ["dashboard-client-financials-fx"],
    queryFn: () => getMonthlyBatchFxRates("2020-05-01", "2027-04-30"),
    staleTime: Infinity,
  });

  const displayData = useMemo(() => {
    if (!projects.length) return { top10: [], othersValue: 0, totalValue: 0, priorFy: "" };

    // Pre-calculate FY average rates
    const getFyRate = (fyKey: string) => {
       const parts = fyKey.replace("fy", "").split("_");
       if (parts.length !== 2) return 1.27;
       const y1 = parseInt(parts[0], 10);
       const y2 = parseInt(parts[1], 10);
       
       let sum = 0;
       let count = 0;
       // Loop through May of year1 to April of year2
       for (let m = 5; m <= 12; m++) {
          const mStr = m.toString().padStart(2, '0');
          const rate = monthlyFxRates[`20${y1}-${mStr}-01`];
          if (rate) { sum += rate; count++; }
       }
       for (let m = 1; m <= 4; m++) {
          const mStr = m.toString().padStart(2, '0');
          const rate = monthlyFxRates[`20${y2}-${mStr}-01`];
          if (rate) { sum += rate; count++; }
       }
       return count > 0 ? sum / count : 1.27;
    };

    const parts = activeFy.replace("fy", "").split("_");
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);
    const priorFy = `fy${y1 - 1}_${y2 - 1}`;

    const fyRateActive = getFyRate(activeFy);
    const fyRatePrior = getFyRate(priorFy);

    const clientData: Record<string, { gpActive: number, gpPrior: number, teActive: number, tePrior: number }> = {};
    const projectOfficeMap = new Map<string, { office: string, client: string }>();

    for (const p of projects) {
      const client = p.ultimate_parent || p.sf_account || "Unknown Client";
      if (!clientData[client]) {
        clientData[client] = { gpActive: 0, gpPrior: 0, teActive: 0, tePrior: 0 };
      }
      if (p.title) {
        const cleanName = p.title.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
        projectOfficeMap.set(cleanName, { office: p.office, client });
      }

      const o = p.office?.toUpperCase() || "";
      let matchesOffice = false;
      if (localOfficeFilter === "Global") matchesOffice = true;
      else if (localOfficeFilter === "UK") matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
      else if (localOfficeFilter === "US") matchesOffice = (o === "US" || o === "UNITED STATES");
      
      if (!matchesOffice) continue;

      const ext = (p.extra_data || {}) as Record<string, any>;
      
      const processGp = (fyKey: string, rate: number) => {
        const val = Number(ext[`gp_${fyKey}`]) || 0;
        let converted = val;
        if (effectiveCurrency === "USD" && o !== "US" && o !== "UNITED STATES") converted = val * rate;
        else if (effectiveCurrency === "GBP" && (o === "US" || o === "UNITED STATES")) converted = val / rate;
        return converted;
      };

      clientData[client].gpActive += processGp(activeFy, fyRateActive);
      clientData[client].gpPrior += processGp(priorFy, fyRatePrior);
    }

    for (const eff of tes) {
      const oppName = eff.opportunity_name || "Unknown Opportunity";
      const cleanName = oppName.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
      
      const mapInfo = projectOfficeMap.get(cleanName);
      let effOffice = eff.office;
      let client = "Unknown Client";
      
      if (mapInfo) {
        if (!effOffice || effOffice === "Unknown") effOffice = mapInfo.office;
        client = mapInfo.client;
      }
      
      if (!clientData[client]) {
        clientData[client] = { gpActive: 0, gpPrior: 0, teActive: 0, tePrior: 0 };
      }

      const o = effOffice?.toUpperCase() || "";
      let matchesOffice = false;
      if (localOfficeFilter === "Global") matchesOffice = true;
      else if (localOfficeFilter === "UK") matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
      else if (localOfficeFilter === "US") matchesOffice = (o === "US" || o === "UNITED STATES");
      
      if (!matchesOffice) continue;

      const fy = getFYForDate(eff.month_date);
      if (!fy) continue;

      let displayAmount = Number(eff.amount) || 0;
      const mDateStr = eff.month_date ? (eff.month_date.slice(0, 7) + "-01") : null;
      const monthRate = mDateStr ? (monthlyFxRates[mDateStr] || 1.27) : 1.27;

      if (effectiveCurrency === "USD" && o !== "US" && o !== "UNITED STATES") displayAmount *= monthRate;
      else if (effectiveCurrency === "GBP" && (o === "US" || o === "UNITED STATES")) displayAmount /= monthRate;

      if (fy === activeFy) clientData[client].teActive += displayAmount;
      if (fy === priorFy) clientData[client].tePrior += displayAmount;
    }

    const compiled = Object.entries(clientData).map(([client, data]) => {
      const afActive = data.gpActive - data.teActive;
      const afPrior = data.gpPrior - data.tePrior;

      let activeVal = 0;
      let priorVal = 0;
      
      if (metric === "gp") {
        activeVal = data.gpActive;
        priorVal = data.gpPrior;
      } else if (metric === "te") {
        activeVal = data.teActive;
        priorVal = data.tePrior;
      } else {
        activeVal = afActive;
        priorVal = afPrior;
      }

      return { client, activeVal, priorVal };
    }).filter(x => x.activeVal > 0);

    compiled.sort((a, b) => b.activeVal - a.activeVal);

    const top10 = compiled.slice(0, 10);
    const others = compiled.slice(10);
    const othersValue = others.reduce((sum, x) => sum + x.activeVal, 0);
    const totalValue = compiled.reduce((sum, x) => sum + x.activeVal, 0);
    const othersPrior = others.reduce((sum, x) => sum + x.priorVal, 0);

    const fullTable = [...top10];
    if (othersValue > 0 || othersPrior > 0) {
      fullTable.push({ client: "Others", activeVal: othersValue, priorVal: othersPrior });
    }

    return { fullTable, top10, othersList: others, othersValue, totalValue, priorFy, compiledCount: compiled.length };
  }, [projects, tes, metric, activeFy, localOfficeFilter, effectiveCurrency, monthlyFxRates]);

  const COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#34D399", "#F97316", "#8B5CF6", "#8B5CF6", "#6366F1", "#EC4899", "#94A3B8"];

  const pieData = displayData.top10.map((d, i) => ({
    name: d.client,
    value: d.activeVal,
    fill: COLORS[i % COLORS.length]
  }));
  
  if (displayData.othersValue > 0) {
    pieData.push({
      name: "Others",
      value: displayData.othersValue,
      fill: COLORS[COLORS.length - 1]
    });
  }

  const activeFyLabel = activeFy.replace("fy", "").replace("_", "/");
  const priorFyLabel = displayData.priorFy.replace("fy", "").replace("_", "/");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <CardTitle className="text-lg">Financials by Client</CardTitle>
          <FilterToggleGroup 
            value={metric} 
            onChange={(v) => setMetric(v as MetricType)} 
            options={[
              { value: "gp", label: "Gross Profit" },
              { value: "te", label: "Talent Efficiencies" },
              { value: "af", label: "Agency Fees" }
            ]} 
          />
        </div>
        <div className="flex items-center gap-2">
          
          <FilterToggleGroup 
            value={localOfficeFilter} 
            onChange={(v) => setLocalOfficeFilter(v as OfficeFilter)} 
            options={[
              { value: "Global", label: "Global" },
              { value: "UK", label: "UK" },
              { value: "US", label: "US" }
            ]} 
          />
          <span className="text-sm font-medium text-muted-foreground ml-2">FY</span>
          <Select value={activeFy} onValueChange={setActiveFy}>
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fy23_24">23/24</SelectItem>
              <SelectItem value="fy24_25">24/25</SelectItem>
              <SelectItem value="fy25_26">25/26</SelectItem>
              <SelectItem value="fy26_27">26/27</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {isLoadingProjects || isLoadingTes || isLoadingFx ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-stone-400">
            Loading data...
          </div>
        ) : displayData.totalValue === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-stone-400">
            No data available for {activeFyLabel}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Table side */}
            <div className="flex-1 overflow-x-auto min-w-[50%]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 font-semibold text-stone-900 bg-[#1f3b8b] text-white px-3">Top 10 Clients</th>
                    <th className="text-right py-3 font-semibold bg-[#1f3b8b] text-white px-3 whitespace-nowrap">{activeFyLabel}<br/><span className="font-normal text-xs">(De-risked)</span></th>
                    <th className="text-right py-3 font-semibold bg-[#1f3b8b] text-white px-3 whitespace-nowrap">Change<br/><span className="font-normal text-xs">vs. PY</span></th>
                    <th className="text-right py-3 font-semibold bg-[#1f3b8b] text-white px-3 whitespace-nowrap">PY<br/><span className="font-normal text-xs">(De-risked)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.fullTable.map((row, i) => {
                    const isOthers = row.client === "Others";
                    let changeStr = "n/a - new client";
                    let changeColor = "text-stone-500";
                    if (row.priorVal > 0) {
                      const pct = Math.round(((row.activeVal - row.priorVal) / row.priorVal) * 100);
                      changeStr = pct > 0 ? `+${pct}%` : `${pct}%`;
                      changeColor = pct > 0 ? "text-emerald-600 font-medium" : pct < 0 ? "text-rose-600 font-medium" : "text-stone-600";
                    } else if (row.priorVal === 0 && row.activeVal === 0) {
                      changeStr = "-";
                    }

                    const rowContent = (
                      <tr 
                        key={row.client} 
                        className={`border-b border-stone-100 ${isOthers ? "bg-stone-50/50 cursor-pointer hover:bg-stone-100 transition-colors" : ""}`}
                        onClick={() => isOthers && setIsOthersExpanded(!isOthersExpanded)}
                      >
                        <td className={`py-2 px-3 ${isOthers ? 'italic text-stone-600 flex items-center gap-1' : 'font-medium text-stone-800'}`}>
                          {isOthers && (
                            isOthersExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          )}
                          {row.client}
                        </td>
                        <td className="text-right py-2 px-3 tabular-nums font-medium">
                          {row.activeVal === 0 ? "-" : formatCurrencyCompact(row.activeVal, effectiveCurrency)}
                        </td>
                        <td className={`text-right py-2 px-3 ${changeColor} whitespace-nowrap`}>
                          {changeStr}
                        </td>
                        <td className="text-right py-2 px-3 tabular-nums text-stone-600">
                          {row.priorVal === 0 ? "-" : formatCurrencyCompact(row.priorVal, effectiveCurrency)}
                        </td>
                      </tr>
                    );

                    if (!isOthers || !isOthersExpanded) return rowContent;

                    return (
                      <React.Fragment key="others-group">
                        {rowContent}
                        {displayData.othersList.map(subRow => {
                          let subChangeStr = "n/a - new client";
                          let subChangeColor = "text-stone-500";
                          if (subRow.priorVal > 0) {
                            const pct = Math.round(((subRow.activeVal - subRow.priorVal) / subRow.priorVal) * 100);
                            subChangeStr = pct > 0 ? `+${pct}%` : `${pct}%`;
                            subChangeColor = pct > 0 ? "text-emerald-600" : pct < 0 ? "text-rose-600" : "text-stone-500";
                          } else if (subRow.priorVal === 0 && subRow.activeVal === 0) {
                            subChangeStr = "-";
                          }
                          
                          return (
                            <tr key={subRow.client} className="border-b border-stone-100/50 bg-stone-50/20 text-xs">
                              <td className="py-1.5 px-3 pl-8 text-stone-600 truncate max-w-[150px]">
                                {subRow.client}
                              </td>
                              <td className="text-right py-1.5 px-3 tabular-nums">
                                {subRow.activeVal === 0 ? "-" : formatCurrencyCompact(subRow.activeVal, effectiveCurrency)}
                              </td>
                              <td className={`text-right py-1.5 px-3 ${subChangeColor} whitespace-nowrap`}>
                                {subChangeStr}
                              </td>
                              <td className="text-right py-1.5 px-3 tabular-nums text-stone-500">
                                {subRow.priorVal === 0 ? "-" : formatCurrencyCompact(subRow.priorVal, effectiveCurrency)}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Chart side */}
            <div className="flex-1 min-w-[300px] flex items-center justify-center relative">
              <ChartContainer config={{}} className="w-full h-full min-h-[300px]">
                <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible" }}>
                  <RechartsPrimitive.PieChart style={{ overflow: "visible" }}>
                    <RechartsPrimitive.Pie
                      isAnimationActive={false}
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="65%"
                      paddingAngle={2}
                      dataKey="value"
                      label={(props) => {
                        let { cx, cy, midAngle, innerRadius, outerRadius, value, payload, fill } = props;
                        
                        // Recharts sometimes passes these as strings if they were provided as strings, or they might be numbers.
                        // We must ensure they are numbers for the math to work.
                        cx = Number(cx) || 150;
                        cy = Number(cy) || 150;
                        innerRadius = Number(innerRadius) || 60;
                        outerRadius = Number(outerRadius) || 100;

                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
                        const xInside = cx + radius * Math.cos(-midAngle * RADIAN);
                        const yInside = cy + radius * Math.sin(-midAngle * RADIAN);
                        const isLargeEnough = (value / displayData.totalValue) >= 0.02;
                        
                        // Calculate outer label position
                        const oRadius = outerRadius + 20;
                        const ox = cx + oRadius * Math.cos(-midAngle * RADIAN);
                        const oy = cy + oRadius * Math.sin(-midAngle * RADIAN);
                        const textAnchor = ox > cx ? "start" : "end";
                        
                        // Line points
                        const sin = Math.sin(-midAngle * RADIAN);
                        const cos = Math.cos(-midAngle * RADIAN);
                        const sx = cx + outerRadius * cos;
                        const sy = cy + outerRadius * sin;
                        const mx = cx + (outerRadius + 15) * cos;
                        const my = cy + (outerRadius + 15) * sin;
                        const ex = mx + (cos >= 0 ? 1 : -1) * 10;
                        const ey = my;

                        const nameStr = payload?.name || "Unknown";
                        const shortName = nameStr.length > 20 ? nameStr.substring(0, 20) + '...' : nameStr;

                        return (
                          <g>
                            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#e5e7eb" fill="none" />
                            {isLargeEnough && (
                              <text x={xInside} y={yInside} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold pointer-events-none">
                                {formatCurrencyCompact(value, effectiveCurrency).replace(/[^\d.kM]+/, '')}
                              </text>
                            )}
                            <text x={ex + (cos >= 0 ? 1 : -1) * 5} y={ey} fill="#6b7280" textAnchor={textAnchor} dominantBaseline="central" className="text-[10px] pointer-events-none">
                              {shortName}
                            </text>
                          </g>
                        );
                      }}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </RechartsPrimitive.Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        const pct = ((data.value / displayData.totalValue) * 100).toFixed(1);
                        return (
                          <div className="rounded-lg border border-border bg-background p-2 shadow-xl text-xs">
                            <div className="font-semibold text-stone-800 mb-1">{data.name}</div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">Value</span>
                              <span className="font-medium">{formatCurrency(data.value, effectiveCurrency)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-stone-500">% of Total</span>
                              <span className="font-medium">{pct}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </RechartsPrimitive.PieChart>
                </RechartsPrimitive.ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
