import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isWeekend, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import UtilisationTab from "@/components/time-tracking/UtilisationTab";
import AnalysisTab from "@/components/time-tracking/AnalysisTab";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";

type PeriodPreset = "last_1_month" | "last_3_months" | "last_6_months" | "last_12_months" | "custom";

function ToggleGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border-border p-0.5 bg-muted/50 bg-[#cfddf2] border-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === opt.value ? "bg-background shadow-sm text-foreground bg-[#4b71d8]" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const UtilisationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const periodPreset = (searchParams.get("period") as PeriodPreset) || "last_3_months";
  const officeFilter = (searchParams.get("office") as "Global" | "UK" | "US") || "Global";
  const showFormer = searchParams.get("former") !== "false";
  const customStartParam = searchParams.get("cs");
  const customEndParam = searchParams.get("ce");
  const [customStart, setCustomStartLocal] = useState<Date | undefined>(customStartParam ? parseISO(customStartParam) : undefined);
  const [customEnd, setCustomEndLocal] = useState<Date | undefined>(customEndParam ? parseISO(customEndParam) : undefined);
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPeriodPreset = useCallback((v: PeriodPreset) => setParam("period", v), [setParam]);
  const setOfficeFilter = useCallback((v: string) => setParam("office", v), [setParam]);
  const setShowFormer = useCallback((v: boolean) => setParam("former", String(v)), [setParam]);
  const setCustomStart = useCallback((d: Date | undefined) => {
    setCustomStartLocal(d);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (d) next.set("cs", format(d, "yyyy-MM-dd")); else next.delete("cs");
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const setCustomEnd = useCallback((d: Date | undefined) => {
    setCustomEndLocal(d);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (d) next.set("ce", format(d, "yyyy-MM-dd")); else next.delete("ce");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const hoverPreviewDays = useMemo(() => {
    if (!customStart || customEnd || !hoveredDate) return [];
    if (hoveredDate <= customStart) return [];
    const days = eachDayOfInterval({ start: customStart, end: hoveredDate });
    return days.slice(1);
  }, [customStart, customEnd, hoveredDate]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const lastCompletedMonth = subMonths(startOfMonth(now), 1);
    const lastCompletedEnd = endOfMonth(lastCompletedMonth);
    switch (periodPreset) {
      case "last_1_month":
        return { startDate: startOfMonth(lastCompletedMonth), endDate: lastCompletedEnd };
      case "last_3_months":
        return { startDate: startOfMonth(subMonths(lastCompletedMonth, 2)), endDate: lastCompletedEnd };
      case "last_6_months":
        return { startDate: startOfMonth(subMonths(lastCompletedMonth, 5)), endDate: lastCompletedEnd };
      case "last_12_months":
        return { startDate: startOfMonth(subMonths(lastCompletedMonth, 11)), endDate: lastCompletedEnd };
      case "custom":
        return { startDate: customStart ?? startOfMonth(new Date()), endDate: customEnd ?? new Date() };
      default:
        return { startDate: startOfMonth(lastCompletedMonth), endDate: lastCompletedEnd };
    }
  }, [periodPreset, customStart, customEnd]);

  const workingDaysInPeriod = useMemo(() => {
    if (startDate > endDate) return 0;
    return eachDayOfInterval({ start: startDate, end: endDate }).filter((d) => !isWeekend(d)).length;
  }, [startDate, endDate]);

  return (
    <div className="p-8 border-[#faf8f5] bg-[#faf8f5]">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#1a1a1a]">Time & Utilisation</h1>
        <p className="text-muted-foreground text-sm mt-1">Review timesheet completeness and billable capacity</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <ToggleGroup
          value={officeFilter}
          onChange={(v) => setOfficeFilter(v as "Global" | "UK" | "US")}
          options={[
            { value: "Global", label: "Global" },
            { value: "UK", label: "UK" },
            { value: "US", label: "US" },
          ]}
        />
        <ToggleGroup
          value={showFormer ? "all" : "current"}
          onChange={(v) => setShowFormer(v === "all")}
          options={[
            { value: "all", label: "Current + Former" },
            { value: "current", label: "Current Only" },
          ]}
        />
        <ToggleGroup
          value={periodPreset}
          onChange={(v) => setPeriodPreset(v as PeriodPreset)}
          options={[
            { value: "last_1_month", label: "1 Month" },
            { value: "last_3_months", label: "3 Months" },
            { value: "last_6_months", label: "6 Months" },
            { value: "last_12_months", label: "12 Months" },
            { value: "custom", label: "Custom" },
          ]}
        />
        {periodPreset === "custom" && (
          <CustomDateRangePicker
            start={customStart}
            end={customEnd}
            onSelect={({ start, end }) => {
              setCustomStart(start);
              setCustomEnd(end);
            }}
            selectedClass="bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white"
            rangeMiddleClass="aria-selected:bg-indigo-50 aria-selected:text-indigo-900"
            hoverPreviewClass="!bg-indigo-50 !text-indigo-900 rounded-none"
            cellClass="h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-indigo-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
          />
        )}
        <span className="text-sm text-muted-foreground">
          {format(startDate, "dd MMM")} – {format(endDate, "dd MMM yyyy")} · {workingDaysInPeriod} working days
        </span>
      </div>

      <Tabs value={searchParams.get("tab") || "utilisation"} onValueChange={(v) => setParam("tab", v)}>
        <TabsList>
          <TabsTrigger value="utilisation">Summary</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="utilisation" className="mt-4">
          <UtilisationTab startDate={startDate} endDate={endDate} officeFilter={officeFilter} showFormer={showFormer} />
        </TabsContent>
        <TabsContent value="analysis" className="mt-4">
          <AnalysisTab startDate={startDate} endDate={endDate} officeFilter={officeFilter} showFormer={showFormer} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UtilisationPage;
