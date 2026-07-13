import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, startOfMonth, endOfMonth, parseISO, isAfter, isBefore, max, min, differenceInMilliseconds, eachDayOfInterval, isWeekend } from "date-fns";
import { Users, CalendarRange, Filter, X, AlertCircle } from "lucide-react";
import { useAnalyticsContext } from "@/contexts/AnalyticsContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const HOURS_PER_DAY = 7.5;

function getWorkingDays(start: Date, end: Date): number {
  if (start > end) return 0;
  const days = eachDayOfInterval({ start, end });
  return days.filter((d) => !isWeekend(d)).length;
}

// Helper to get daily billable capacity from a person's role (defaults to 7.5)
function getPersonDailyCapacity(person: any): number {
  if (!person || !person.roles) return HOURS_PER_DAY;
  const weekly = person.roles.billable_capacity_hours;
  if (typeof weekly === "number") return weekly / 5;
  return HOURS_PER_DAY;
}

function calculateOverlappingHours(
  projectStart: Date,
  projectEnd: Date,
  filterStart: Date,
  filterEnd: Date,
  scopedHours: number,
  phasePercentages: any
): number {
  if (projectStart >= projectEnd || filterStart >= filterEnd) return 0;
  if (projectStart >= filterEnd || projectEnd <= filterStart) return 0;

  const projectDurationMs = differenceInMilliseconds(projectEnd, projectStart);
  const phaseDurationMs = projectDurationMs / 12;

  let totalOverlappingHours = 0;

  for (let i = 1; i <= 12; i++) {
    const phaseStartMs = projectStart.getTime() + (i - 1) * phaseDurationMs;
    const phaseEndMs = projectStart.getTime() + i * phaseDurationMs;

    const phaseStart = new Date(phaseStartMs);
    const phaseEnd = new Date(phaseEndMs);

    // Calculate overlap of this phase with the filter period
    const overlapStart = max([phaseStart, filterStart]);
    const overlapEnd = min([phaseEnd, filterEnd]);

    if (overlapStart < overlapEnd) {
      const overlapDurationMs = differenceInMilliseconds(overlapEnd, overlapStart);
      const overlapRatio = overlapDurationMs / phaseDurationMs;

      const phaseKey = `phase${i}`;
      let phasePctStr = "0%";
      if (phasePercentages && phasePercentages[phaseKey]) {
        phasePctStr = phasePercentages[phaseKey];
      }
      const phasePct = parseFloat(phasePctStr) / 100 || 0;

      const phaseTotalHours = scopedHours * phasePct;
      totalOverlappingHours += phaseTotalHours * overlapRatio;
    }
  }

  return totalOverlappingHours;
}

function PersonAllocationRow({ person, stat, personTotalCapacity, remainingHrs, calculatedPct, allocateMutation }: any) {
  const [selectedPct, setSelectedPct] = useState<number>(calculatedPct);
  
  const maxAvailablePct = Math.round((remainingHrs / personTotalCapacity) * 100);
  
  const rawOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, calculatedPct];
  const options = Array.from(new Set(rawOptions))
    .filter(opt => opt <= maxAvailablePct || opt === calculatedPct) // Always keep calculatedPct as an option
    .sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-stone-50">
      <div className="flex flex-col">
        <span className="font-medium text-stone-900">{person.name}</span>
        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
          <span>{person.office || "Global"}</span>
          <span>•</span>
          <span className="text-emerald-600 font-medium">{Math.round(remainingHrs)}h available</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedPct.toString()} onValueChange={(v) => setSelectedPct(parseInt(v))}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt} value={opt.toString()}>
                {opt === calculatedPct ? `Scope (${opt}%)` : `${opt}%`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          onClick={() => allocateMutation.mutate({ personId: person.id, roleId: stat.roleId, pct: selectedPct })}
          disabled={allocateMutation.isPending}
        >
          Assign
        </Button>
      </div>
    </div>
  );
}

