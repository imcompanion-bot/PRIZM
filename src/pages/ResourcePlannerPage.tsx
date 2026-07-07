import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, startOfMonth, endOfMonth, parseISO, isAfter, isBefore, max, min, differenceInMilliseconds, eachDayOfInterval, isWeekend } from "date-fns";
import { Users, CalendarRange, Filter } from "lucide-react";
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

// Helper function to calculate the overlapping hours for a scope based on its 12 phases
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
        .select("id, title, sf_account, parent_account, ultimate_parent, office, start_date, end_date")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Extract unique tiers for dropdowns based on selections
  const availableUltimateParents = useMemo(() => {
    const parents = new Set(projects.map(p => p.ultimate_parent).filter(Boolean) as string[]);
    return Array.from(parents).sort();
  }, [projects]);

  const availableParentAccounts = useMemo(() => {
    const p = ultimateParent === "All" ? projects : projects.filter(pr => pr.ultimate_parent === ultimateParent);
    const parents = new Set(p.map(pr => pr.parent_account).filter(Boolean) as string[]);
    return Array.from(parents).sort();
  }, [projects, ultimateParent]);

  const availableSfAccounts = useMemo(() => {
    let p = projects;
    if (ultimateParent !== "All") p = p.filter(pr => pr.ultimate_parent === ultimateParent);
    if (parentAccount !== "All") p = p.filter(pr => pr.parent_account === parentAccount);
    const sf = new Set(p.map(pr => pr.sf_account).filter(Boolean) as string[]);
    return Array.from(sf).sort();
  }, [projects, ultimateParent, parentAccount]);

  // Determine the active client filter
  const activeProjects = useMemo(() => {
    let p = projects;
    if (ultimateParent !== "All") p = p.filter(pr => pr.ultimate_parent === ultimateParent);
    if (parentAccount !== "All") p = p.filter(pr => pr.parent_account === parentAccount);
    if (sfAccount !== "All") p = p.filter(pr => pr.sf_account === sfAccount);
    if (officeFilter !== "Global") p = p.filter(pr => pr.office === officeFilter);
    return p;
  }, [projects, ultimateParent, parentAccount, sfAccount, officeFilter]);

  const activeProjectIds = useMemo(() => activeProjects.map(p => p.id), [activeProjects]);

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
        .select("id, name, office, roles(name)");
      if (error) throw error;
      return data || [];
    }
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ["resource_allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_allocations")
        .select("*");
      // If table doesn't exist yet, this will fail gracefully or we can just catch
      if (error) {
        console.error("Allocations error (maybe table not created yet?):", error);
        return [];
      }
      return data || [];
    }
  });

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
    })).sort((a, b) => a.roleName.localeCompare(b.roleName));
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
      const allocatedPeople: Array<{ id: string, name: string, hours: number }> = [];

      for (const alloc of roleAllocations) {
        const aStart = parseISO(alloc.start_date);
        const aEnd = parseISO(alloc.end_date);
        const overlapStart = max([aStart, startDate]);
        const overlapEnd = min([aEnd, endDate]);

        if (overlapStart <= overlapEnd) {
          const wDays = getWorkingDays(overlapStart, overlapEnd);
          const person = people.find(p => p.id === alloc.person_id);
          // Assuming 7.5 hrs/day capacity. If they have specific billable_capacity_hours, we could use that.
          const hrs = wDays * HOURS_PER_DAY * ((alloc.allocation_percentage || 100) / 100);
          allocatedHours += hrs;
          if (person) {
            allocatedPeople.push({ id: person.id, name: person.name, hours: hrs });
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
  }, [requiredByRole, allocations, activeClientName, startDate, endDate, people]);

  // Allocation Mutation
  const allocateMutation = useMutation({
    mutationFn: async ({ personId, roleId, pct }: { personId: string, roleId: string, pct: number }) => {
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");
      const { error } = await supabase
        .from("resource_allocations")
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
      queryClient.invalidateQueries({ queryKey: ["resource_allocations"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to allocate: ${error.message}`);
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
                  <SelectItem value="UK">UK / Companion</SelectItem>
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
                <CardHeader>
                  <CardTitle className="text-xl font-display">Required vs Allocated Staff</CardTitle>
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
                                    {people.filter(p => p.roles?.name === stat.roleName).map(person => {
                                      const isAlreadyAllocated = stat.allocatedPeople.some(ap => ap.id === person.id);
                                      return (
                                        <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg bg-stone-50">
                                          <div className="flex flex-col">
                                            <span className="font-medium text-stone-900">{person.name}</span>
                                            <span className="text-xs text-stone-500">{person.office || "Global"}</span>
                                          </div>
                                          {isAlreadyAllocated ? (
                                            <Badge variant="secondary">Allocated</Badge>
                                          ) : (
                                            <Button 
                                              size="sm" 
                                              onClick={() => allocateMutation.mutate({ personId: person.id, roleId: stat.roleId, pct: 100 })}
                                              disabled={allocateMutation.isPending}
                                            >
                                              Assign
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {people.filter(p => p.roles?.name === stat.roleName).length === 0 && (
                                      <p className="text-sm text-stone-400 italic">No people found with this role.</p>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {stat.allocatedPeople.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-2">
                                {stat.allocatedPeople.map(p => (
                                  <Badge key={p.id} variant="secondary" className="bg-stone-100 text-stone-700 hover:bg-stone-200">
                                    {p.name} ({Math.round(p.hours)}h)
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
