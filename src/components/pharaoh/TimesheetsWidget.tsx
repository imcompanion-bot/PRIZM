import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Clock, User, Loader2 } from "lucide-react";

type TimeWindow = "this_week" | "last_week" | "this_month" | "last_month";

interface TimesheetsWidgetProps {
  targetClients: string[];
}

export function TimesheetsWidget({ targetClients }: TimesheetsWidgetProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("this_month");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (timeWindow === "this_week") {
       return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    } else if (timeWindow === "last_week") {
       const lw = subWeeks(now, 1);
       return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) };
    } else if (timeWindow === "this_month") {
       return { start: startOfMonth(now), end: endOfMonth(now) };
    } else {
       const lm = subMonths(now, 1);
       return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
  }, [timeWindow]);

  useEffect(() => {
    async function load() {
       if (!targetClients || targetClients.length === 0) { setData([]); return; }
       setLoading(true);
       
       const { data: prjs1 } = await supabase.from("projects").select("id, title").in("parent_account", targetClients);
       const { data: prjs2 } = await supabase.from("projects").select("id, title").in("sf_account", targetClients);
       
       const allPrjs = [...(prjs1 || []), ...(prjs2 || [])];
       const prjMap = new Map();
       allPrjs.forEach(p => prjMap.set(p.id, p.title));
       const prjIds = Array.from(prjMap.keys());
       
       if (prjIds.length === 0) {
          setData([]); setLoading(false); return;
       }
       
       const { data: times } = await supabase.from("time_entries")
         .select("hours, notes, date, project_id, people:person_id(id, name)")
         .in("project_id", prjIds)
         .gte("date", format(dateRange.start, "yyyy-MM-dd"))
         .lte("date", format(dateRange.end, "yyyy-MM-dd"));
         
       if (!times) { setData([]); setLoading(false); return; }
       
       const byPerson = new Map<string, any>();
       for (const t of times) {
          const pid = (t.people as any)?.id;
          if (!pid) continue;
          
          if (!byPerson.has(pid)) {
             byPerson.set(pid, { id: pid, name: (t.people as any).name, totalHours: 0, entries: [] });
          }
          const p = byPerson.get(pid);
          p.totalHours += Number(t.hours);
          p.entries.push({ ...t, projectName: prjMap.get(t.project_id) || "Unknown Project" });
       }
       
       const arr = Array.from(byPerson.values()).sort((a, b) => b.totalHours - a.totalHours);
       setData(arr);
       setLoading(false);
    }
    load();
  }, [targetClients, dateRange]);

  const maxHours = data.length > 0 ? Math.max(...data.map(d => d.totalHours)) : 0;

  // Group entries by project for the selected person
  const selectedPersonProjects = useMemo(() => {
    if (!selectedPerson) return [];
    const projMap = new Map<string, any>();
    for (const e of selectedPerson.entries) {
      if (!projMap.has(e.projectName)) {
        projMap.set(e.projectName, { name: e.projectName, totalHours: 0, tasks: [] });
      }
      const p = projMap.get(e.projectName);
      p.totalHours += Number(e.hours);
      if (e.notes || e.hours > 0) {
        p.tasks.push({ notes: e.notes || "No description", hours: Number(e.hours), date: e.date });
      }
    }
    return Array.from(projMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [selectedPerson]);

  return (
    <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white overflow-hidden mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div>
          <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground mb-1">
            Timesheets
          </div>
          <CardTitle className="uppercase font-display text-[22px] font-semibold text-foreground">
            Team Time Investment
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-[3px] font-light">
            Logged hours against these clients within the selected period.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs text-muted-foreground hidden lg:inline-block mr-2">
             {format(dateRange.start, "dd MMM")} - {format(dateRange.end, "dd MMM")}
           </span>
           <ToggleGroup type="single" value={timeWindow} onValueChange={(v) => { if(v) setTimeWindow(v as TimeWindow); }} className="bg-white border rounded-md p-1 shadow-sm">
             <ToggleGroupItem value="this_week" className="text-xs px-3 h-7 text-stone-600 data-[state=on]:bg-primary data-[state=on]:text-black">This Wk</ToggleGroupItem>
             <ToggleGroupItem value="last_week" className="text-xs px-3 h-7 text-stone-600 data-[state=on]:bg-primary data-[state=on]:text-black">Last Wk</ToggleGroupItem>
             <ToggleGroupItem value="this_month" className="text-xs px-3 h-7 text-stone-600 data-[state=on]:bg-primary data-[state=on]:text-black">This Mo</ToggleGroupItem>
             <ToggleGroupItem value="last_month" className="text-xs px-3 h-7 text-stone-600 data-[state=on]:bg-primary data-[state=on]:text-black">Last Mo</ToggleGroupItem>
           </ToggleGroup>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No time logged against these clients in this period.</div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[300px]">Person</TableHead>
                <TableHead className="text-right w-[150px]">Total Hours</TableHead>
                <TableHead>Relative Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(person => (
                <TableRow 
                  key={person.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedPerson(person)}
                >
                  <TableCell className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {person.name}
                  </TableCell>
                  <TableCell className="text-right font-display font-medium text-base">
                    {person.totalHours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}h
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(person.totalHours / maxHours) * 100} 
                        className="h-2 w-full max-w-[200px]" 
                      />
                      <span className="text-xs text-muted-foreground">
                        {Math.round((person.totalHours / maxHours) * 100)}% of max
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto bg-[#faf8f5] p-0">
          {selectedPerson && (
             <div className="flex flex-col h-full">
                <SheetHeader className="p-6 border-b bg-white">
                  <SheetTitle className="font-display text-2xl">{selectedPerson.name}</SheetTitle>
                  <SheetDescription>
                    Logged <strong className="text-black font-semibold">{selectedPerson.totalHours.toLocaleString()}h</strong> against these clients between {format(dateRange.start, "MMM do")} and {format(dateRange.end, "MMM do")}.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="p-6 space-y-6 bg-[#faf8f5] flex-1">
                  {selectedPersonProjects.map((proj: any, idx: number) => (
                    <Card key={idx} className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between bg-muted/10 rounded-t-xl">
                        <h4 className="font-medium text-sm w-3/4 leading-snug">{proj.name}</h4>
                        <div className="text-sm font-display font-semibold whitespace-nowrap text-primary">{proj.totalHours.toLocaleString()}h</div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table className="text-xs">
                          <TableBody>
                            {proj.tasks.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((task: any, tidx: number) => (
                              <TableRow key={tidx}>
                                <TableCell className="w-[80px] text-muted-foreground border-r">{format(new Date(task.date), "dd MMM")}</TableCell>
                                <TableCell className="break-words py-3">{task.notes}</TableCell>
                                <TableCell className="text-right font-medium w-[60px] text-muted-foreground">{task.hours}h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
             </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
