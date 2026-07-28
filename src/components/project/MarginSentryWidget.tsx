import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Loader2, 
  Users, 
  ShieldAlert,
  Info
} from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { differenceInDays } from "date-fns";

interface MarginSentryWidgetProps {
  projectId: string;
  totalScopedHours: number;
  totalActualHours: number;
  totalActualCost: number;
  budgetedInternalCost: number;
  projectStartDate: string;
  projectEndDate: string;
  activeCurrency: string;
  timeEntries: any[];
  people: any[];
  agencyFee?: number | null;
  agencyFeeSoFar?: number | null;
}

interface JuniorUnderTimeResource {
  id: string;
  name: string;
  roleName: string;
  targetHours: number;
  loggedHours: number;
  spareHours: number;
}

interface IncompleteTeamMember {
  name: string;
  completeness: number;
}

interface RoleDeficit {
  roleName: string;
  scopedHours: number;
  expectedHoursSoFar: number;
  actualHoursLogged: number;
  deficit: number;
}

export const MarginSentryWidget = ({
  projectId,
  totalScopedHours,
  totalActualHours,
  totalActualCost,
  budgetedInternalCost,
  projectStartDate,
  projectEndDate,
  activeCurrency,
  timeEntries,
  people,
  agencyFee = 0,
  agencyFeeSoFar = 0
}: MarginSentryWidgetProps) => {
  const [sentryStatus, setSentryStatus] = useState<"live" | "stopped" | "failed">("live");
  const [loading, setLoading] = useState(true);

  // Timesheet Audit States
  const [juniorUnderTimeList, setJuniorUnderTimeList] = useState<JuniorUnderTimeResource[]>([]);
  const [completenessPct, setCompletenessPct] = useState<number>(100);
  const [flaggedIncompleteTeamMembers, setFlaggedIncompleteTeamMembers] = useState<IncompleteTeamMember[]>([]);
  const [roleDeficits, setRoleDeficits] = useState<RoleDeficit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    const fetchSentryStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("agent_states")
          .eq("id", "margin_sentry")
          .single();

        if (!error && data) {
          setSentryStatus(data.status as "live" | "stopped" | "failed");
        }
      } catch (err) {
        console.warn("Failed to fetch Margin Sentry status, falling back to live.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSentryStatus();
  }, [projectId]);

  // helper to check if employee is active
  const isPersonActive = (p: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = p.employment_start_date ? new Date(p.employment_start_date) : null;
    const end = p.employment_end_date ? new Date(p.employment_end_date) : null;
    
    if (start && start > today) return false;
    if (end && end < today) return false;
    return true;
  };

  // 1. Project Lifecycle Filter
  const isProjectCompleted = useMemo(() => {
    const end = new Date(projectEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end < today;
  }, [projectEndDate]);

  // Effective actual cost grossed up if timesheets are incomplete (< 95%)
  const grossedUpActualCost = useMemo(() => {
    if (completenessPct >= 95 || isProjectCompleted) return totalActualCost;
    const factor = 100 / Math.max(50, completenessPct);
    return totalActualCost * factor;
  }, [totalActualCost, completenessPct, isProjectCompleted]);

  // Calculations for Margin Sentry
  const metrics = useMemo(() => {
    const today = new Date();
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);

    // Timeline calculation
    const totalDays = differenceInDays(end, start);
    const elapsedDays = Math.max(0, differenceInDays(today < start ? start : today > end ? end : today, start));
    const timelineElapsedPct = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

    // Use grossed-up cost if timesheets are incomplete to prevent false confidence
    const effectiveCost = isProjectCompleted ? totalActualCost : grossedUpActualCost;
    const costBurnPct = budgetedInternalCost > 0 ? (effectiveCost / budgetedInternalCost) * 100 : 0;

    // Seniority Mix calculations
    const budgetedAvgRate = totalScopedHours > 0 ? budgetedInternalCost / totalScopedHours : 0;
    const actualAvgRate = totalActualHours > 0 ? effectiveCost / totalActualHours : 0;
    const rateIncreasePct = budgetedAvgRate > 0 ? ((actualAvgRate - budgetedAvgRate) / budgetedAvgRate) * 100 : 0;

    // Velocity Anomaly Trigger: Cost Burn substantially outpaces Timeline Elapsed (active projects only)
    const velocityCreepGap = costBurnPct - timelineElapsedPct;
    const hasVelocityAnomaly = !isProjectCompleted && velocityCreepGap > 25 && costBurnPct > 50;

    // Seniority Imbalance Trigger: Actual rate is higher than scoped by 10%+ (active projects only)
    const hasSeniorityImbalance = !isProjectCompleted && rateIncreasePct >= 10 && totalActualHours > 10;

    // Scoping Under-Burn & Phantom Margin Alert (active projects only)
    // Triggered when Timeline is elapsed >= 40% but Cost Burn is behind by 20%+
    const scopingLagGap = timelineElapsedPct - costBurnPct;
    const hasScopingLagAlert = !isProjectCompleted && timelineElapsedPct >= 40 && scopingLagGap >= 20;

    // Financial margins
    const actualProfit = (agencyFeeSoFar ?? 0) - totalActualCost;
    const actualMargin = agencyFeeSoFar && agencyFeeSoFar > 0 ? Math.round((actualProfit / agencyFeeSoFar) * 100) : 0;
    const budgetedProfit = (agencyFee ?? 0) - budgetedInternalCost;
    const budgetedMargin = agencyFee && agencyFee > 0 ? Math.round((budgetedProfit / agencyFee) * 100) : 0;

    // Estimated profit based on grossed-up actual cost
    const estimatedProfit = (agencyFeeSoFar ?? 0) - grossedUpActualCost;

    return {
      timelineElapsedPct: Math.round(timelineElapsedPct),
      costBurnPct: Math.round(costBurnPct),
      budgetedAvgRate,
      actualAvgRate,
      rateIncreasePct: Math.round(rateIncreasePct),
      velocityCreepGap: Math.round(velocityCreepGap),
      hasVelocityAnomaly,
      hasSeniorityImbalance,
      hasScopingLagAlert,
      actualProfit,
      actualMargin,
      budgetedMargin,
      estimatedProfit
    };
  }, [totalScopedHours, totalActualHours, totalActualCost, grossedUpActualCost, budgetedInternalCost, projectStartDate, projectEndDate, isProjectCompleted, agencyFee, agencyFeeSoFar]);

  // Helper to fetch time entries in chunks to bypass Supabase's default 1000-row limitation
  const fetchTimeEntriesPaginated = async (personIds: string[], startDateStr: string, endDateStr: string) => {
    const allEntries: any[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("time_entries")
        .select("person_id, hours")
        .in("person_id", personIds)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allEntries.push(...data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }
    return allEntries;
  };

  // 2. Dynamic Timesheet & Completeness Audit
  useEffect(() => {
    const runTimesheetAudit = async () => {
      // Clear data if project is completed
      if (isProjectCompleted) {
        setJuniorUnderTimeList([]);
        setCompletenessPct(100);
        setFlaggedIncompleteTeamMembers([]);
        setRoleDeficits([]);
        return;
      }

      try {
        setLoadingAudit(true);

        const today = new Date();
        
        // Calculate the end of the last completed month (standard alignment with UtilisationTab default views)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);

        // Fallback to previous Sunday if the project started in the current month
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
        const lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - daysToSubtract);
        lastSunday.setHours(23, 59, 59, 999);

        const projectStart = new Date(projectStartDate);
        const projectEnd = new Date(projectEndDate);

        // Align with the last completed month if the project started before then.
        // Otherwise, fallback to last Sunday to show weekly progress for newly started projects.
        let limitDate = projectStart < lastMonthEnd ? lastMonthEnd : lastSunday;
        if (limitDate > projectEnd) {
          limitDate = projectEnd;
        }

        if (projectStart > limitDate) {
          // Project is in its first week, no completed weeks to audit yet
          setCompletenessPct(100);
          setFlaggedIncompleteTeamMembers([]);
          setRoleDeficits([]);
          setJuniorUnderTimeList([]);
          return;
        }

        const limitDateStr = limitDate.toISOString().split("T")[0];

        // Part A: Calculate Timesheet Completeness Rate for Active Project Team (from campaign start to limit date)
        const activeTeamIds = [...new Set(timeEntries.map(te => te.person_id))].filter(Boolean);
        let calculatedCompleteness = 100;

        if (activeTeamIds.length > 0) {
          // Map each active team member to all of their duplicate/sibling IDs (same name, case-insensitive)
          const nameToSiblingIds: Record<string, string[]> = {};
          const activePeopleNames = new Set<string>();

          activeTeamIds.forEach(pid => {
            const person = people.find(p => p.id === pid);
            if (!person || !isPersonActive(person)) return;

            const normName = person.name.trim().toLowerCase();
            activePeopleNames.add(normName);

            // Find all duplicate contract rows in the directory for this name
            const siblings = people.filter(p => p.name.trim().toLowerCase() === normName);
            nameToSiblingIds[normName] = siblings.map(s => s.id);
          });

          // Flatten to get all sibling IDs to query in a single bulk DB check
          const allQueryIds = [...new Set(Object.values(nameToSiblingIds).flat())];

          if (allQueryIds.length > 0) {
            // Fetch timesheet records for active team across ALL projects in the range (paginated to avoid 1000-row limit)
            const teamAllEntries = await fetchTimeEntriesPaginated(allQueryIds, projectStartDate, limitDateStr);

            let workingDaysSoFar = 0;
            let curr = new Date(projectStartDate);
            while (curr <= limitDate) {
               const day = curr.getDay();
               if (day !== 0 && day !== 6) workingDaysSoFar++;
               curr.setDate(curr.getDate() + 1);
            }
            if (workingDaysSoFar <= 0) workingDaysSoFar = 1;

            // Aggregate actual hours by each individual ID
            const actualLoggedMap: Record<string, number> = {};
            teamAllEntries.forEach(entry => {
              actualLoggedMap[entry.person_id] = (actualLoggedMap[entry.person_id] || 0) + Number(entry.hours);
            });

            let completenessSum = 0;
            let teamCount = 0;
            const incompleteList: IncompleteTeamMember[] = [];

            // Audit timesheets per distinct person name
            activePeopleNames.forEach(normName => {
              const person = people.find(p => p.name.trim().toLowerCase() === normName && isPersonActive(p));
              if (!person) return;

              // Sum logged hours across ALL duplicate/sibling IDs (exactly like UtilisationTab)
              const siblingIds = nameToSiblingIds[normName] || [];
              let actualHoursSum = 0;
              siblingIds.forEach(sid => {
                actualHoursSum += actualLoggedMap[sid] || 0;
              });

              // Compute expected total contract hours (7.5 hours per working day, matching UtilisationTab expected hours)
              const expectedHours = 7.5 * workingDaysSoFar;

              if (expectedHours > 0) {
                const score = Math.min(100, (actualHoursSum / expectedHours) * 100);
                const roundedScore = Math.round(score);
                completenessSum += score;
                teamCount++;

                // Flag if completeness is below 95% (medium to high incomplete percentage)
                if (roundedScore < 95) {
                  incompleteList.push({
                    name: person.name,
                    completeness: roundedScore
                  });
                }
              }
            });

            if (teamCount > 0) {
              calculatedCompleteness = Math.round(completenessSum / teamCount);
            }

            // Update the list of incomplete team members, sorted by worst-first
            setFlaggedIncompleteTeamMembers(incompleteList.sort((a, b) => a.completeness - b.completeness));
          }
        }
        setCompletenessPct(calculatedCompleteness);

        // Part B: Scoping Role Deficit & Under-Staffing Audit
        if (metrics.hasScopingLagAlert) {
          const { data: scopesData, error: sErr } = await supabase
            .from("project_scopes")
            .select("*, roles(name)")
            .eq("project_id", projectId);

          if (!sErr && scopesData) {
            const tempRoleDeficit: RoleDeficit[] = [];
            scopesData.forEach(scope => {
              const roleName = scope.roles?.name || "Unknown Role";
              const scopedHours = Number(scope.scoped_hours) || 0;
              
              // Expected hours so far based on timeline elapsed percentage
              const expectedSoFar = (scopedHours * metrics.timelineElapsedPct) / 100;
              
              // Actual hours logged for this role on THIS project
              const roleTimeEntries = timeEntries.filter((te: any) => {
                const person = people.find(p => p.id === te.person_id);
                return person?.role_id === scope.role_id;
              });
              const actualLogged = roleTimeEntries.reduce((sum, te) => sum + (Number(te.hours) || 0), 0);
              const deficit = actualLogged - expectedSoFar;
              
              if (deficit < -5) { // Only record meaningful deficits (greater than 5 hours)
                tempRoleDeficit.push({
                  roleName,
                  scopedHours,
                  expectedHoursSoFar: Math.round(expectedSoFar),
                  actualHoursLogged: Math.round(actualLogged),
                  deficit: Math.round(deficit)
                });
              }
            });

            // Sort by largest deficit first
            setRoleDeficits(tempRoleDeficit.sort((a, b) => a.deficit - b.deficit));
          }
        } else {
          setRoleDeficits([]);
        }

        // Part C: Harvest Under-Time Scan for Junior Staff (Departed Employees Filtered Out)
        if (metrics.hasSeniorityImbalance) {
          const juniorStaff = people.filter(p => 
            p.roles?.name?.toLowerCase().includes("junior") && isPersonActive(p)
          );

          if (juniorStaff.length > 0) {
            const juniorIds = juniorStaff.map(p => p.id);
            const juniorEntries = await fetchTimeEntriesPaginated(juniorIds, projectStartDate, projectEndDate);

            let workingDays = 0;
            let curr = new Date(projectStartDate);
            const end = new Date(projectEndDate);
            while (curr <= end) {
              const day = curr.getDay();
              if (day !== 0 && day !== 6) workingDays++;
              curr.setDate(curr.getDate() + 1);
            }
            if (workingDays <= 0) workingDays = 1;

            const loggedHoursMap: Record<string, number> = {};
            juniorEntries.forEach(entry => {
              loggedHoursMap[entry.person_id] = (loggedHoursMap[entry.person_id] || 0) + Number(entry.hours);
            });

            const results: JuniorUnderTimeResource[] = juniorStaff.map(p => {
              const weeklyCapacity = p.roles?.billable_capacity_hours || 37.5;
              const targetHours = (weeklyCapacity / 5) * workingDays;
              const loggedHours = loggedHoursMap[p.id] || 0;
              const spareHours = Number((targetHours - loggedHours).toFixed(1));

              return {
                id: p.id,
                name: p.name,
                roleName: p.roles?.name || "Junior Resource",
                targetHours,
                loggedHours,
                spareHours
              };
            });

            const availableJuniors = results
              .filter(r => r.spareHours > 1)
              .sort((a, b) => b.spareHours - a.spareHours);

            setJuniorUnderTimeList(availableJuniors);
          } else {
            setJuniorUnderTimeList([]);
          }
        } else {
          setJuniorUnderTimeList([]);
        }

      } catch (err) {
        console.error("Failed to run timesheet audit:", err);
      } finally {
        setLoadingAudit(false);
      }
    };

    runTimesheetAudit();
  }, [metrics.hasSeniorityImbalance, projectStartDate, projectEndDate, people, isProjectCompleted, timeEntries, metrics.timelineElapsedPct]);

  if (loading) {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6 flex items-center justify-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-[#4b70d8]" />
          <span className="ml-2 text-sm text-gray-500 font-medium">Margin Sentry scanning scope data...</span>
        </CardContent>
      </Card>
    );
  }

  if (sentryStatus === "stopped") {
    return (
      <Card className="border-gray-200 bg-gray-50/50">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-gray-400" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Margin Sentry is Inactive</h3>
              <p className="text-xs text-gray-500 mt-0.5">This agent has been paused by the administrator in Settings.</p>
            </div>
          </div>
          <Badge variant="outline" className="text-gray-500 bg-gray-100 border-gray-200">STANDBY</Badge>
        </CardContent>
      </Card>
    );
  }

  if (sentryStatus === "failed") {
    return (
      <Card className="border-red-200 bg-red-50/20">
        <CardContent className="p-6">
          <div className="flex gap-3 text-red-700">
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-red-900">Margin Sentry Integration Error</h3>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                The Margin Sentry agent encountered an active connection failure. Please restart diagnostics in the settings panel to resolve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyAlerts = metrics.hasVelocityAnomaly || metrics.hasSeniorityImbalance || metrics.hasScopingLagAlert || completenessPct < 95;

  return (
    <Card className="border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      <CardHeader className="border-b border-gray-100 p-5 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-[#4b70d8]">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                Margin Sentry
              </CardTitle>
              <CardDescription className="text-xs">
                Active gross margin and scoping integrity guardian
              </CardDescription>
            </div>
          </div>
          {isProjectCompleted ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
              COMPLETED
            </Badge>
          ) : (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {isProjectCompleted ? (
          /* Archive State View */
          <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-4 flex gap-3 text-gray-600">
            <Info className="w-5 h-5 shrink-0 text-gray-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Campaign Archived</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Margin Sentry has finalized all audits for this project. No retroactive recommendations are generated for completed campaigns.
              </p>
            </div>
          </div>
        ) : (
          /* Live Campaign Alert Processing */
          <>
            {hasAnyAlerts ? (
              <div className="space-y-3">
                {/* 1. Combined Phantom Margin Alert and Timesheet Completeness Gap */}
                {(metrics.hasScopingLagAlert || completenessPct < 95) && (
                  <div className="bg-amber-50/60 border border-amber-300 rounded-lg p-4 flex gap-3 text-amber-800 shadow-xs">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-2.5 w-full">
                      <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                        Phantom Margin Alert
                      </h4>
                      
                      <div className="text-xs text-amber-800 space-y-2.5 leading-relaxed">
                        {metrics.hasScopingLagAlert && (
                          <p>
                            The campaign schedule is <strong>{metrics.timelineElapsedPct}% elapsed</strong> but cost burn is only <strong>{metrics.costBurnPct}%</strong>. This creates an artificial <strong>{metrics.actualMargin}% margin</strong> (Profit: <strong>{formatCurrency(metrics.actualProfit, activeCurrency)}</strong>).
                          </p>
                        )}
                        
                        {completenessPct < 95 && (
                          <p>
                            Team timesheets are only <strong>{completenessPct}% complete</strong>. Estimated profit currently stands at <strong>{formatCurrency(metrics.estimatedProfit, activeCurrency)}</strong>.
                          </p>
                        )}

                        {/* Resource Scoping Gap / Under-Staffing Audit */}
                        {metrics.hasScopingLagAlert && roleDeficits.length > 0 && (
                          <div className="text-[11px] text-amber-900 border-t border-amber-300/40 pt-2">
                            <span className="font-bold block mb-1">Resource Delivery Deficit (Under-Staffing):</span>
                            <p className="mb-2 leading-relaxed text-[11px]">
                              Despite team timesheets being fully logged (100% complete overall), the core scoped staff are barely logging hours to this project. The campaign has a **{Math.abs(roleDeficits.reduce((sum, d) => sum + d.deficit, 0))}h deficit** across key roles:
                            </p>
                            <div className="space-y-1 max-h-28 overflow-y-auto bg-white/40 p-2 rounded border border-amber-200/50">
                              {roleDeficits.map((d, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-amber-200/10 last:border-0">
                                  <span className="font-medium text-amber-950 truncate max-w-[155px]">{d.roleName}</span>
                                  <Badge className="bg-red-50 hover:bg-red-50 text-red-700 border-red-100 text-[10px] font-mono font-semibold py-0 px-1.5">
                                    {d.deficit}h gap
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {completenessPct < 95 && flaggedIncompleteTeamMembers.length > 0 && (
                          <div className="text-[11px] text-amber-900 border-t border-amber-300/40 pt-2">
                            <span className="font-bold block mb-1">Incomplete Project Timesheets:</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto bg-white/40 p-2 rounded border border-amber-200/50">
                              {flaggedIncompleteTeamMembers.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-amber-200/10 last:border-0">
                                  <span className="font-semibold text-amber-950 truncate max-w-[150px]">{m.name}</span>
                                  <Badge className="bg-amber-100/50 hover:bg-amber-100/50 text-amber-800 border-amber-200/20 text-[10px] font-mono py-0 px-1.5">
                                    {m.completeness}% complete
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-amber-700 font-semibold pt-1">
                        Recommendation: Core delivery personnel are fully diverted. Immediately realign scoped delivery teams or verify if hours are being logged to the wrong code.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Velocity Burn Anomaly */}
                {metrics.hasVelocityAnomaly && (
                  <div className="bg-red-50/50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <div className="space-y-1 w-full">
                      <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">Velocity Burn Anomaly</h4>
                      <p className="text-xs text-red-700 leading-relaxed">
                        Delivery cost burn is currently running at <strong>{metrics.costBurnPct}%</strong> (grossed-up due to completeness), outpacing elapsed project schedule (<strong>{metrics.timelineElapsedPct}%</strong>) by <strong>{metrics.velocityCreepGap}%</strong>.
                      </p>
                      <p className="text-[10px] text-red-600 font-semibold pt-1">
                        Recommendation: Immediately re-verify active deliverable priorities or scale down high-cost task scoping.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Resource Mix Inflation */}
                {metrics.hasSeniorityImbalance && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-700">
                    <Users className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-2.5 w-full">
                      <div>
                        <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Resource Mix Inflation</h4>
                        <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                          The average actual delivery cost rate is <strong>{formatCurrency(metrics.actualAvgRate, activeCurrency)}/hr</strong> (grossed-up), which is <strong>{metrics.rateIncreasePct}% higher</strong> than the budgeted average of <strong>{formatCurrency(metrics.budgetedAvgRate, activeCurrency)}/hr</strong>.
                        </p>
                      </div>

                      {/* Harvest Under-Time Live Scan Box */}
                      <div className="border-t border-amber-200/50 pt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                          Harvest Capacity Audit (Active Staff)
                        </span>

                        {loadingAudit ? (
                          <div className="flex items-center gap-1.5 py-1 text-xs text-amber-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            Scanning active timesheets for under-time...
                          </div>
                        ) : juniorUnderTimeList.length > 0 ? (
                          <div className="space-y-1.5">
                            <p className="text-xs text-amber-800 leading-normal">
                              The following active junior staff have logged **under-time (spare resource)** in Harvest during this campaign timeline and can be brought on board:
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {juniorUnderTimeList.map(res => (
                                <div key={res.id} className="flex items-center justify-between text-xs bg-white/70 border border-amber-200/40 rounded px-2 py-1 shadow-2xs">
                                  <span className="font-semibold text-gray-800 truncate max-w-[140px]" title={res.name}>
                                    {res.name} <span className="font-normal text-gray-500 text-[10px]">({res.roleName})</span>
                                  </span>
                                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 text-[10px] font-semibold font-mono py-0 px-1.5">
                                    {res.spareHours}h spare
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="bg-red-50/50 border border-red-100 rounded px-2.5 py-1.5 text-xs text-red-800 font-medium">
                              ⚠️ AGENCY AT CAPACITY
                            </div>
                            <p className="text-[11px] text-amber-800 leading-normal">
                              All active junior staff are currently operating at maximum capacity in Harvest. Other strategic routes must be considered: engage freelance contractors or renegotiate scoped caps with the client.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">Margin Sentry Uncompromised</h4>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Project delivery cost burn is aligned. Staffing seniority indexes match original budget scoping expectations.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Hard Numbers Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Scoped Rate (Avg)</span>
            <p className="text-sm font-semibold font-mono text-gray-700">
              {formatCurrency(metrics.budgetedAvgRate, activeCurrency)}/hr
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Actual Rate (Avg)</span>
            <p className="text-sm font-semibold font-mono text-gray-900 flex items-center gap-1.5">
              {formatCurrency(metrics.actualAvgRate, activeCurrency)}/hr
              {metrics.rateIncreasePct > 0 && (
                <span className={`text-[10px] font-bold ${metrics.rateIncreasePct >= 10 ? "text-red-500" : "text-amber-500"}`}>
                  (+{metrics.rateIncreasePct}%)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Comparative Cost Burn VS Schedule */}
        <div className="space-y-3.5 border-t border-gray-100 pt-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Timeline Schedule Elapsed</span>
              <span className="text-gray-900 font-mono">{metrics.timelineElapsedPct}%</span>
            </div>
            <Progress value={metrics.timelineElapsedPct} className="h-1.5 bg-gray-100 [&>div]:bg-gray-400" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Resource Cost-Burn Spent</span>
              <span className={`font-mono ${metrics.hasVelocityAnomaly ? "text-red-500" : "text-gray-900"}`}>
                {metrics.costBurnPct}%
              </span>
            </div>
            <Progress 
              value={metrics.costBurnPct} 
              className="h-1.5 bg-gray-100 [&>div]:bg-blue-500" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