export default function ResourcePlannerPage() {
  const { setPageData } = useAnalyticsContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    setPageData({
      pageName: "Resource Planner",
      pageContext: { section: "Planning" }
    });
  }, [setPageData]);

  // Filters state
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(addMonths(new Date(), 2)));
  const [officeFilter, setOfficeFilter] = useState<"Global" | "UK" | "US">("Global");
  
  // Client selection (3-tier)
  const [ultimateParent, setUltimateParent] = useState<string>("All");
  const [parentAccount, setParentAccount] = useState<string>("All");
  const [sfAccount, setSfAccount] = useState<string>("All");

  // Fetch projects to extract the unique client hierarchy
  const { data: projects = [] } = useQuery({
    queryKey: ["resource_planner_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, sf_account, parent_account, ultimate_parent, office, start_date, end_date, stage, gp_full_value, project_scopes(id)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Base projects filtered by Date and Office (for use in generating available dropdown options)
  const baseFilteredProjects = useMemo(() => {
    let p = projects.filter(pr => pr.stage !== "Closed Lost");
    if (officeFilter !== "Global") {
      const dbOffice = officeFilter === "UK" ? "United Kingdom" : officeFilter === "US" ? "United States" : officeFilter;
      p = p.filter(pr => pr.office === dbOffice);
    }
    return p.filter(pr => {
      if (!pr.start_date || !pr.end_date) return false;
      if (pr.gp_full_value === 0) return false; // Exclude pass-through cost projects
      const pStart = parseISO(pr.start_date);
      const pEnd = parseISO(pr.end_date);
      return pStart <= endDate && pEnd >= startDate && pr.project_scopes && pr.project_scopes.length > 0;
    });
  }, [projects, officeFilter, startDate, endDate]);

  // Extract unique tiers for dropdowns based on selections
  const availableUltimateParents = useMemo(() => {
    const parents = new Set(baseFilteredProjects.map(p => p.ultimate_parent).filter(Boolean) as string[]);
    return Array.from(parents).sort();
  }, [baseFilteredProjects]);

  const availableParentAccounts = useMemo(() => {
    const p = ultimateParent === "All" ? baseFilteredProjects : baseFilteredProjects.filter(pr => pr.ultimate_parent === ultimateParent);
    const parents = new Set(p.map(pr => pr.parent_account).filter(Boolean) as string[]);
    return Array.from(parents).sort();
  }, [baseFilteredProjects, ultimateParent]);

  const availableSfAccounts = useMemo(() => {
    let p = baseFilteredProjects;
    if (ultimateParent !== "All") p = p.filter(pr => pr.ultimate_parent === ultimateParent);
    if (parentAccount !== "All") p = p.filter(pr => pr.parent_account === parentAccount);
    const sf = new Set(p.map(pr => pr.sf_account).filter(Boolean) as string[]);
    return Array.from(sf).sort();
  }, [baseFilteredProjects, ultimateParent, parentAccount]);

  // Determine the active client filter
  const activeProjects = useMemo(() => {
    let p = projects.filter(pr => pr.stage !== "Closed Lost" && pr.gp_full_value !== 0);
    if (ultimateParent !== "All") p = p.filter(pr => pr.ultimate_parent === ultimateParent);
    if (parentAccount !== "All") p = p.filter(pr => pr.parent_account === parentAccount);
    if (sfAccount !== "All") p = p.filter(pr => pr.sf_account === sfAccount);
    if (officeFilter !== "Global") {
      const dbOffice = officeFilter === "UK" ? "United Kingdom" : officeFilter === "US" ? "United States" : officeFilter;
      p = p.filter(pr => pr.office === dbOffice);
    }
    return p;
  }, [projects, ultimateParent, parentAccount, sfAccount, officeFilter]);

  const activeProjectIds = useMemo(() => activeProjects.map(p => p.id), [activeProjects]);

  const projectsMissingScopes = useMemo(() => {
    return activeProjects.filter(pr => {
      if (!pr.start_date || !pr.end_date) return false;
      const pStart = parseISO(pr.start_date);
      const pEnd = parseISO(pr.end_date);
      const inWindow = pStart <= endDate && pEnd >= startDate;
      return inWindow && (!pr.project_scopes || pr.project_scopes.length === 0);
    });
  }, [activeProjects, startDate, endDate]);

  // Fetch scopes for active projects
  const { data: scopes = [] } = useQuery({
    queryKey: ["resource_planner_scopes", activeProjectIds],
    enabled: activeProjectIds.length > 0,
    queryFn: async () => {
      // Chunk request if many projects
      const chunkSize = 200;
      let allScopes: any[] = [];
      for (let i = 0; i < activeProjectIds.length; i += chunkSize) {
        const chunk = activeProjectIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("project_scopes")
          .select("*, roles(name)")
          .in("project_id", chunk);
        if (error) throw error;
        allScopes = allScopes.concat(data || []);
      }
      return allScopes;
    }
  });

  // Fetch people and allocations
  const { data: people = [] } = useQuery({
    queryKey: ["resource_planner_people"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("id, name, office, employment_start_date, employment_end_date, roles(name, billable_capacity_hours)");
      if (error) throw error;
      return data || [];
    }
  });

  // Filter people to only those who held the role during the selected date range
  const activePeople = useMemo(() => {
    return people.filter(p => {
      if (!p.employment_start_date) return true; // Assume active if no start_date
      const pStart = parseISO(p.employment_start_date);
      const pEnd = p.employment_end_date ? parseISO(p.employment_end_date) : new Date("2099-12-31");
      
      // Person's role must overlap with the [startDate, endDate] window
      return pEnd >= startDate && pStart <= endDate;
    });
  }, [people, startDate, endDate]);

  const { data: allocations = [] } = useQuery({
    queryKey: ["allocations_v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allocations_v2")
        .select("*");
      // If table doesn't exist yet, this will fail gracefully or we can just catch
      if (error) {
        console.error("Allocations error (maybe table not created yet?):", error);
        return [];
      }
      return data || [];
    }
  });

  // Calculate total working days in the selected period
  const totalPeriodWorkingDays = useMemo(() => getWorkingDays(startDate, endDate), [startDate, endDate]);

  // Pre-calculate availability for all people in the selected date range
  const personAvailability = useMemo(() => {
    const availability = new Map<string, { totalAllocated: number, remaining: number, capacity: number }>();
    
    for (const person of activePeople) {
      const personDailyCapacity = getPersonDailyCapacity(person);
      const personPeriodCapacityHours = totalPeriodWorkingDays * personDailyCapacity;

      // Find all allocations for this person that overlap with the date range
      const personAllocations = allocations.filter(a => a.person_id === person.id);
      let totalAllocatedHrs = 0;
      
      for (const alloc of personAllocations) {
        const aStart = parseISO(alloc.start_date);
        const aEnd = parseISO(alloc.end_date);
        const overlapStart = max([aStart, startDate]);
        const overlapEnd = min([aEnd, endDate]);

        if (overlapStart <= overlapEnd) {
          const wDays = getWorkingDays(overlapStart, overlapEnd);
          const hrs = wDays * personDailyCapacity * ((alloc.allocation_percentage || 100) / 100);
          totalAllocatedHrs += hrs;
        }
      }
      
      availability.set(person.id, {
        totalAllocated: totalAllocatedHrs,
        remaining: Math.max(0, personPeriodCapacityHours - totalAllocatedHrs),
        capacity: personPeriodCapacityHours
      });
    }
    return availability;
  }, [activePeople, allocations, startDate, endDate, totalPeriodWorkingDays]);

  // Calculate required hours per role for the selected client and time period
  const requiredByRole = useMemo(() => {
    const roleMap = new Map<string, { roleName: string; requiredHours: number }>();
    
    for (const scope of scopes) {
      const project = activeProjects.find(p => p.id === scope.project_id);
      if (!project || !project.start_date || !project.end_date) continue;
      if (!scope.roles || !scope.role_id) continue;
      
      const pStart = parseISO(project.start_date);
      const pEnd = parseISO(project.end_date);
      
      const hours = calculateOverlappingHours(
        pStart,
        pEnd,
        startDate,
        endDate,
        scope.scoped_hours || 0,
        scope.phase_percentages
      );
      
      if (hours > 0) {
        const existing = roleMap.get(scope.role_id) || { roleName: scope.roles.name, requiredHours: 0 };
        existing.requiredHours += hours;
        roleMap.set(scope.role_id, existing);
      }
    }
    
    return Array.from(roleMap.entries()).map(([roleId, data]) => ({
      roleId,
      ...data
    })).sort((a, b) => b.requiredHours - a.requiredHours);
  }, [scopes, activeProjects, startDate, endDate]);

  // Map roles to their allocations
  const activeClientName = sfAccount !== "All" ? sfAccount : parentAccount !== "All" ? parentAccount : ultimateParent !== "All" ? ultimateParent : "All";
  
  const roleStats = useMemo(() => {
    return requiredByRole.map(roleReq => {
      // Find all allocations for this client and role that overlap with our date range
      const roleAllocations = allocations.filter(a => 
        a.role_id === roleReq.roleId &&
        a.client_name === activeClientName
      );

      let allocatedHours = 0;
      const allocatedPeople: Array<{ id: string, name: string, hours: number, allocId: string }> = [];

      for (const alloc of roleAllocations) {
        const aStart = parseISO(alloc.start_date);
        const aEnd = parseISO(alloc.end_date);
        const overlapStart = max([aStart, startDate]);
        const overlapEnd = min([aEnd, endDate]);

        if (overlapStart <= overlapEnd) {
          const wDays = getWorkingDays(overlapStart, overlapEnd);
          const person = activePeople.find(p => p.id === alloc.person_id);
          const dailyCapacity = getPersonDailyCapacity(person);
          const hrs = wDays * dailyCapacity * ((alloc.allocation_percentage || 100) / 100);
          allocatedHours += hrs;
          if (person) {
            allocatedPeople.push({ id: person.id, name: person.name, hours: hrs, allocId: alloc.id });
          }
        }
      }

      return {
        ...roleReq,
        allocatedHours,
        allocatedPeople,
        shortfall: roleReq.requiredHours - allocatedHours,
      };
    });
  }, [requiredByRole, allocations, activeClientName, startDate, endDate, activePeople]);

  // Allocation Mutation
  const allocateMutation = useMutation({
    mutationFn: async ({ personId, roleId, pct }: { personId: string, roleId: string, pct: number }) => {
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");
      const { error } = await supabase
        .from("allocations_v2")
        .insert({
          client_name: activeClientName,
          person_id: personId,
          role_id: roleId,
          start_date: startStr,
          end_date: endStr,
          allocation_percentage: pct
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff allocated successfully");
      queryClient.invalidateQueries({ queryKey: ["allocations_v2"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to allocate: ${error.message}`);
    }
  });

  // Unallocation Mutation
  const unallocateMutation = useMutation({
    mutationFn: async (allocId: string) => {
      const { error } = await supabase
        .from("allocations_v2")
        .delete()
        .eq("id", allocId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff unallocated successfully");
      queryClient.invalidateQueries({ queryKey: ["allocations_v2"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to unallocate: ${error.message}`);
    }
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f5]">
      <div className="flex-1 overflow-auto">
        <div className="p-8 pb-32 space-y-8 max-w-[1600px] mx-auto">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-stone-200 gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold tracking-tight text-stone-900 mb-2">
                Resource Planner
              </h1>
              <p className="text-stone-500 text-lg">
                Allocate staff to booked client resources and identify shortfalls.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={officeFilter} onValueChange={(val: any) => setOfficeFilter(val)}>
                <SelectTrigger className="w-[140px] bg-white border-stone-200">
                  <SelectValue placeholder="Office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Global">Global</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-[280px]">
                <CustomDateRangePicker
                  start={startDate}
                  end={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 font-display">
                    <Filter className="w-4 h-4" /> Client Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Ultimate Parent</Label>
                    <Select value={ultimateParent} onValueChange={setUltimateParent}>
                      <SelectTrigger className="w-full bg-white border-stone-200">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Ultimate Parents</SelectItem>
                        {availableUltimateParents.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Parent Account</Label>
                    <Select value={parentAccount} onValueChange={setParentAccount}>
                      <SelectTrigger className="w-full bg-white border-stone-200">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Parent Accounts</SelectItem>
                        {availableParentAccounts.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">SF Account</Label>
                    <Select value={sfAccount} onValueChange={setSfAccount}>
                      <SelectTrigger className="w-full bg-white border-stone-200">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All SF Accounts</SelectItem>
                        {availableSfAccounts.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-3 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-display">Required vs Allocated Staff</CardTitle>
                  {activeClientName !== "All" && projectsMissingScopes.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 text-sm">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {projectsMissingScopes.length} {projectsMissingScopes.length === 1 ? 'project' : 'projects'} missing scopes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Projects Missing Scopes</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                          <p className="text-sm text-stone-500">
                            The following projects are scheduled to run during this timeframe but have zero scoped resource hours attached to them. They are not included in the calculations.
                          </p>
                          <ul className="space-y-2">
                            {projectsMissingScopes.map(p => (
                              <li key={p.id} className="text-sm font-medium border border-stone-200 p-3 rounded bg-stone-50 flex justify-between items-center gap-4">
                                <div>
                                  <div className="line-clamp-1" title={p.title}>{p.title}</div>
                                  <div className="text-xs text-stone-500 font-normal mt-1">
                                    {p.start_date ? format(parseISO(p.start_date), "dd-MM-yyyy") : ""} to {p.end_date ? format(parseISO(p.end_date), "dd-MM-yyyy") : ""}
                                  </div>
                                </div>
                                <div className="text-sm font-bold text-stone-700 whitespace-nowrap bg-white px-2 py-1 rounded border border-stone-200">
                                  £{p.gp_full_value?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {activeClientName === "All" ? (
                    <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-lg">
                      <p className="text-sm text-stone-500">Please select a specific client from the filters to view their resource requirements.</p>
                    </div>
                  ) : roleStats.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-lg">
                      <p className="text-sm text-stone-500">No scoped resources found for {activeClientName} in this time period.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {roleStats.map(stat => {
                        const requiredFte = (stat.requiredHours / (getWorkingDays(startDate, endDate) * HOURS_PER_DAY)).toFixed(1);
                        const allocatedFte = (stat.allocatedHours / (getWorkingDays(startDate, endDate) * HOURS_PER_DAY)).toFixed(1);
                        const pct = Math.min(100, (stat.allocatedHours / stat.requiredHours) * 100) || 0;
                        const isShortfall = stat.shortfall > 0;

                        return (
                          <div key={stat.roleId} className="p-5 border border-stone-200 rounded-lg bg-white space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg text-stone-900">{stat.roleName}</h3>
                                <p className="text-sm text-stone-500">
                                  {Math.round(stat.requiredHours)} hours required (~{requiredFte} FTEs)
                                </p>
                              </div>
                              <Badge variant={isShortfall ? "destructive" : "default"} className={!isShortfall ? "bg-green-500" : ""}>
                                {isShortfall ? `Shortfall: ${Math.round(stat.shortfall)} hrs` : `Excess: ${Math.abs(Math.round(stat.shortfall))} hrs`}
                              </Badge>
                            </div>

                            <Progress value={pct} className="h-2" />
                            
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-stone-600 font-medium">Allocated: {Math.round(stat.allocatedHours)} hrs (~{allocatedFte} FTEs)</span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8">
                                    <Users className="w-4 h-4 mr-2" /> Allocate Staff
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Allocate {stat.roleName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                    <p className="text-sm text-stone-500">
                                      Select people from your team to assign to {activeClientName} for this period.
                                    </p>
                                    {(() => {
                                      const dbOffice = officeFilter === "UK" ? "United Kingdom" : officeFilter === "US" ? "United States" : officeFilter;
                                      
                                      const availablePeopleList = activePeople.filter(p => {
                                        // 1. Role must match
                                        if (p.roles?.name !== stat.roleName) return false;
                                        // 2. Office must match (if not Global)
                                        if (dbOffice !== "Global" && p.office !== dbOffice) return false;
                                        // 3. Must not already be allocated to this specific client
                                        const isAlreadyAllocated = stat.allocatedPeople.some(ap => ap.id === p.id);
                                        if (isAlreadyAllocated) return false;
                                        // 4. Must have remaining availability
                                        const avail = personAvailability.get(p.id);
                                        if (avail && avail.remaining <= 0) return false;

                                        return true;
                                      });

                                      if (availablePeopleList.length === 0) {
                                        return <p className="text-sm text-stone-400 italic">No available people found with this role and office.</p>;
                                      }

                                      return availablePeopleList.map(person => {
                                        const avail = personAvailability.get(person.id);
                                        const personTotalCapacity = getPersonDailyCapacity(person) * totalPeriodWorkingDays;
                                        const remainingHrs = avail ? avail.remaining : personTotalCapacity;
                                        
                                        let calculatedPct = 100;
                                        if (personTotalCapacity > 0) {
                                          let desiredHrs = stat.shortfall > 0 ? Math.min(stat.shortfall, remainingHrs) : remainingHrs;
                                          calculatedPct = Math.max(1, Math.min(100, Math.round((desiredHrs / personTotalCapacity) * 100)));
                                        }

                                        return (
                                          <PersonAllocationRow
                                            key={person.id}
                                            person={person}
                                            stat={stat}
                                            personTotalCapacity={personTotalCapacity}
                                            remainingHrs={remainingHrs}
                                            calculatedPct={calculatedPct}
                                            allocateMutation={allocateMutation}
                                          />
                                        );
                                      });
                                    })()}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {stat.allocatedPeople.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-2">
                                {stat.allocatedPeople.map(p => (
                                  <Badge key={p.allocId} variant="secondary" className="bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center pr-1.5">
                                    {p.name} ({Math.round(p.hours)}h)
                                    <X 
                                      className="w-3 h-3 ml-1 cursor-pointer text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full" 
                                      onClick={() => unallocateMutation.mutate(p.allocId)} 
                                    />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
