import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO, isAfter, isBefore, max, min, differenceInMilliseconds, eachDayOfInterval, isWeekend } from "date-fns";
import { Users, CalendarRange, Filter, X, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

const HOURS_PER_DAY = 7.5;

function getWorkingDays(start: Date, end: Date): number {
  if (start > end) return 0;
  const days = eachDayOfInterval({ start, end });
  return days.filter((d) => !isWeekend(d)).length;
}

function calculateAgencyFee(project: any) {
  const getExtraNum = (proj: any, ...keys: string[]): number | null => {
    if (!proj) return null;
    const extra = proj.extra_data || {};
    const normalised = Object.fromEntries(Object.entries(extra).map(([k, v]) => [k.toLowerCase().trim(), v]));
    for (const k of keys) {
      const val = normalised[k.toLowerCase().trim()];
      if (val != null) {
        const n = parseFloat(String(val).replace(/[£$,%]/g, "").replace(/,/g, ""));
        if (!isNaN(n)) return n;
      }
    }
    return null;
  };

  const agencyFeePrice = project?.price ?? project?.revenue ?? getExtraNum(project, "total price", "price gbp/usd", "price");
  const agencyFeeMediaCost = project?.media_cost ?? getExtraNum(project, "media cost", "cost - paid media budget") ?? 0;
  const agencyFeeGrossBudget = project?.gross_budget ?? project?.budget_cost ?? getExtraNum(project, "gross budget full value (gbp / usd)", "gross budget full value", "gross budget", "cost - net budget") ?? 0;
  
  const agencyFee = agencyFeePrice !== null ? agencyFeePrice - agencyFeeMediaCost - agencyFeeGrossBudget : null;
  return agencyFee ?? 0;
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

function PersonAllocationRow({ person, stat, personTotalCapacity, remainingHrs, calculatedPct, allocateMutation, activeAllocations }: any) {
  const [selectedPct, setSelectedPct] = useState<number>(calculatedPct);
  
  useEffect(() => {
    setSelectedPct(calculatedPct);
  }, [calculatedPct]);
  
  const maxAvailablePct = Math.round((remainingHrs / personTotalCapacity) * 100);
  
  const rawOptions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, calculatedPct];
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
          <span className="text-emerald-600 font-medium">{Math.round(remainingHrs)}h billable capacity available</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedPct.toString()} onValueChange={(v) => setSelectedPct(parseInt(v))}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
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
        .select("id, title, sf_account, parent_account, ultimate_parent, office, start_date, end_date, stage, gp_full_value, revenue, price, media_cost, gross_budget, budget_cost, extra_data, project_scopes(id)")
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
          .select("*, roles(name, billable_capacity_hours)")
          .in("project_id", chunk);
        if (error) throw error;
        allScopes = allScopes.concat(data || []);
      }
      return allScopes;
    }
  });

  const historicalProjectIds = useMemo(() => {
    const twelveMonthsAgo = subMonths(new Date(), 12);
    return projects
      .filter(p => p.start_date && parseISO(p.start_date) >= twelveMonthsAgo && p.project_scopes && p.project_scopes.length > 0)
      .map(p => p.id);
  }, [projects]);

  const { data: historicalScopes = [] } = useQuery({
    queryKey: ["resource_planner_historical_scopes", historicalProjectIds],
    enabled: historicalProjectIds.length > 0 && projectsMissingScopes.length > 0,
    queryFn: async () => {
      const chunkSize = 200;
      let allScopes: any[] = [];
      for (let i = 0; i < historicalProjectIds.length; i += chunkSize) {
        const chunk = historicalProjectIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("project_scopes")
          .select("*, roles(name, billable_capacity_hours)")
          .in("project_id", chunk);
        if (error) throw error;
        allScopes = allScopes.concat(data || []);
      }
      return allScopes;
    }
  });

  const { combinedScopes, placeholderInfo } = useMemo(() => {
    let resultScopes = [...scopes];
    const info: Array<{ project: any, tier: number, reason: string }> = [];

    if (projectsMissingScopes.length === 0 || historicalScopes.length === 0) {
      return { combinedScopes: resultScopes, placeholderInfo: info };
    }

    const twelveMonthsAgo = subMonths(new Date(), 12);
    const validHistoricalProjects = projects.filter(p => p.start_date && parseISO(p.start_date) >= twelveMonthsAgo && p.project_scopes && p.project_scopes.length > 0);

    for (const missingProject of projectsMissingScopes) {
      const missingAgencyFee = calculateAgencyFee(missingProject);
      if (missingAgencyFee <= 0) continue;

      let matchedProjects: any[] = [];
      let tier = 0;
      let reason = "";

      // Tier 1: Same parent_account and office
      matchedProjects = validHistoricalProjects.filter(p => p.parent_account === missingProject.parent_account && p.office === missingProject.office);
      if (matchedProjects.length > 0) {
        tier = 1;
        reason = `Based on historical projects for ${missingProject.parent_account} in ${missingProject.office}`;
      } else {
        // Tier 2: Same ultimate_parent and office
        matchedProjects = validHistoricalProjects.filter(p => p.ultimate_parent === missingProject.ultimate_parent && p.office === missingProject.office);
        if (matchedProjects.length > 0) {
          tier = 2;
          reason = `Based on historical projects for overarching client ${missingProject.ultimate_parent} in ${missingProject.office}`;
        } else {
          // Tier 3: Same office
          matchedProjects = validHistoricalProjects.filter(p => p.office === missingProject.office);
          if (matchedProjects.length > 0) {
            tier = 3;
            reason = `Based on average historical projects across all clients in ${missingProject.office}`;
          }
        }
      }

      if (matchedProjects.length > 0) {
        const matchedIds = matchedProjects.map(p => p.id);
        const matchedScopes = historicalScopes.filter(s => matchedIds.includes(s.project_id));
        
        const totalAgencyFee = matchedProjects.reduce((sum, p) => sum + calculateAgencyFee(p), 0);
        if (totalAgencyFee > 0) {
          // Calculate total hours per role
          const roleHours = new Map<string, { roleName: string, hours: number, capacity: any }>();
          for (const s of matchedScopes) {
            if (!s.role_id) continue;
            const existing = roleHours.get(s.role_id) || { roleName: s.roles?.name || "", hours: 0, capacity: s.roles?.billable_capacity_hours };
            existing.hours += (s.scoped_hours || 0);
            roleHours.set(s.role_id, existing);
          }

          // Generate placeholder scopes
          const newScopes = Array.from(roleHours.entries()).map(([roleId, data]) => {
            const ratio = data.hours / totalAgencyFee;
            const placeholderHours = ratio * missingAgencyFee;
            return {
              id: `placeholder-${missingProject.id}-${roleId}`,
              project_id: missingProject.id,
              role_id: roleId,
              scoped_hours: placeholderHours,
              phase_percentages: null, // distribute evenly
              roles: { name: data.roleName, billable_capacity_hours: data.capacity },
              isPlaceholder: true
            };
          }).filter(s => s.scoped_hours > 0);

          if (newScopes.length > 0) {
            resultScopes = resultScopes.concat(newScopes);
            info.push({ project: missingProject, tier, reason });
          }
        }
      }
    }

    return { combinedScopes: resultScopes, placeholderInfo: info };
  }, [scopes, historicalScopes, projectsMissingScopes, projects]);

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
    const availability = new Map<string, { totalAllocated: number, remaining: number, capacity: number, activeAllocations: Array<{ client: string, hours: number }> }>();
    
    for (const person of activePeople) {
      const personDailyCapacity = getPersonDailyCapacity(person);
      const personPeriodCapacityHours = totalPeriodWorkingDays * personDailyCapacity;

      // Find all allocations for this person that overlap with the date range
      const personAllocations = allocations.filter(a => a.person_id === person.id);
      let totalAllocatedHrs = 0;
      const activeAllocations: Array<{ client: string, hours: number }> = [];
      
      for (const alloc of personAllocations) {
        const aStart = parseISO(alloc.start_date);
        const aEnd = parseISO(alloc.end_date);
        const overlapStart = max([aStart, startDate]);
        const overlapEnd = min([aEnd, endDate]);

        if (overlapStart <= overlapEnd) {
          const wDays = getWorkingDays(overlapStart, overlapEnd);
          const hrs = wDays * personDailyCapacity * ((alloc.allocation_percentage || 100) / 100);
          totalAllocatedHrs += hrs;
          activeAllocations.push({ client: alloc.client_name, hours: hrs });
        }
      }
      
      availability.set(person.id, {
        totalAllocated: totalAllocatedHrs,
        remaining: Math.max(0, personPeriodCapacityHours - totalAllocatedHrs),
        capacity: personPeriodCapacityHours,
        activeAllocations
      });
    }
    return availability;
  }, [activePeople, allocations, startDate, endDate, totalPeriodWorkingDays]);

  // Calculate required hours per role for the selected client and time period
  const requiredByRole = useMemo(() => {
    const roleMap = new Map<string, { roleName: string; requiredHours: number }>();
    
    for (const scope of combinedScopes) {
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
        const existing = roleMap.get(scope.role_id) || { 
          roleName: scope.roles.name, 
          requiredHours: 0,
          billableCapacityHours: scope.roles.billable_capacity_hours
        };
        existing.requiredHours += hours;
        roleMap.set(scope.role_id, existing);
      }
    }
    
    return Array.from(roleMap.entries()).map(([roleId, data]) => ({
      roleId,
      ...data
    })).sort((a, b) => b.requiredHours - a.requiredHours);
  }, [combinedScopes, activeProjects, startDate, endDate]);

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
                            The following projects are scheduled to run during this timeframe but have zero scoped resource hours attached to them. To ensure they are represented in the resource calculations, we have generated estimates based on historical data where possible.
                          </p>
                          <ul className="space-y-2">
                            {projectsMissingScopes.map(p => {
                              const placeholderMatch = placeholderInfo.find(info => info.project.id === p.id);
                              return (
                                <li key={p.id} className="text-sm font-medium border border-stone-200 p-3 rounded bg-stone-50 flex flex-col gap-2">
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <div className="line-clamp-1" title={p.title}>{p.title}</div>
                                      <div className="text-xs text-stone-500 font-normal mt-1">
                                        {p.start_date ? format(parseISO(p.start_date), "dd-MM-yyyy") : ""} to {p.end_date ? format(parseISO(p.end_date), "dd-MM-yyyy") : ""}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mb-1">Agency Fee</div>
                                      <div className="text-sm font-bold text-stone-700 whitespace-nowrap bg-white px-2 py-1 rounded border border-stone-200 inline-block">
                                        £{calculateAgencyFee(p).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                      </div>
                                    </div>
                                  </div>
                                  {placeholderMatch ? (
                                    <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 italic">
                                      Generated Placeholders: {placeholderMatch.reason}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded border border-stone-200 italic">
                                      Could not generate placeholders: No historical data match.
                                    </div>
                                  )}
                                </li>
                              );
                            })}
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
                        const dailyCapacity = getPersonDailyCapacity({ roles: { billable_capacity_hours: stat.billableCapacityHours } });
                        const requiredFte = (stat.requiredHours / (getWorkingDays(startDate, endDate) * dailyCapacity)).toFixed(1);
                        const allocatedFte = (stat.allocatedHours / (getWorkingDays(startDate, endDate) * dailyCapacity)).toFixed(1);
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
                              {(() => {
                                const roundedShortfall = Math.round(stat.shortfall);
                                const absShortfall = Math.abs(roundedShortfall);
                                
                                if (absShortfall <= 5) {
                                  return (
                                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full" title="Adequately resourced">
                                      <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                  );
                                }
                                
                                if (roundedShortfall > 5) {
                                  const shortfallFte = (roundedShortfall / (getWorkingDays(startDate, endDate) * dailyCapacity)).toFixed(1);
                                  return (
                                    <Badge className="bg-blue-500 hover:bg-blue-600 border-transparent text-white">
                                      Under-resourced: {roundedShortfall} hrs (~{shortfallFte} FTEs)
                                    </Badge>
                                  );
                                }
                                
                                const excessFte = (absShortfall / (getWorkingDays(startDate, endDate) * dailyCapacity)).toFixed(1);
                                return (
                                  <Badge variant="destructive">
                                    Over-resourced: {absShortfall} hrs (~{excessFte} FTEs)
                                  </Badge>
                                );
                              })()}
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
                                <DialogContent className="max-w-2xl">
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
                                        if (stat.shortfall <= 0) {
                                          calculatedPct = 0;
                                        } else if (personTotalCapacity > 0) {
                                          let desiredHrs = Math.min(stat.shortfall, remainingHrs);
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

                                    {(() => {
                                      const dbOffice = officeFilter === "UK" ? "United Kingdom" : officeFilter === "US" ? "United States" : officeFilter;
                                      
                                      const allocatedStaff = activePeople.filter(p => {
                                        if (p.roles?.name !== stat.roleName) return false;
                                        if (dbOffice !== "Global" && p.office !== dbOffice) return false;
                                        const avail = personAvailability.get(p.id);
                                        return avail && avail.activeAllocations && avail.activeAllocations.length > 0;
                                      });

                                      if (allocatedStaff.length === 0) return null;

                                      return (
                                        <div className="mt-6 border-t border-stone-200 pt-6">
                                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Currently Allocated Staff</h4>
                                          <div className="space-y-3">
                                            {allocatedStaff.map(person => {
                                              const avail = personAvailability.get(person.id)!;
                                              const personTotalCapacity = getPersonDailyCapacity(person) * totalPeriodWorkingDays;
                                              const utilization = Math.min(100, Math.round((avail.totalAllocated / personTotalCapacity) * 100)) || 0;
                                              
                                              return (
                                                <div key={person.id} className="flex flex-col p-3 border rounded-lg bg-stone-50/50 opacity-90">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                      <span className="font-medium text-stone-900 text-sm">{person.name}</span>
                                                      <div className="text-xs text-stone-500 mt-0.5">{person.office || "Global"} • {utilization}% utilized</div>
                                                    </div>
                                                    <Badge variant={utilization >= 100 ? "destructive" : "default"} className={utilization < 100 ? "bg-amber-500" : ""}>
                                                      {utilization >= 100 ? "At Capacity" : `${Math.round(avail.remaining)}h remaining`}
                                                    </Badge>
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {avail.activeAllocations.map((alloc: any, idx: number) => (
                                                      <Badge key={idx} variant="outline" className="text-[10px] bg-white border-stone-200 text-stone-600 font-medium py-0">
                                                        {alloc.client}: {Math.round(alloc.hours)}h
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
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
