import { useState, useMemo } from "react";
import { format, endOfMonth, isBefore, isAfter, isSameMonth } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "./button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";
import { DateRange } from "react-day-picker";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { eachDayOfInterval } from "date-fns";

export interface CustomDateRangePickerProps {
  start?: Date;
  end?: Date;
  onSelect: (range: { start?: Date; end?: Date }) => void;
  selectedClass?: string;
  rangeMiddleClass?: string;
  hoverPreviewClass?: string;
  cellClass?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function CustomDateRangePicker({
  start,
  end,
  onSelect,
  selectedClass = "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
  rangeMiddleClass = "aria-selected:bg-accent aria-selected:text-accent-foreground",
  hoverPreviewClass = "!bg-muted !text-muted-foreground rounded-none",
  cellClass = "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
}: CustomDateRangePickerProps) {
  const [mode, setMode] = useState<"months" | "dates">("months");
  const [currentYear, setCurrentYear] = useState(start ? start.getFullYear() : new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  
  const [hoveredDay, setHoveredDay] = useState<Date | undefined>(undefined);
  const [hoveredMonth, setHoveredMonth] = useState<Date | undefined>(undefined);

  // Day picker preview
  const hoverPreviewDays = useMemo(() => {
    if (!start || end || !hoveredDay) return [];
    if (hoveredDay <= start) return [];
    const days = eachDayOfInterval({ start: start, end: hoveredDay });
    return days.slice(1);
  }, [start, end, hoveredDay]);

  const handleMonthClick = (monthIndex: number) => {
    const clickedStart = new Date(currentYear, monthIndex, 1);
    const clickedEnd = endOfMonth(clickedStart);

    if (!isSelectingRange) {
      // First click: select this month perfectly, but prime the picker for a range
      onSelect({ start: clickedStart, end: clickedEnd });
      setIsSelectingRange(true);
    } else {
      // Second click: complete the range
      if (start && isBefore(clickedStart, start)) {
        // Clicked before the original start month
        onSelect({ start: clickedStart, end: endOfMonth(start) });
      } else if (start) {
        // Clicked after the original start month
        onSelect({ start, end: clickedEnd });
      }
      setIsSelectingRange(false);
      setOpen(false); // auto-close popover when range is completed
    }
  };

  const isMonthSelected = (monthIndex: number) => {
    const date = new Date(currentYear, monthIndex, 1);
    if (start && end) {
      return (isSameMonth(date, start) || isAfter(date, start)) && 
             (isSameMonth(date, end) || isBefore(date, end));
    }
    if (start && !end) {
      return isSameMonth(date, start);
    }
    return false;
  };

  const isMonthHoverPreview = (monthIndex: number) => {
    if (!start || !isSelectingRange || !hoveredMonth) return false;
    const date = new Date(currentYear, monthIndex, 1);
    
    const minDate = isBefore(start, hoveredMonth) ? start : hoveredMonth;
    const maxDate = isAfter(start, hoveredMonth) ? start : hoveredMonth;

    return (isAfter(date, minDate) || isSameMonth(date, minDate)) && 
           (isBefore(date, maxDate) || isSameMonth(date, maxDate)) &&
           !isSameMonth(date, start);
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) setIsSelectingRange(false);
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal", !start && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {start && end
            ? `${format(start, "dd MMM yyyy")} – ${format(end, "dd MMM yyyy")}`
            : start
              ? `${format(start, "dd MMM yyyy")} – select end date`
              : "Select date range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as "months" | "dates")} className="justify-center">
            <ToggleGroupItem value="months" className="px-6">Months</ToggleGroupItem>
            <ToggleGroupItem value="dates" className="px-6">Dates</ToggleGroupItem>
          </ToggleGroup>

          {mode === "months" ? (
            <div className="w-[280px]">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentYear(y => y - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium text-sm">{currentYear}</div>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentYear(y => y + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, idx) => {
                  const selected = isMonthSelected(idx);
                  const preview = isMonthHoverPreview(idx);
                  
                  return (
                    <Button
                      key={month}
                      variant="ghost"
                      className={cn(
                        "h-10 text-sm font-medium",
                        selected ? selectedClass : preview ? hoverPreviewClass.replace("!bg-muted", "bg-muted").replace("!text-muted-foreground", "text-muted-foreground").replace("rounded-none", "") : ""
                      )}
                      onClick={() => handleMonthClick(idx)}
                      onMouseEnter={() => setHoveredMonth(new Date(currentYear, idx, 1))}
                      onMouseLeave={() => setHoveredMonth(undefined)}
                    >
                      {month}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Calendar
              mode="range"
              showOutsideDays={false}
              selected={start ? { from: start, to: end } : undefined}
              onSelect={(range: DateRange | undefined) => {
                onSelect({ start: range?.from, end: range?.to });
                if (range?.to) setHoveredDay(undefined);
              }}
              onDayMouseEnter={(day) => setHoveredDay(day)}
              onDayMouseLeave={() => setHoveredDay(undefined)}
              numberOfMonths={2}
              className="p-0"
              modifiers={{ hoverPreview: hoverPreviewDays }}
              modifiersClassNames={{ hoverPreview: hoverPreviewClass }}
              classNames={{
                day_selected: selectedClass,
                day_range_middle: rangeMiddleClass,
                day_range_end: "day-range-end",
                day_today: "",
                cell: cellClass,
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
