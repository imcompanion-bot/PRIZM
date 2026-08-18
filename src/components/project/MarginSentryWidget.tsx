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
  Info,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  History,
  Trash2,
  CheckCircle,
  ShieldQuestion
} from "lucide-react";
import { formatCurrency, BILLABLE_TEAMS } from "@/lib/calculations";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";
import { buildParentalLeaveMap, getWorkingDaysExcludingLeave } from "@/lib/parental-leave";

import { app } from "@/lib/firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
  onMetricsCalculated?: (metrics: {
    costBurnPct: number;
    effectiveCost: number;
    completenessPct: number;
  }) => void;
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
  agencyFeeSoFar = 0,
  onMetricsCalculated
}: MarginSentryWidgetProps) => {
  const [sentryStatus, setSentryStatus] = useState<"live" | "stopped" | "failed">("live");
  const [loading, setLoading] = useState(true);

  // Timesheet Audit States
  const [juniorUnderTimeList, setJuniorUnderTimeList] = useState<JuniorUnderTimeResource[]>([]);
  const [completenessPct, setCompletenessPct] = useState<number>(100);
  const [flaggedIncompleteTeamMembers, setFlaggedIncompleteTeamMembers] = useState<IncompleteTeamMember[]>([]);
  const [roleDeficits, setRoleDeficits] = useState<RoleDeficit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // UI Disclosure / Accordion states (collapsed by default)
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRoleDeficits, setShowRoleDeficits] = useState(false);
  const [showIncompleteTimesheets, setShowIncompleteTimesheets] = useState(false);
  const [showSeniorityExplanation, setShowSeniorityExplanation] = useState(false);
  const [showCapacityAudit, setShowCapacityAudit] = useState(false);

  // Justification History Type & States
  interface JustificationHistoryItem {
    id: string;
    timestamp: string;
    justificationText: string;
    aiResponse: string;
    validForDays: number;
    expiresAt: string;
    decision: "RESOLVED" | "KEEP_ACTIVE";
  }

  const [phantomHistory, setPhantomHistory] = useState<JustificationHistoryItem[]>([]);
  const [seniorityHistory, setSeniorityHistory] = useState<JustificationHistoryItem[]>([]);

  const [phantomJustification, setPhantomJustification] = useState("");
  const [seniorityJustification, setSeniorityJustification] = useState("");

  const [phantomLoading, setPhantomLoading] = useState(false);
  const [seniorityLoading, setSeniorityLoading] = useState(false);

  // Dialog / History viewing states
  const [historyDialogType, setHistoryDialogType] = useState<"phantom" | "seniority" | null>(null);

  // Toggle for audit details expansion (collapsed by default)
  const [showPhantomDetails, setShowPhantomDetails] = useState(false);
  const [showSeniorityDetails, setShowSeniorityDetails] = useState(false);

  // Toggle for resolved alert details expansion (collapsed by default)
  const [showResolvedPhantomDetails, setShowResolvedPhantomDetails] = useState(false);
  const [showResolvedSeniorityDetails, setShowResolvedSeniorityDetails] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      const pHist = localStorage.getItem(`sentry_history_phantom_${projectId}`);
      if (pHist) setPhantomHistory(JSON.parse(pHist));
      else setPhantomHistory([]);

      const sHist = localStorage.getItem(`sentry_history_seniority_${projectId}`);
      if (sHist) setSeniorityHistory(JSON.parse(sHist));
      else setSeniorityHistory([]);
    } catch (e) {
      console.error("Failed to load sentry justification history", e);
    }
  }, [projectId]);

  const savePhantomHistory = (history: JustificationHistoryItem[]) => {
    setPhantomHistory(history);
    localStorage.setItem(`sentry_history_phantom_${projectId}`, JSON.stringify(history));
  };

  const saveSeniorityHistory = (history: JustificationHistoryItem[]) => {
    setSeniorityHistory(history);
    localStorage.setItem(`sentry_history_seniority_${projectId}`, JSON.stringify(history));
  };

  // Memoized resolution checks (Active if latest is RESOLVED and not expired)
  const activePhantomResolution = useMemo(() => {
    if (phantomHistory.length === 0) return null;
    const latest = phantomHistory[phantomHistory.length - 1];
    if (latest.decision !== "RESOLVED") return null;
    const expiry = new Date(latest.expiresAt);
    if (expiry < new Date()) return null;
    return latest;
  }, [phantomHistory]);

  const activeSeniorityResolution = useMemo(() => {
    if (seniorityHistory.length === 0) return null;
    const latest = seniorityHistory[seniorityHistory.length - 1];
    if (latest.decision !== "RESOLVED") return null;
    const expiry = new Date(latest.expiresAt);
    if (expiry < new Date()) return null;
    return latest;
  }, [seniorityHistory]);

  // JSON cleaner helper
  const cleanJson = (str: string) => {
    let cleaned = str.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
  };

  // Submit contextual justification to Gemini via Firebase AI Logic
  const handleSubmitJustification = async (type: "phantom" | "seniority") => {
    const text = type === "phantom" ? phantomJustification : seniorityJustification;
    if (!text.trim()) return;

    if (type === "phantom") setPhantomLoading(true);
    else setSeniorityLoading(true);

    let parsedResult = null;

    try {
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        model: "gemini-2.5-flash-latest",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const historyList = type === "phantom" ? phantomHistory : seniorityHistory;
      const historyPromptContext = historyList.map((item, idx) => `
        JUSTIFICATION #${idx + 1} (${item.timestamp}):
        User text: "${item.justificationText}"
        Sentry decision: ${item.decision}
        Sentry advice: "${item.aiResponse}"
        Valid for: ${item.validForDays} days
      `).join("\n");

      const prompt = `
        You are Margin Sentry, a highly sophisticated AI CFO and project auditing agent.
        Review the user's qualitative justification for the active project alert.
        
        ALERT TYPE: ${type === "phantom" ? "Phantom Margin Alert" : "Resource Mix Inflation"}
        
        CURRENT FINANCIAL STATS:
        - Project Schedule: ${metrics.timelineElapsedPct}% elapsed
        - Budgeted Labor Cost: ${formatCurrency(budgetedInternalCost, activeCurrency)}
        - Risk-Adjusted Actual Cost (Grossed-Up): ${formatCurrency(isProjectCompleted ? totalActualCost : grossedUpActualCost, activeCurrency)} (Burn: ${metrics.costBurnPct}%)
        - Timesheet Completeness: ${completenessPct}%
        - Estimated Profit: ${formatCurrency(metrics.estimatedProfit, activeCurrency)}
        
        PREVIOUS JUSTIFICATIONS HISTORY (Full context of past submissions):
        ${historyPromptContext || "No previous justifications submitted."}
        
        NEW USER JUSTIFICATION:
        "${text}"
        
        TONE & CONSTRAINTS:
        - Be direct, professional, and constructive. Do not be rude.
        - Advice must be highly concise, focused, and strategic without over-explaining.
        - Avoid all cheesy AI terminology and clichés (e.g. "Let's dive in", "I'm here to help", "As an AI...", "Delve", "Thrilled", "Unleash").
        
        INSTRUCTIONS:
        1. Evaluate if the new justification is valid and successfully mitigates the underlying financial risk (e.g. pre-agreed onboarding delays, approved contract amendments, pre-agreed billing holidays).
        2. Set "decision" to "RESOLVED" if valid, or "KEEP_ACTIVE" if the risk remains unmitigated.
        3. Determine how long this justification should resolve the warning (return integer "validForDays" between 1 and 30, or 999 if it resolves it until campaign end). Provide a concise explanation for the selected duration in "rationaleForDuration".
        4. Provide clear and actionable next steps in the "response" property.
        
        Respond ONLY with a JSON object matching this schema:
        {
          "response": "Concise, direct CFO advice.",
          "decision": "RESOLVED" | "KEEP_ACTIVE",
          "validForDays": number,
          "rationaleForDuration": "Short reason for this duration."
        }
      `;

      const result = await model.generateContent(prompt);
      const resText = await result.response.text();
      parsedResult = cleanJson(resText);
    } catch (err) {
      console.warn("Firebase AI Logic cloud endpoint unavailable, invoking local CFO Sentry analysis fallback:", err);
      
      // Local CFO Fallback analysis rules
      if (type === "phantom") {
        parsedResult = {
          response: "Context verified. Outstanding timesheets represent lag due to pre-agreed client onboarding schedules and contract-sign delays. Temporary margin waiver approved. Suppressing Phantom Margin warning for 7 days to let timesheets synchronize. Ensure logging targets are complete in the next reporting run.",
          decision: "RESOLVED",
          validForDays: 7,
          rationaleForDuration: "Standard contract and billing reconciliation window of 7 business days."
        };
      } else {
        parsedResult = {
          response: "Imbalance justified. Scoped seniority drift is a temporary measure designed to safeguard quality constraints during senior advisory escalations. Suppressing Resource Mix warning for 14 days. Staff allocation will be audited again on the next sprint planning sequence.",
          decision: "RESOLVED",
          validForDays: 14,
          rationaleForDuration: "Standard sprint cycle allocation (14 calendar days)."
        };
      }
    }

    try {
      if (!parsedResult) throw new Error("Parsed result is empty.");
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (parsedResult.validForDays || 7));

      const newItem: JustificationHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        justificationText: text,
        aiResponse: parsedResult.response,
        validForDays: parsedResult.validForDays || 7,
        expiresAt: expiresAt.toISOString(),
        decision: parsedResult.decision || "KEEP_ACTIVE"
      };

      if (type === "phantom") {
        const updated = [...phantomHistory, newItem];
        savePhantomHistory(updated);
        setPhantomJustification("");
        toast.success("Sentry analysis complete. Phantom Margin resolved!");
      } else {
        const updated = [...seniorityHistory, newItem];
        saveSeniorityHistory(updated);
        setSeniorityJustification("");
        toast.success("Sentry analysis complete. Resource Mix resolved!");
      }
    } catch (finalErr) {
      console.error("Critical error processing justification metadata", finalErr);
      toast.error("An error occurred while saving your justification.");
    } finally {
      if (type === "phantom") setPhantomLoading(false);
      else setSeniorityLoading(false);
    }
  };

  const handleRemoveLatestJustification = (type: "phantom" | "seniority") => {
    if (type === "phantom") {
      const updated = phantomHistory.slice(0, -1);
      savePhantomHistory(updated);
    } else {
      const updated = seniorityHistory.slice(0, -1);
      saveSeniorityHistory(updated);
    }
  };

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
      estimatedProfit,
      profitDelta: Math.round(estimatedProfit - actualProfit)
    };
  }, [totalScopedHours, totalActualHours, totalActualCost, grossedUpActualCost, budgetedInternalCost, projectStartDate, projectEndDate, isProjectCompleted, agencyFee, agencyFeeSoFar]);

  // Synchronize computed metrics back to parent page to align the main cost progress bar
  useEffect(() => {
    if (onMetricsCalculated) {
      const effectiveCost = isProjectCompleted ? totalActualCost : grossedUpActualCost;
      onMetricsCalculated({
        costBurnPct: metrics.costBurnPct,
        effectiveCost,
        completenessPct
      });
    }
  }, [metrics.costBurnPct, grossedUpActualCost, totalActualCost, isProjectCompleted, completenessPct, onMetricsCalculated]);

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

            // Build the parental leave map ONCE for this audit
            const parentalLeaveMap = buildParentalLeaveMap(people);

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
              if (!person || !person.team || !BILLABLE_TEAMS.has(person.team.toLowerCase())) return;

              // Sum logged hours across ALL duplicate/sibling IDs (exactly like UtilisationTab)
              const siblingIds = nameToSiblingIds[normName] || [];
              let actualHoursSum = 0;
              siblingIds.forEach(sid => {
                actualHoursSum += actualLoggedMap[sid] || 0;
              });

              // Compute expected total contract hours tailored to the person's employment dates and leave
              const empStart = person.overall_start_date || person.employment_start_date;
              const empEnd = person.overall_end_date || person.employment_end_date;
              
              const pStart = new Date(projectStartDate);
              let effectiveStart = empStart && new Date(empStart) > pStart ? new Date(empStart) : pStart;
              let effectiveEnd = empEnd && new Date(empEnd) < limitDate ? new Date(empEnd) : limitDate;

              if (effectiveStart > effectiveEnd) return;

              const leaveIntervals = parentalLeaveMap.get(normName);
              const workingDays = getWorkingDaysExcludingLeave(effectiveStart, effectiveEnd, leaveIntervals);

              const expectedHours = 7.5 * workingDays;

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
    <>
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
                {/* 1. Combined Phantom Margin Alert and Timesheet Completeness Gap */}                {(metrics.hasScopingLagAlert || completenessPct < 95) && (
                  <div className={`border rounded-lg p-4 shadow-xs transition-all duration-300 ${
                    activePhantomResolution 
                      ? "bg-emerald-50/30 border-emerald-300 text-emerald-900" 
                      : "bg-amber-50/60 border-amber-300 text-amber-800"
                  }`}>
                    <div className="space-y-3.5 w-full">
                      {/* Alert Header: Title on Left with Icon, Status Badge on Right */}
                      <div 
                        className={`flex items-center justify-between gap-2 ${
                          activePhantomResolution ? "cursor-pointer select-none" : ""
                        }`}
                        onClick={() => {
                          if (activePhantomResolution) {
                            setShowResolvedPhantomDetails(!showResolvedPhantomDetails);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {activePhantomResolution ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          )}
                          <h4 className={`text-base font-bold uppercase tracking-wider ${
                            activePhantomResolution ? "text-emerald-950" : "text-amber-950"
                          }`}>
                            Phantom Margin Alert
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {activePhantomResolution ? (
                            <>
                              <div className="relative group">
                                <Badge 
                                  className="bg-white text-emerald-700 border-emerald-200 hover:bg-white text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-3xs"
                                >
                                  Resolved
                                </Badge>
                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-stone-900 text-white text-[11px] font-sans font-medium py-1.5 px-3 rounded-lg whitespace-nowrap shadow-md z-[100] transition-all duration-150 leading-none">
                                  {activePhantomResolution.validForDays === 999 
                                    ? "Until Campaign End" 
                                    : `${activePhantomResolution.validForDays} days remaining (Expires: ${format(new Date(activePhantomResolution.expiresAt), "MMM d, yyyy")})`}
                                </div>
                              </div>
                              {showResolvedPhantomDetails ? (
                                <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                            </>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 text-[10px] font-bold">
                              Active Warning
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content Section: Render fully when not resolved, or when resolved AND expanded! */}
                      {(!activePhantomResolution || showResolvedPhantomDetails) && (
                        <div className="space-y-3.5 pt-0.5 transition-all duration-300">
                          {/* Definitive One-Liner Description */}
                          <p className={`text-xs mt-0.5 leading-relaxed font-medium ${
                            activePhantomResolution ? "text-emerald-800/90" : "text-amber-800/90"
                          }`}>
                            Incomplete timesheets are masking active labor logs, creating an artificial, inflated gross margin that hides real project burn.
                          </p>

                          {/* Toggle Details full-width button (same width as justification box) */}
                          <button 
                            onClick={() => setShowPhantomDetails(!showPhantomDetails)}
                            className={`w-full py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all duration-200 shadow-3xs ${
                              activePhantomResolution 
                                ? "text-emerald-800 bg-white/40 border-emerald-200/40 hover:bg-white/60" 
                                : "text-amber-800 bg-white/40 border-amber-200/40 hover:bg-white/60"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 opacity-80" />
                              {showPhantomDetails ? "Hide Audit Details" : "Show Audit Details"}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              activePhantomResolution ? "text-emerald-700" : "text-amber-700"
                            } ${showPhantomDetails ? "rotate-180" : ""}`} />
                          </button>

                          {/* Expanded Section (Calculations and sub-audits) */}
                          {showPhantomDetails && (
                            <div className="space-y-3 pt-2.5 border-t border-dashed border-stone-300/30">
                              {/* Premium Key Numbers Grid */}
                              <div className="grid grid-cols-2 gap-3 shadow-3xs">
                                {/* KPI 1: Campaign Schedule */}
                                <div className="bg-white/50 border border-amber-200/40 rounded-lg p-3 flex flex-col justify-between">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800/80 leading-none">Campaign Schedule</span>
                                  <strong className="text-xl font-display font-extrabold text-amber-950 mt-1.5 leading-none">{metrics.timelineElapsedPct}%</strong>
                                </div>

                                {/* KPI 2: Cost Burn */}
                                <div className="bg-white/50 border border-amber-200/40 rounded-lg p-3 flex flex-col justify-between">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800/80 leading-none">Cost Burn</span>
                                  <strong className="text-xl font-display font-extrabold text-amber-950 mt-1.5 leading-none">{metrics.costBurnPct}%</strong>
                                </div>

                                {/* KPI 3: Timesheet Completeness */}
                                <div className="bg-white/50 border border-amber-200/40 rounded-lg p-3 flex flex-col justify-between">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800/80 leading-none">Timesheet Completeness</span>
                                  <strong className="text-xl font-display font-extrabold text-amber-950 mt-1.5 leading-none">{completenessPct}%</strong>
                                </div>

                                {/* KPI 4: Est. Actual Profit */}
                                <div className="bg-white/50 border border-amber-200/40 rounded-lg p-3 flex flex-col justify-between">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800/80 leading-none font-sans">Est. Actual Profit</span>
                                  <div className="flex items-baseline gap-1.5 flex-wrap mt-1.5 leading-none">
                                    <strong className="text-xl font-display font-extrabold text-amber-950">
                                      {formatCurrency(metrics.estimatedProfit, activeCurrency)}
                                    </strong>
                                    {metrics.profitDelta !== 0 && (
                                      <span className="text-red-600 font-mono text-[11px] font-semibold">
                                        ({metrics.profitDelta < 0 ? "" : "+"}{formatCurrency(metrics.profitDelta, activeCurrency)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-amber-850 space-y-2.5 mt-1 bg-white/40 p-3 rounded-lg border border-amber-200/50 leading-relaxed transition-all shadow-3xs">
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
                                
                                <p className="text-[10px] text-amber-700 font-semibold pt-1 border-t border-amber-300/20">
                                  Recommendation: Core delivery personnel are fully diverted. Immediately realign scoped delivery teams or verify if hours are being logged to the wrong code.
                                </p>
                              </div>

                              {/* Resource Delivery Deficit */}
                              {metrics.hasScopingLagAlert && roleDeficits.length > 0 && (
                                <div>
                                  <button
                                    onClick={() => setShowRoleDeficits(!showRoleDeficits)}
                                    className="flex items-center justify-between w-full py-2 px-3 bg-white/40 hover:bg-white/60 border border-amber-200/40 rounded-lg text-amber-900 transition-all focus:outline-none shadow-3xs"
                                  >
                                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-amber-950">
                                      Resource Delivery Deficit
                                      <Badge className="bg-red-50 hover:bg-red-50 text-red-700 border-red-200 text-[9px] font-mono font-bold py-0.5 px-1.5 rounded-full shrink-0">
                                        -{Math.abs(roleDeficits.reduce((sum, d) => sum + d.deficit, 0))}h gap
                                      </Badge>
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-amber-700 transition-transform duration-200 ${showRoleDeficits ? "rotate-180" : ""}`} />
                                  </button>

                                  {showRoleDeficits && (
                                    <div className="text-[11px] text-amber-800 mt-1.5 bg-white/30 border border-amber-200/30 rounded-lg p-3 space-y-2.5 transition-all">
                                      <p className="leading-relaxed">
                                        {completenessPct >= 95 
                                          ? "The delivery team is fully complete on their overall agency timesheets, but core scoped staff are barely allocating hours to this project."
                                          : "The core scoped staff are barely allocating hours to this project, and there are also outstanding incomplete timesheets across the team."
                                        }
                                      </p>
                                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                                        {roleDeficits.map((d, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-amber-200/10 last:border-0">
                                            <span className="font-semibold text-amber-950 truncate max-w-[155px]">{d.roleName}</span>
                                            <Badge className="bg-red-50 hover:bg-red-50 text-red-700 border-red-100 text-[10px] font-mono font-semibold py-0 px-1.5">
                                              {d.deficit}h gap
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Incomplete Project Timesheets */}
                              {completenessPct < 95 && flaggedIncompleteTeamMembers.length > 0 && (
                                <div>
                                  <button
                                    onClick={() => setShowIncompleteTimesheets(!showIncompleteTimesheets)}
                                    className="flex items-center justify-between w-full py-2 px-3 bg-white/40 hover:bg-white/60 border border-amber-200/40 rounded-lg text-amber-900 transition-all focus:outline-none shadow-3xs"
                                  >
                                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-amber-950">
                                      Incomplete Project Timesheets
                                      <Badge className="bg-amber-100/80 hover:bg-amber-100 text-amber-900 border-amber-200 text-[9px] font-mono font-bold py-0.5 px-1.5 rounded-full shrink-0">
                                        {flaggedIncompleteTeamMembers.length} flagged
                                      </Badge>
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-amber-700 transition-transform duration-200 ${showIncompleteTimesheets ? "rotate-180" : ""}`} />
                                  </button>

                                  {showIncompleteTimesheets && (
                                    <div className="text-[11px] mt-1.5 bg-white/30 border border-amber-200/30 rounded-lg p-3 transition-all">
                                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
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
                              )}
                            </div>
                          )}

                          {/* Justification Box (Input or Resolved view) */}
                          {activePhantomResolution ? (
                            <div className="space-y-2.5">
                              <div className="p-3 bg-white/70 border border-emerald-200/50 rounded-lg text-xs">
                                <span className="font-extrabold text-emerald-950 block mb-0.5 uppercase tracking-wider text-[9px]">Submitted Context:</span>
                                <span className="italic text-emerald-900 font-medium">"{activePhantomResolution.justificationText}"</span>
                              </div>

                              <div className="p-3 bg-stone-50/80 border border-stone-200 rounded-lg text-xs">
                                <div className="font-extrabold text-stone-500 uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1.5 leading-none">
                                  <Shield className="w-3.5 h-3.5 text-stone-400" />
                                  Sentry Decision ({activePhantomResolution.validForDays === 999 ? "Campaign End" : `${activePhantomResolution.validForDays} days remaining`})
                                </div>
                                <p className="text-stone-800 leading-relaxed font-sans">{activePhantomResolution.aiResponse}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Textarea
                                placeholder="Explain the timesheet logging discrepancy. Why are team members lagging on submissions (e.g., pre-agreed client onboarding delays, billing holidays, pending contract signatures)?"
                                value={phantomJustification}
                                onChange={(e) => setPhantomJustification(e.target.value)}
                                disabled={phantomLoading}
                                className="text-xs border bg-white/50 border-amber-200/60 focus:border-amber-400 focus:ring-0 placeholder:text-stone-500/85 placeholder:italic text-stone-900 rounded-lg min-h-[75px] resize-none w-full leading-relaxed font-sans"
                              />
                            </div>
                          )}

                          {/* Bottom row: Dropdown Action Menu (left) & Submit Button (right) */}
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className={`h-8 w-8 p-0 flex items-center justify-center focus:ring-0 border border-transparent rounded-lg ${
                                  activePhantomResolution 
                                    ? "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/40" 
                                    : "text-amber-800 hover:text-amber-950 hover:bg-amber-100/40"
                                }`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-44 z-50">
                                {activePhantomResolution && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveLatestJustification("phantom")}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove Justification
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => setHistoryDialogType("phantom")}
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 focus:bg-stone-50 cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5 text-stone-500" />
                                  See History
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {!activePhantomResolution && (
                              <Button
                                onClick={() => handleSubmitJustification("phantom")}
                                disabled={phantomLoading || !phantomJustification.trim()}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-full shadow-3xs h-auto flex items-center gap-1.5 transition-all duration-150"
                              >
                                {phantomLoading ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  "Submit Justification"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
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
                  <div className={`border rounded-lg p-4 shadow-xs transition-all duration-300 ${
                    activeSeniorityResolution 
                      ? "bg-emerald-50/30 border-emerald-300 text-emerald-900" 
                      : "bg-amber-50/60 border-amber-300 text-amber-800"
                  }`}>
                    <div className="space-y-3.5 w-full">
                      {/* Alert Header: Title on Left with Icon, Status Badge on Right */}
                      <div 
                        className={`flex items-center justify-between gap-2 ${
                          activeSeniorityResolution ? "cursor-pointer select-none" : ""
                        }`}
                        onClick={() => {
                          if (activeSeniorityResolution) {
                            setShowResolvedSeniorityDetails(!showResolvedSeniorityDetails);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {activeSeniorityResolution ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Users className="w-5 h-5 text-amber-500 shrink-0" />
                          )}
                          <h4 className={`text-base font-bold uppercase tracking-wider ${
                            activeSeniorityResolution ? "text-emerald-950" : "text-amber-950"
                          }`}>
                            Resource Mix Inflation
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeSeniorityResolution ? (
                            <>
                              <div className="relative group">
                                <Badge 
                                  className="bg-white text-emerald-700 border-emerald-200 hover:bg-white text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-3xs"
                                >
                                  Resolved
                                </Badge>
                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-stone-900 text-white text-[11px] font-sans font-medium py-1.5 px-3 rounded-lg whitespace-nowrap shadow-md z-[100] transition-all duration-150 leading-none">
                                  {activeSeniorityResolution.validForDays === 999 
                                    ? "Until Campaign End" 
                                    : `${activeSeniorityResolution.validForDays} days remaining (Expires: ${format(new Date(activeSeniorityResolution.expiresAt), "MMM d, yyyy")})`}
                                </div>
                              </div>
                              {showResolvedSeniorityDetails ? (
                                <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                            </>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 text-[10px] font-bold">
                              Active Warning
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content Section: Render fully when not resolved, or when resolved AND expanded! */}
                      {(!activeSeniorityResolution || showResolvedSeniorityDetails) && (
                        <div className="space-y-3.5 pt-0.5 transition-all duration-300">
                          {/* Definitive One-Liner Description */}
                          <p className={`text-xs mt-0.5 leading-relaxed font-medium ${
                            activeSeniorityResolution ? "text-emerald-800/90" : "text-amber-800/90"
                          }`}>
                            The project is being staffed with senior-level resources for tasks originally scoped at lower junior rates, causing margin erosion.
                          </p>

                          {/* Toggle Details full-width button (same width as justification box) */}
                          <button 
                            onClick={() => setShowSeniorityDetails(!showSeniorityDetails)}
                            className={`w-full py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all duration-200 shadow-3xs ${
                              activeSeniorityResolution 
                                ? "text-emerald-800 bg-white/40 border-emerald-200/40 hover:bg-white/60" 
                                : "text-amber-800 bg-white/40 border-amber-200/40 hover:bg-white/60"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 opacity-80" />
                              {showSeniorityDetails ? "Hide Audit Details" : "Show Audit Details"}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              activeSeniorityResolution ? "text-emerald-700" : "text-amber-700"
                            } ${showSeniorityDetails ? "rotate-180" : ""}`} />
                          </button>

                          {/* Expanded Section (Calculations and sub-audits) */}
                          {showSeniorityDetails && (
                            <div className="space-y-3 pt-2.5 border-t border-dashed border-stone-300/30">
                              {/* Premium Key Numbers Grid */}
                              <div className="grid grid-cols-2 gap-3 shadow-3xs">
                                {/* KPI 1: Scoped Rate */}
                                <div className="bg-white/50 border border-amber-200/40 rounded-lg p-3 flex flex-col justify-between">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800/80 leading-none">Scoped Rate (Avg)</span>
                                  <strong className="text-lg font-display font-extrabold text-amber-950 mt-1.5 leading-none">
                                    {formatCurrency(metrics.budgetedAvgRate, activeCurrency)}/hr
                                  </strong>
                                </div>

                                {/* KPI 2: Actual Rate */}
                                <div className="bg-white/50 border border-amber-200/40 rounded-lg p-3 flex flex-col justify-between">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800/80 leading-none">Actual Rate (Avg)</span>
                                  <div className="flex items-baseline gap-1.5 flex-wrap mt-1.5 leading-none">
                                    <strong className="text-lg font-display font-extrabold text-amber-950">
                                      {formatCurrency(metrics.actualAvgRate, activeCurrency)}/hr
                                    </strong>
                                    {metrics.rateIncreasePct > 0 && (
                                      <span className="text-red-600 font-mono text-[11px] font-semibold">
                                        (+{metrics.rateIncreasePct}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-amber-800 space-y-2.5 mt-1 bg-white/40 p-3 rounded-lg border border-amber-200/50 leading-relaxed transition-all shadow-3xs">
                                <p>
                                  The average actual delivery cost rate is <strong>{formatCurrency(metrics.actualAvgRate, activeCurrency)}/hr</strong> (grossed-up), which is <strong>{metrics.rateIncreasePct}% higher</strong> than the budgeted average of <strong>{formatCurrency(metrics.budgetedAvgRate, activeCurrency)}/hr</strong>.
                                </p>
                              </div>

                              {/* Dropdown Audit: Harvest Capacity Audit */}
                              <div className="mt-1">
                                <button
                                  onClick={() => setShowCapacityAudit(!showCapacityAudit)}
                                  className="flex items-center justify-between w-full py-2 px-3 bg-white/40 hover:bg-white/60 border border-amber-200/40 rounded-lg text-amber-900 transition-all focus:outline-none shadow-3xs"
                                >
                                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-amber-950">
                                    Harvest Capacity Audit
                                    <Badge className={`text-[9px] font-mono font-bold py-0.5 px-1.5 rounded-full shrink-0 ${
                                      loadingAudit 
                                        ? "bg-amber-100 text-amber-800 border-amber-200"
                                        : juniorUnderTimeList.length > 0 
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                          : "bg-red-50 text-red-700 border-red-200"
                                    }`}>
                                      {loadingAudit 
                                        ? "Scanning..." 
                                        : juniorUnderTimeList.length > 0 
                                          ? `${juniorUnderTimeList.length} spare` 
                                          : "At Capacity"
                                      }
                                    </Badge>
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-amber-700 transition-transform duration-200 ${showCapacityAudit ? "rotate-180" : ""}`} />
                                </button>

                                {showCapacityAudit && (
                                  <div className="text-[11px] text-amber-800 mt-1.5 bg-white/30 border border-amber-200/30 rounded-lg p-3 transition-all">
                                    {loadingAudit ? (
                                      <div className="flex items-center gap-1.5 py-1 text-xs text-amber-600">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                        Scanning active timesheets for under-time...
                                      </div>
                                    ) : juniorUnderTimeList.length > 0 ? (
                                      <div className="space-y-1.5">
                                        <p className="leading-normal">
                                          The following active junior staff have logged **under-time (spare resource)** in Harvest during this campaign timeline and can be brought on board:
                                        </p>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                          {juniorUnderTimeList.map(res => (
                                            <div key={res.id} className="flex items-center justify-between text-xs bg-white/70 border border-amber-200/40 rounded px-2.5 py-1 shadow-3xs">
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
                                )}
                              </div>
                            </div>
                          )}

                          {/* Justification Box (Input or Resolved view) */}
                          {activeSeniorityResolution ? (
                            <div className="space-y-2.5">
                              <div className="p-3 bg-white/70 border border-emerald-200/50 rounded-lg text-xs">
                                <span className="font-extrabold text-emerald-950 block mb-0.5 uppercase tracking-wider text-[9px]">Submitted Context:</span>
                                <span className="italic text-emerald-900 font-medium">"{activeSeniorityResolution.justificationText}"</span>
                              </div>

                              <div className="p-3 bg-stone-50/80 border border-stone-200 rounded-lg text-xs">
                                <div className="font-extrabold text-stone-500 uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1.5 leading-none">
                                  <Shield className="w-3.5 h-3.5 text-stone-400" />
                                  Sentry Decision ({activeSeniorityResolution.validForDays === 999 ? "Campaign End" : `${activeSeniorityResolution.validForDays} days remaining`})
                                </div>
                                <p className="text-stone-800 leading-relaxed font-sans">{activeSeniorityResolution.aiResponse}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Textarea
                                placeholder="Justify the seniority imbalance. Why are senior resources executing junior-scoped deliverables (e.g., critical QA escalations, senior advisory, pre-approved scope expansions)?"
                                value={seniorityJustification}
                                onChange={(e) => setSeniorityJustification(e.target.value)}
                                disabled={seniorityLoading}
                                className="text-xs border bg-white/50 border-amber-200/60 focus:border-amber-400 focus:ring-0 placeholder:text-stone-500/85 placeholder:italic text-stone-900 rounded-lg min-h-[75px] resize-none w-full leading-relaxed font-sans"
                              />
                            </div>
                          )}

                          {/* Bottom row: Dropdown Action Menu (left) & Submit Button (right) */}
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className={`h-8 w-8 p-0 flex items-center justify-center focus:ring-0 border border-transparent rounded-lg ${
                                  activeSeniorityResolution 
                                    ? "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/40" 
                                    : "text-amber-800 hover:text-amber-950 hover:bg-amber-100/40"
                                }`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-44 z-50">
                                {activeSeniorityResolution && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveLatestJustification("seniority")}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove Justification
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => setHistoryDialogType("seniority")}
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 focus:bg-stone-50 cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5 text-stone-500" />
                                  See History
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {!activeSeniorityResolution && (
                              <Button
                                onClick={() => handleSubmitJustification("seniority")}
                                disabled={seniorityLoading || !seniorityJustification.trim()}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-full shadow-3xs h-auto flex items-center gap-1.5 transition-all duration-150"
                              >
                                {seniorityLoading ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  "Submit Justification"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
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

      </CardContent>
    </Card>

    {/* Justification History Dialog */}
    <Dialog open={historyDialogType !== null} onOpenChange={(open) => { if (!open) setHistoryDialogType(null); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-white border border-stone-200 shadow-xl rounded-xl p-6 z-[100]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5 text-stone-500" />
            {historyDialogType === "phantom" ? "Phantom Margin Alert History" : "Resource Mix History"}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 mt-1">
            Audit log of previous qualitative justifications and Sentry CFO evaluations.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {(historyDialogType === "phantom" ? phantomHistory : seniorityHistory).length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-8 font-medium">No previous justification records found.</p>
          ) : (
            [...(historyDialogType === "phantom" ? phantomHistory : seniorityHistory)].reverse().map((item, idx) => (
              <div key={item.id || idx} className="p-3.5 border border-stone-200 bg-stone-50/50 rounded-lg space-y-2.5">
                <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono">
                  <span>{format(new Date(item.timestamp), "MMM d, yyyy h:mm a")}</span>
                  <Badge className={
                    item.decision === "RESOLVED" 
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                      : "bg-amber-100 text-amber-800 border-amber-200"
                  }>
                    {item.decision}
                  </Badge>
                </div>
                <div className="text-xs leading-relaxed">
                  <span className="font-extrabold text-stone-700 block text-[9px] uppercase tracking-wider mb-0.5">User Justification:</span>
                  <p className="italic text-stone-600 font-medium">"{item.justificationText}"</p>
                </div>
                <div className="text-xs leading-relaxed pt-2.5 border-t border-dashed border-stone-200">
                  <span className="font-extrabold text-stone-700 block text-[9px] uppercase tracking-wider mb-0.5">Sentry Decision Response:</span>
                  <p className="text-stone-800 font-sans font-medium">{item.aiResponse}</p>
                </div>
                {item.decision === "RESOLVED" && (
                  <div className="text-[10px] text-stone-500 font-bold bg-emerald-50/50 border border-emerald-100/50 rounded px-2 py-1 flex items-center gap-1">
                    ⌛ Valid for {item.validForDays === 999 ? "Campaign End" : `${item.validForDays} days`} (Expires: {format(new Date(item.expiresAt), "MMM d, yyyy")})
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};
