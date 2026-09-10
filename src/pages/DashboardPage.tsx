import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatCurrencyCompact } from "@/lib/calculations";
import { ArrowUpRight, ArrowDownRight, Minus, ArrowUp, ArrowDown, Users, DollarSign } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as RechartsPrimitive from "recharts";
import { ChartContainer } from "@/components/ui/chart";

type OfficeFilter = "Global" | "UK" | "US";
type PeriodType = "Years" | "Quarters";
type SortField = "client" | "trend" | "total" | string;
type SortDirection = "asc" | "desc";

function FilterToggleGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border-border p-0.5 bg-muted/50 items-stretch bg-[#cfddf2] border-0">
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

function SortableHeader({ label, field, sortConfig, onSort, align = "left" }: { label: React.ReactNode, field: string, sortConfig: { field: string, dir: SortDirection }, onSort: (field: string) => void, align?: "left" | "right" }) {
  const isActive = sortConfig.field === field;
  return (
    <TableHead className={cn("font-semibold cursor-pointer hover:bg-stone-100 transition-colors select-none", align === "right" && "text-right")}>
      <button 
        onClick={() => onSort(field)}
        className={cn("flex items-center gap-1 w-full", align === "right" && "justify-end")}
      >
        <span>{label}</span>
        {isActive && (
          sortConfig.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </button>
    </TableHead>
  );
}

function getMostRecentlyCompletedQuarter(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); 

  let completedQ = "";
  let fyYear1 = 0;
  let fyYear2 = 0;

  if (month >= 7 && month <= 9) { 
    completedQ = "Q1";
    fyYear1 = year;
    fyYear2 = year + 1;
  } else if (month >= 10 || month === 0) { 
    completedQ = "Q2";
    fyYear1 = month === 0 ? year - 1 : year;
    fyYear2 = fyYear1 + 1;
  } else if (month >= 1 && month <= 3) { 
    completedQ = "Q3";
    fyYear1 = year - 1;
    fyYear2 = year;
  } else if (month >= 4 && month <= 6) { 
    completedQ = "Q4";
    fyYear1 = year - 1;
    fyYear2 = year;
  }

  const yr1Str = fyYear1.toString().slice(-2);
  const yr2Str = fyYear2.toString().slice(-2);

  return `${completedQ} ${yr1Str}/${yr2Str}`;
}

function getMostRecentlyCompletedYear(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); 

  let fyYear1 = 0;
  let fyYear2 = 0;

  if (month >= 4) {
    fyYear1 = year - 1;
    fyYear2 = year;
  } else {
    fyYear1 = year - 2;
    fyYear2 = year - 1;
  }
  
  const yr1Str = fyYear1.toString().slice(-2);
  const yr2Str = fyYear2.toString().slice(-2);

  return `${yr1Str}/${yr2Str}`;
}

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const officeFilter = (searchParams.get("office") as OfficeFilter) || "Global";
  const periodType = (searchParams.get("periodType") as PeriodType) || "Quarters";
  const displayCurrency = officeFilter === "US" ? "USD" : "GBP";

  const [sortConfig, setSortConfig] = useState<{ field: SortField, dir: SortDirection }>({ field: "total", dir: "desc" });
  
  const [comparePeriod, setComparePeriod] = useState<string>("");
  const [priorPeriods, setPriorPeriods] = useState<string>("4"); 

  const setOfficeFilter = (v: OfficeFilter) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("office", v);
      return newParams;
    });
  };

  const setPeriodType = (v: PeriodType) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("periodType", v);
      return newParams;
    });
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        return { field, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { field, dir: "desc" };
    });
  };

  const { data: projects, isLoading } = useQuery({
    queryKey: ["dashboard-projects-v4"], 
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("projects")
          .select("id, ultimate_parent, sf_account, gp_full_value, start_date, extra_data, office, fx_rate_gbp, fx_rate_usd, fee_calc_currency")
          .not("extra_data", "is", null)
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

  const rawData = useMemo(() => {
    if (!projects) return { data: [], periods: [] };

    const ratios: number[] = [];
    for (const p of projects as any[]) {
      if (p.fx_rate_gbp && p.fx_rate_usd && p.fx_rate_gbp > 0) {
        ratios.push(p.fx_rate_usd / p.fx_rate_gbp);
      }
    }
    ratios.sort((a, b) => a - b);
    const fallbackGbpUsdRate = ratios.length > 0 ? ratios[Math.floor(ratios.length / 2)] : 1.27;

    const clientMap = new Map<string, Record<string, number>>();
    const periodSet = new Set<string>();

    const keys = periodType === "Years" ? [
      { key: "gp_fy20_21", label: "20/21" },
      { key: "gp_fy21_22", label: "21/22" },
      { key: "gp_fy22_23", label: "22/23" },
      { key: "gp_fy23_24", label: "23/24" },
      { key: "gp_fy24_25", label: "24/25" },
      { key: "gp_fy25_26", label: "25/26" },
      { key: "gp_fy26_27", label: "26/27" },
    ] : [
      { key: "gp_q1_20_21", label: "Q1 20/21" },
      { key: "gp_q2_20_21", label: "Q2 20/21" },
      { key: "gp_q3_20_21", label: "Q3 20/21" },
      { key: "gp_q4_20_21", label: "Q4 20/21" },
      { key: "gp_q1_21_22", label: "Q1 21/22" },
      { key: "gp_q2_21_22", label: "Q2 21/22" },
      { key: "gp_q3_21_22", label: "Q3 21/22" },
      { key: "gp_q4_21_22", label: "Q4 21/22" },
      { key: "gp_q1_22_23", label: "Q1 22/23" },
      { key: "gp_q2_22_23", label: "Q2 22/23" },
      { key: "gp_q3_22_23", label: "Q3 22/23" },
      { key: "gp_q4_22_23", label: "Q4 22/23" },
      { key: "gp_q1_23_24", label: "Q1 23/24" },
      { key: "gp_q2_23_24", label: "Q2 23/24" },
      { key: "gp_q3_23_24", label: "Q3 23/24" },
      { key: "gp_q4_23_24", label: "Q4 23/24" },
      { key: "gp_q1_24_25", label: "Q1 24/25" },
      { key: "gp_q2_24_25", label: "Q2 24/25" },
      { key: "gp_q3_24_25", label: "Q3 24/25" },
      { key: "gp_q4_24_25", label: "Q4 24/25" },
      { key: "gp_q1_25_26", label: "Q1 25/26" },
      { key: "gp_q2_25_26", label: "Q2 25/26" },
      { key: "gp_q3_25_26", label: "Q3 25/26" },
      { key: "gp_q4_25_26", label: "Q4 25/26" },
      { key: "gp_q1_26_27", label: "Q1 26/27" },
      { key: "gp_q2_26_27", label: "Q2 26/27" },
      { key: "gp_q3_26_27", label: "Q3 26/27" },
      { key: "gp_q4_26_27", label: "Q4 26/27" },
    ];

    keys.forEach(fk => periodSet.add(fk.label));

    for (const proj of projects) {
      const o = proj.office?.toUpperCase() || "";
      let matchesOffice = false;
      if (officeFilter === "Global") matchesOffice = true;
      else if (officeFilter === "UK") matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
      else if (officeFilter === "US") matchesOffice = (o === "US" || o === "UNITED STATES");
      
      if (!matchesOffice) continue;

      const client = proj.ultimate_parent || proj.sf_account || "Unknown Client";
      
      if (!clientMap.has(client)) {
        clientMap.set(client, {});
      }

      const clientData = clientMap.get(client)!;
      
      const ext = (proj.extra_data && typeof proj.extra_data === 'object') ? (proj.extra_data as Record<string, any>) : {};
      
      const isUS = proj.office === "United States" || proj.office === "US" || proj.office?.toUpperCase() === "US";
      const projectCurrency = isUS ? "USD" : "GBP";
      
      let fxRateGbp = proj.fx_rate_gbp || 1;
      let fxRateUsd = proj.fx_rate_usd || (fxRateGbp * fallbackGbpUsdRate);
      
      if (!proj.fx_rate_gbp && !proj.fx_rate_usd) {
        if (projectCurrency === "USD") {
          fxRateGbp = fallbackGbpUsdRate;
          fxRateUsd = 1;
        } else {
          fxRateGbp = 1;
          fxRateUsd = fallbackGbpUsdRate;
        }
      }

      const gbpToUsd = fxRateUsd > 0 ? fxRateGbp / fxRateUsd : 1;
      const convertCurrency = (v: number) => {
        if (projectCurrency === displayCurrency) return v;
        
        const toGBP = (val: number) => {
          if (projectCurrency === "GBP") return val;
          if (projectCurrency === "USD") return val / gbpToUsd;
          return val / (fxRateGbp || 1);
        };
        const fromGBP = (val: number) => {
          if (displayCurrency === "GBP") return val;
          if (displayCurrency === "USD") return val * gbpToUsd;
          return val;
        };
        return fromGBP(toGBP(v));
      };
      
      if (Object.keys(ext).length > 0) {
        for (const { key, label } of keys) {
          const rawVal = ext[key];
          const val = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal as string);
          
          if (!isNaN(val) && val !== 0) {
            clientData[label] = (clientData[label] || 0) + convertCurrency(val);
          }
        }
      }
    }

    const sortedPeriods = keys.map(k => k.label).reverse(); 

    const rows = Array.from(clientMap.entries()).map(([client, gpByPeriod]) => {
      return { client, gpByPeriod };
    });

    return { data: rows, periods: sortedPeriods };
  }, [projects, officeFilter, periodType, displayCurrency]);

  const availablePeriods = rawData.periods;

  useEffect(() => {
    if (availablePeriods.length > 0) {
      if (!comparePeriod || !availablePeriods.includes(comparePeriod)) {
        const defaultQ = periodType === "Quarters" 
          ? getMostRecentlyCompletedQuarter()
          : getMostRecentlyCompletedYear();
        
        if (availablePeriods.includes(defaultQ)) {
          setComparePeriod(defaultQ);
        } else {
          setComparePeriod(availablePeriods[0]);
        }
      }
    }
  }, [availablePeriods, comparePeriod, periodType]);

  const basePeriodIndex = useMemo(() => {
    const idx = availablePeriods.indexOf(comparePeriod);
    if (idx === -1) return -1;
    const offset = parseInt(priorPeriods);
    if (isNaN(offset)) return -1;
    return idx + offset;
  }, [comparePeriod, priorPeriods, availablePeriods]);

  const basePeriodLabel = basePeriodIndex >= 0 && basePeriodIndex < availablePeriods.length 
    ? availablePeriods[basePeriodIndex] 
    : "";

  const visiblePeriods = useMemo(() => {
    const startIdx = availablePeriods.indexOf(comparePeriod);
    if (startIdx === -1 || basePeriodIndex === -1) return availablePeriods;
    return availablePeriods.slice(startIdx, basePeriodIndex + 1);
  }, [availablePeriods, comparePeriod, basePeriodIndex]);

  const { displayData, risersAndFallers, clientMetrics } = useMemo(() => {
    const withTotals = rawData.data.map(row => {
      let totalGp = 0;
      for (const p of visiblePeriods) {
        totalGp += row.gpByPeriod[p] || 0;
      }
      return { ...row, totalGp };
    }).filter(row => Math.abs(row.totalGp) > 1);

    const withDiff = withTotals.map(row => {
      const currentGp = row.gpByPeriod[comparePeriod] || 0;
      const prevGp = basePeriodLabel ? (row.gpByPeriod[basePeriodLabel] || 0) : 0;
      return { ...row, diff: currentGp - prevGp };
    });

    const risers = [...withDiff].filter(r => r.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5);
    const fallers = [...withDiff].filter(r => r.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);

    let baseCount = 0;
    let baseValue = 0;
    let newCount = 0, retainedCount = 0, churnedCount = 0;
    let newValue = 0, retainedValue = 0, churnedValue = 0;
    
    let newClients: any[] = [];
    let retainedClients: any[] = [];
    let churnedClients: any[] = [];

    withDiff.forEach(row => {
      const currentGp = row.gpByPeriod[comparePeriod] || 0;
      const prevGp = basePeriodLabel ? (row.gpByPeriod[basePeriodLabel] || 0) : 0;

      const hasPrev = Math.abs(prevGp) > 1;
      const hasCurrent = Math.abs(currentGp) > 1;

      if (hasPrev) {
        baseCount++;
        baseValue += prevGp;
      }

      if (!hasPrev && hasCurrent) {
        newCount++;
        newValue += currentGp;
        newClients.push({ name: row.client, value: currentGp });
      } else if (hasPrev && !hasCurrent) {
        churnedCount++;
        churnedValue += (-prevGp);
        churnedClients.push({ name: row.client, value: -prevGp });
      } else if (hasPrev && hasCurrent) {
        retainedCount++;
        retainedValue += (currentGp - prevGp);
        retainedClients.push({ name: row.client, value: currentGp - prevGp });
      }
    });

    const sortClientsByAbsValue = (arr: any[]) => arr.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    sortClientsByAbsValue(newClients);
    sortClientsByAbsValue(retainedClients);
    sortClientsByAbsValue(churnedClients);

    const endCount = baseCount + newCount - churnedCount;
    const endValue = baseValue + newValue + retainedValue + churnedValue;

    const valBase = baseValue;
    const valNew = valBase + newValue;
    const valRetained = valNew + retainedValue;
    const valChurned = valRetained + churnedValue;

    const metrics = {
      volume: [
        { name: basePeriodLabel || "Base", value: [0, baseCount], displayValue: baseCount, fill: "#cbd5e1", clients: [] },
        { name: "New", value: [baseCount, baseCount + newCount], displayValue: newCount, fill: "#10b981", clients: newClients.map(c => c.name) },
        { name: "Retained", value: [baseCount + newCount, baseCount + newCount], displayValue: retainedCount, fill: "#3b82f6", clients: retainedClients.map(c => c.name) },
        { name: "Churned", value: [baseCount + newCount, baseCount + newCount - churnedCount], displayValue: -churnedCount, fill: "#f43f5e", clients: churnedClients.map(c => c.name) },
        { name: comparePeriod, value: [0, endCount], displayValue: endCount, fill: "#8b5cf6", clients: [] },
      ],
      value: [
        { name: basePeriodLabel || "Base", value: [0, valBase], displayValue: valBase, fill: "#cbd5e1", clients: [] },
        { name: "New", value: [valBase, valNew], displayValue: newValue, fill: "#10b981", clients: newClients },
        { name: "Retained", value: [valNew, valRetained], displayValue: retainedValue, fill: "#3b82f6", clients: retainedClients },
        { name: "Churned", value: [valRetained, valChurned], displayValue: churnedValue, fill: "#f43f5e", clients: churnedClients },
        { name: comparePeriod, value: [0, endValue], displayValue: endValue, fill: "#8b5cf6", clients: [] },
      ]
    };

    const sorted = [...withDiff];
    
    sorted.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      if (sortConfig.field === "client") {
        return sortConfig.dir === "asc" 
          ? a.client.localeCompare(b.client) 
          : b.client.localeCompare(a.client);
      } else if (sortConfig.field === "total") {
        valA = a.totalGp;
        valB = b.totalGp;
      } else if (sortConfig.field === "trend") {
        valA = a.diff;
        valB = b.diff;
      } else {
        valA = a.gpByPeriod[sortConfig.field] || 0;
        valB = b.gpByPeriod[sortConfig.field] || 0;
      }

      if (valA > valB) return sortConfig.dir === "asc" ? 1 : -1;
      if (valA < valB) return sortConfig.dir === "asc" ? -1 : 1;
      return 0;
    });
    
    return { displayData: sorted, risersAndFallers: { risers, fallers }, clientMetrics: metrics };
  }, [rawData, sortConfig, comparePeriod, basePeriodLabel, visiblePeriods]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 pt-6">
        <h2 className="text-3xl font-display font-bold tracking-tight mb-8">Financial Dashboard</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Custom label formatter for the bars
  const renderWaterfallValueLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    const displayVal = payload?.displayValue !== undefined ? payload.displayValue : value;
    const yPos = displayVal < 0 ? (y + (height || 0) + 10) : y - 8;
    const showPlusSign = displayVal > 0 && payload?.name === "New";
    
    return (
      <text 
        x={x + width / 2} 
        y={yPos} 
        fill="#666" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={10}
        className="font-medium"
      >
        {showPlusSign ? '+' : ''}{formatCurrencyCompact(displayVal, displayCurrency)}
      </text>
    );
  };

  const renderCustomValueLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const yPos = value < 0 ? (y + (height || 0) + 10) : y - 8;
    return (
      <text 
        x={x + width / 2} 
        y={yPos} 
        fill="#666" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={10}
        className="font-medium"
      >
        {value > 0 ? '+' : ''}{formatCurrencyCompact(value, displayCurrency)}
      </text>
    );
  };

  const renderCustomVolumeLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    const displayVal = payload?.displayValue !== undefined ? payload.displayValue : value;
    const yPos = displayVal < 0 ? (y + (height || 0) + 10) : y - 8;
    const showPlusSign = displayVal > 0 && payload?.name === "New";

    return (
      <text 
        x={x + width / 2} 
        y={yPos} 
        fill="#666" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={10}
        className="font-medium"
      >
        {showPlusSign ? '+' : ''}{displayVal}
      </text>
    );
  };



  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#faf8f5]">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold tracking-tight">Financial Dashboard</h2>
        
        <div className="flex items-center gap-3">
          <FilterToggleGroup
            value={periodType}
            onChange={(v) => setPeriodType(v as PeriodType)}
            options={[
              { value: "Years", label: "Years" },
              { value: "Quarters", label: "Quarters" },
            ]}
          />
          <FilterToggleGroup
            value={officeFilter}
            onChange={(v) => setOfficeFilter(v as OfficeFilter)}
            options={[
              { value: "Global", label: "Global" },
              { value: "UK", label: "UK" },
              { value: "US", label: "US" },
            ]}
          />
        </div>
      </div>

      {basePeriodLabel && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm bg-white/50">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-stone-700">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                Top 5 Risers ({comparePeriod} vs {basePeriodLabel})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {risersAndFallers.risers.length > 0 ? (
                <ChartContainer config={{}} className="h-[200px] w-full">
                  <RechartsPrimitive.BarChart
                    data={risersAndFallers.risers.map(r => ({ name: r.client, value: r.diff }))}
                    margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                  >
                    <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <RechartsPrimitive.XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    <RechartsPrimitive.Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="font-semibold mb-1">{d.name}</p>
                            <p className="text-emerald-600 font-medium">+{formatCurrencyCompact(d.value, displayCurrency)}</p>
                          </div>
                        );
                      }}
                    />
                    <RechartsPrimitive.Bar
                      dataKey="value"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      label={renderCustomValueLabel}
                    />
                  </RechartsPrimitive.BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-stone-400">
                  No positive trends found
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm bg-white/50">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-stone-700">
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
                Top 5 Fallers ({comparePeriod} vs {basePeriodLabel})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {risersAndFallers.fallers.length > 0 ? (
                <ChartContainer config={{}} className="h-[200px] w-full">
                  <RechartsPrimitive.BarChart
                    data={risersAndFallers.fallers.map(r => ({ name: r.client, value: r.diff }))} // Keeping as negative for correct baseline rendering, but we will format label
                    margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                  >
                    <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <RechartsPrimitive.XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    <RechartsPrimitive.Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="font-semibold mb-1">{d.name}</p>
                            <p className="text-rose-600 font-medium">{formatCurrencyCompact(d.value, displayCurrency)}</p>
                          </div>
                        );
                      }}
                    />
                    <RechartsPrimitive.Bar
                      dataKey="value"
                      fill="#f43f5e"
                      radius={[0, 0, 4, 4]}
                      label={renderCustomValueLabel}
                    />
                  </RechartsPrimitive.BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-stone-400">
                  No negative trends found
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm bg-white/50">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-stone-700">
                <Users className="h-4 w-4 text-blue-500" />
                Client Volume ({comparePeriod} vs {basePeriodLabel})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={{}} className="h-[200px] w-full">
                <RechartsPrimitive.BarChart
                  data={clientMetrics.volume}
                  margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                >
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsPrimitive.XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <RechartsPrimitive.Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      const clients = d.clients || [];
                      const showClients = clients.slice(0, 10);
                      const othersCount = clients.length - 10;
                      return (
                        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl max-w-[200px]">
                          <p className="font-semibold mb-1">{d.name} Clients ({d.displayValue !== undefined ? d.displayValue : d.value})</p>
                          {showClients.length > 0 && (
                            <div className="mt-2 space-y-1 text-stone-600">
                              {showClients.map((c: string, i: number) => (
                                <div key={i} className="truncate">{c}</div>
                              ))}
                              {othersCount > 0 && (
                                <div className="text-stone-400 italic">...and {othersCount} others</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <RechartsPrimitive.Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    minPointSize={2}
                    label={renderCustomVolumeLabel}
                  >
                    {clientMetrics.volume.map((entry, index) => (
                      <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </RechartsPrimitive.Bar>
                </RechartsPrimitive.BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm bg-white/50">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-stone-700">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Client Value Trend ({comparePeriod} vs {basePeriodLabel})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={{}} className="h-[200px] w-full">
                <RechartsPrimitive.BarChart
                  data={clientMetrics.value}
                  margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                >
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsPrimitive.XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <RechartsPrimitive.Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      const clients = d.clients || [];
                      const top3 = clients.slice(0, 3);
                      
                      let othersValue = 0;
                      if (clients.length > 3) {
                        for (let i = 3; i < clients.length; i++) {
                          othersValue += clients[i].value;
                        }
                      }
                      
                      const displayVal = d.displayValue !== undefined ? d.displayValue : d.value;
                      return (
                        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl min-w-[200px]">
                          <p className="font-semibold mb-2 border-b border-border/50 pb-1">
                            {d.name} GP Trend <span style={{ color: d.fill }}>({displayVal > 0 ? '+' : ''}{formatCurrencyCompact(displayVal, displayCurrency)})</span>
                          </p>
                          {top3.length > 0 && (
                            <div className="space-y-1">
                              {top3.map((c: any, i: number) => (
                                <div key={i} className="flex justify-between gap-4">
                                  <span className="truncate max-w-[140px] text-stone-600">{c.name}</span>
                                  <span className="font-medium tabular-nums text-stone-800">{c.value > 0 ? '+' : ''}{formatCurrencyCompact(c.value, displayCurrency)}</span>
                                </div>
                              ))}
                              {clients.length > 3 && (
                                <div className="flex justify-between gap-4 pt-1 border-t border-border/30 mt-1">
                                  <span className="text-stone-500 italic">Others ({clients.length - 3})</span>
                                  <span className="font-medium tabular-nums text-stone-600">{othersValue > 0 ? '+' : ''}{formatCurrencyCompact(othersValue, displayCurrency)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <RechartsPrimitive.Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    label={renderWaterfallValueLabel}
                  >
                    {clientMetrics.value.map((entry, index) => (
                      <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </RechartsPrimitive.Bar>
                </RechartsPrimitive.BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card className="col-span-1 border-0 shadow-sm bg-white/50">
          <CardHeader className="pb-3 border-b border-stone-100 flex flex-row items-center justify-between space-y-0">
            <CardTitle>Gross Profit by Client</CardTitle>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span className="font-medium">Trend Comparison:</span>
              <Select value={comparePeriod} onValueChange={setComparePeriod}>
                <SelectTrigger className="w-[110px] h-8 bg-white text-xs">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-stone-400">vs</span>
              <Select value={priorPeriods} onValueChange={setPriorPeriods}>
                <SelectTrigger className="w-[140px] h-8 bg-white text-xs">
                  <SelectValue placeholder="Prior Periods" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} prior period{n > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-md border border-stone-200 bg-white overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <SortableHeader label="Client" field="client" sortConfig={sortConfig} onSort={handleSort} />
                    {visiblePeriods.map(period => (
                      <SortableHeader key={period} label={period} field={period} sortConfig={sortConfig} onSort={handleSort} align="right" />
                    ))}
                    <SortableHeader label="Total GP" field="total" sortConfig={sortConfig} onSort={handleSort} align="right" />
                    <SortableHeader label={`Trend (${comparePeriod} vs ${basePeriodLabel || 'None'})`} field="trend" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visiblePeriods.length + 3} className="text-center py-8 text-muted-foreground">
                        No financial data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayData.map((row) => {
                      const diff = row.diff;
                      
                      return (
                        <TableRow key={row.client}>
                          <TableCell className="font-medium text-stone-900">{row.client}</TableCell>
                          
                          {visiblePeriods.map(period => (
                            <TableCell key={period} className="text-right tabular-nums text-stone-600">
                              {formatCurrency(row.gpByPeriod[period] || 0, displayCurrency)}
                            </TableCell>
                          ))}
                          
                          <TableCell className="text-right tabular-nums text-stone-800 font-medium">
                            {formatCurrency(row.totalGp, displayCurrency)}
                          </TableCell>

                          <TableCell className="text-right">
                            {basePeriodLabel ? (
                              <div className="flex items-center justify-end gap-1 font-medium">
                                {diff > 0 ? (
                                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                ) : diff < 0 ? (
                                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                                ) : (
                                  <Minus className="h-4 w-4 text-stone-400" />
                                )}
                                <span className={diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-stone-500"}>
                                  {formatCurrency(Math.abs(diff), displayCurrency)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
