import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Info, Download, Filter, Target, CalendarDays, ExternalLink, Activity, Check, ChevronsUpDown,
  LayoutGrid, List, Search, Building2, TrendingUp, Folder, ArrowLeft, Briefcase, Users2, DollarSign, 
  ArrowUpRight, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, FileSpreadsheet, Plus, Sparkles, FolderOpen,
  Clock, MoreHorizontal, Star, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, addMonths, subMonths, endOfMonth, isAfter, eachDayOfInterval, isWeekend } from "date-fns";
import { formatCurrency, calculateInternalCostPerHour, formatCurrencyFixed, getDailyCapacity } from "@/lib/calculations";
import { ClientTeamBuilder } from "@/components/client-portfolio/ClientTeamBuilder";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import type { DateRange } from "react-day-picker";

// ── Helpers ──

function computeMonthlyHours(
  projectStart: Date,
  projectEnd: Date,
  scopedHours: number,
  phasePercentagesRaw: Record<string, any>
): Record<string, number> {
  if (scopedHours <= 0) return {};
  
  const parsePct = (v: any): number => {
    if (v == null) return 0;
    const parsed = parseFloat(String(v).replace(/[%]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  const hasAnyPct = Object.values(phasePercentagesRaw || {}).some(v => parsePct(v) > 0);
  const phaseCount = hasAnyPct ? 12 : 4;
  const effectivePcts: Record<string, any> = hasAnyPct 
    ? (phasePercentagesRaw || {})
    : { "Phase 1": 30, "Phase 2": 30, "Phase 3": 20, "Phase 4": 20 };

  const totalDays = Math.max(1, Math.round((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysPerPhase = totalDays / phaseCount;
  const monthlyHours: Record<string, number> = {};

  for (let phase = 1; phase <= phaseCount; phase++) {
    const rawVal = effectivePcts[`Phase ${phase}`] ?? effectivePcts[`phase ${phase}`] ?? effectivePcts[`Phase${phase}`] ?? effectivePcts[`phase${phase}`] ?? effectivePcts[String(phase)];
    const pct = parsePct(rawVal);
    
    if (pct <= 0) continue;
    const phaseHours = (pct / 100) * scopedHours;
    const phaseStartDay = Math.round((phase - 1) * daysPerPhase);
    const phaseEndDay = Math.round(phase * daysPerPhase) - 1;
    const phaseStart = new Date(projectStart.getTime() + phaseStartDay * 24 * 60 * 60 * 1000);
    const phaseEnd = new Date(projectStart.getTime() + phaseEndDay * 24 * 60 * 60 * 1000);
    const phaseDays = eachDayOfInterval({ start: phaseStart, end: phaseEnd });
    const workingDays = phaseDays.filter((d) => !isWeekend(d));
    if (workingDays.length === 0) continue;
    const hoursPerDay = phaseHours / workingDays.length;
    for (const day of workingDays) {
      const monthKey = format(day, "yyyy-MM");
      monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + hoursPerDay;
    }
  }
  return monthlyHours;
}

function getMonthRange(start: string, end: string): string[] {
  if (!start || !end) return [];
  const parsedStart = parseISO(start);
  const parsedEnd = parseISO(end);
  if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) return [];

  const months: string[] = [];
  let current = startOfMonth(parsedStart);
  const last = startOfMonth(parsedEnd);
  
  // Guard against infinite loop if dates are invalid or reversed
  let iterations = 0;
  while (!isAfter(current, last) && iterations < 500) {
    months.push(format(current, "yyyy-MM"));
    current = addMonths(current, 1);
    iterations++;
  }
  return months;
}

function mergeMonthlyHours(target: Record<string, number>, source: Record<string, number>) {
  for (const [month, hours] of Object.entries(source)) {
    target[month] = (target[month] || 0) + hours;
  }
}

function getWorkingDaysInMonth(monthKey: string): number {
  if (!monthKey || monthKey.length < 7) return 0;
  const parsed = parseISO(`${monthKey}-01`);
  if (isNaN(parsed.getTime())) return 0;

  const start = startOfMonth(parsed);
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  return days.filter(d => !isWeekend(d)).length;
}

// ── Toggle Group ──

function ToggleGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border-border p-0.5 bg-muted/50 bg-[#cfddf2] border-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            value === opt.value ? "bg-background shadow-sm text-white bg-[#4b71d8]" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Variance Label ──

function VarianceLabel({ actual, scoped, unitMode, capacity, scopedCapacity, showNA }: { actual: number; scoped: number; unitMode?: "hours" | "pct"; capacity?: number; scopedCapacity?: number; showNA?: boolean }) {
  const naLabel = showNA ? <div className="text-[10px] font-medium leading-tight text-muted-foreground/50">N/A</div> : null;
  if (unitMode === "pct" && capacity && capacity > 0) {
    const actualPct = (actual / capacity) * 100;
    const sCap = (scopedCapacity && scopedCapacity > 0) ? scopedCapacity : capacity;
    const scopedPct = (scoped / sCap) * 100;
    const diff = actualPct - scopedPct;
    if (Math.abs(diff) < 0.5) return naLabel;
    const isOver = diff > 0;
    return (
      <div className={cn("text-[10px] font-medium leading-tight", isOver ? "text-destructive" : "text-success")}>
        {isOver ? "+" : ""}{Math.round(diff)}%
      </div>
    );
  }
  const diff = actual - scoped;
  if (Math.abs(diff) < 0.5) return naLabel;
  const isOver = diff > 0;
  return (
    <div className={cn("text-[10px] font-medium leading-tight", isOver ? "text-destructive" : "text-success")}>
      {isOver ? "+" : ""}{Math.round(diff).toLocaleString()}h
    </div>
  );
}

// ── Fuzzy Search Helpers ──
const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = a[i - 1] === b[j - 1] 
        ? tmp[i - 1][j - 1] 
        : Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + 1);
    }
  }
  return tmp[a.length][b.length];
};

const isFuzzyClientMatch = (clientName: string, searchTerm: string): boolean => {
  const name = clientName.toLowerCase().trim();
  const search = searchTerm.toLowerCase().trim();
  if (!search) return true;
  
  // Exact or substring match of the full name
  if (name.includes(search)) return true;

  // Split name into words to check minor spelling mistakes / fuzzy matching per-word
  const words = name.split(/[\s\-_]+/);
  for (const word of words) {
    if (word.includes(search) || search.includes(word)) return true;
    
    const distance = getLevenshteinDistance(word, search);
    // Allow edit distance of 1 for short queries, and up to 2 for longer ones
    const maxAllowed = search.length <= 4 ? 1 : 2;
    if (distance <= maxAllowed) return true;
  }

  // Check Levenshtein distance on the entire full name
  const distanceFull = getLevenshteinDistance(name, search);
  const maxAllowedFull = search.length <= 4 ? 1 : 2;
  if (distanceFull <= maxAllowedFull) return true;

  return false;
};

// ── Main Component ──

type ViewMode = "scoped" | "actual";
type UnitMode = "pct" | "hours";

const ClientPortfolioPage = () => {
  const { isMaster, isAmbassador } = usePermissions();
  const canArchive = isMaster || isAmbassador;

  const currentMonth = format(new Date(), "yyyy-MM");
  const [searchParams, setSearchParams] = useSearchParams();
  const clientParam = searchParams.get("client") || "";
  
  const [selectedClient, setSelectedClient] = useState<string>(clientParam);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedOffice, setSelectedOffice] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("scoped");
  const [unitMode, setUnitMode] = useState<UnitMode>("pct");
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);
  
  // New visual and tab states
  const [layoutMode, setLayoutMode] = useState<"tile" | "list">("tile");
  const [activeTab, setActiveTab] = useState<string>("projects");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Sorting and Google Drive Link Popup states
  const [sortField, setSortField] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState<string>("");
  const [editingProjectUrl, setEditingProjectUrl] = useState<string>("");
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);

  // Fetch globally inactive/archived clients from Supabase data_imports table
  const { data: dbInactiveClients = [], refetch: refetchInactiveClients } = useQuery({
    queryKey: ["global_inactive_clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_imports" as any)
        .select("dataset")
        .like("dataset", "inactive_client:%");
      if (error) {
        console.error("Failed to load inactive clients from Supabase:", error);
        return [];
      }
      return (data || []).map((row: any) => row.dataset.replace("inactive_client:", ""));
    }
  });



  // Starred / pinned clients tracking via localStorage
  const [starredClients, setStarredClients] = useState<string[]>(() => {
    const stored = localStorage.getItem("prism_starred_clients");
    return stored ? JSON.parse(stored) : [];
  });

  const handleToggleClientStar = (clientName: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setStarredClients(prev => {
      const next = prev.includes(clientName)
        ? prev.filter(c => c !== clientName)
        : [...prev, clientName];
      localStorage.setItem("prism_starred_clients", JSON.stringify(next));
      if (next.includes(clientName)) {
        toast.success(`Pinned "${clientName}" to the top of your portfolio.`);
      } else {
        toast.success(`Unpinned "${clientName}" from the top.`);
      }
      return next;
    });
  };

  const handleToggleClientInactive = async (clientName: string) => {
    if (!canArchive) {
      toast.error("Access Denied: Only Master and Ambassador roles can archive or restore accounts globally.");
      return;
    }

    const isCurrentlyInactive = inactiveClients.includes(clientName);
    const datasetKey = `inactive_client:${clientName}`;

    try {
      if (isCurrentlyInactive) {
        // Restore client: delete from data_imports table
        const { error } = await supabase
          .from("data_imports" as any)
          .delete()
          .eq("dataset", datasetKey);

        if (error) throw error;
        toast.success(`Client "${clientName}" has been successfully restored to active status globally.`);
      } else {
        // Archive client: insert into data_imports table
        const { error } = await supabase
          .from("data_imports" as any)
          .insert({
            dataset: datasetKey,
            last_imported_at: new Date().toISOString(),
            row_count: 0
          } as any);

        if (error) throw error;
        toast.success(`Client "${clientName}" has been successfully marked as inactive globally.`);
      }

      // Refetch from database to keep the UI perfectly synchronized
      refetchInactiveClients();
    } catch (err: any) {
      console.error("Error toggling client inactive status:", err);
      toast.error(`Database Error: Could not update status for "${clientName}".`);
    }
  };

  // Sync selectedClient with URL Search Param
  useEffect(() => {
    setSelectedClient(clientParam);
  }, [clientParam]);

  const handleSelectClient = (clientName: string) => {
    setSelectedClient(clientName);
    setSelectedAccount("all");
    if (clientName) {
      setSearchParams({ client: clientName });
    } else {
      setSearchParams({});
    }
  };

  const hoverPreviewDays = useMemo(() => {
    if (!customStart || customEnd || !hoveredDate) return [];
    if (hoveredDate <= customStart) return [];
    const days = eachDayOfInterval({ start: customStart, end: hoveredDate });
    return days.slice(1);
  }, [customStart, customEnd, hoveredDate]);

  // Fetch all projects (paginated to avoid 1000-row limit)
  const { data: projects = [], isLoading: loadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ["portfolio_projects_all"],
    queryFn: async () => {
      const allData: any[] = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, sf_account, parent_account, ultimate_parent, office, start_date, end_date, revenue, gross_budget, budget_cost, price, media_cost, fee_calc_currency, last_fee_calc_url, gp_margin_pct, project_scopes(id, role_id, scoped_hours, phase_percentages)")
          .order("id")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  useEffect(() => {
    if (loadingProjects) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 98) {
            clearInterval(interval);
            return 98;
          }
          const inc = prev < 50 ? 12 : prev < 80 ? 6 : 1;
          return prev + inc;
        });
      }, 70);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [loadingProjects]);

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("id, name, billable_capacity_hours").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch people to map role -> team
  const { data: people = [] } = useQuery({
    queryKey: ["people_role_teams"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase.from("people").select("role_id, team").range(from, from + 999);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      return allData;
    },
  });

  // Build role -> team mapping (most common team for each role)
  const roleTeamMap = useMemo(() => {
    const teamCounts: Record<string, Record<string, number>> = {};
    for (const p of people) {
      if (!p.role_id || !p.team) continue;
      if (!teamCounts[p.role_id]) teamCounts[p.role_id] = {};
      teamCounts[p.role_id][p.team] = (teamCounts[p.role_id][p.team] || 0) + 1;
    }
    const map: Record<string, string> = {};
    for (const [roleId, counts] of Object.entries(teamCounts)) {
      let bestTeam = "Other";
      let bestCount = 0;
      for (const [team, count] of Object.entries(counts)) {
        if (count > bestCount) { bestTeam = team; bestCount = count; }
      }
      map[roleId] = bestTeam;
    }
    return map;
  }, [people]);

  // Build role headcount map
  const roleHeadcount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of people) {
      if (!p.role_id) continue;
      counts[p.role_id] = (counts[p.role_id] || 0) + 1;
    }
    return counts;
  }, [people]);

  // Build role billable capacity (hours/day) map
  const roleBillableCapacity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of roles) map[r.id] = r.billable_capacity_hours ? getDailyCapacity(Number(r.billable_capacity_hours)) : 7.5;
    return map;
  }, [roles]);

  // Build client list from ultimate_parent
  const clients = useMemo(() => {
    const clientSet = new Set<string>();
    for (const p of projects) {
      if (p.ultimate_parent) clientSet.add(p.ultimate_parent);
    }
    return Array.from(clientSet).sort();
  }, [projects]);

  // Automatically archive clients with no project end date within [TODAY] - 365 days
  const autoArchivedClients = useMemo(() => {
    const today = new Date();
    // 365 days ago
    const cutoffDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const cutoffStr = format(cutoffDate, "yyyy-MM-dd");

    // We evaluate clients that exist in our projects dataset
    const clientsWithRecentProjects = new Set<string>();
    const allClients = new Set<string>();

    for (const p of projects) {
      if (!p.ultimate_parent) continue;
      allClients.add(p.ultimate_parent);
      
      // If the project end date is on or after the cutoff date, the client has a recent project
      if (p.end_date && p.end_date >= cutoffStr) {
        clientsWithRecentProjects.add(p.ultimate_parent);
      }
    }

    // Clients with NO recent projects are auto-archived
    const autoArchived = Array.from(allClients).filter(
      (client) => !clientsWithRecentProjects.has(client)
    );

    return autoArchived;
  }, [projects]);

  // Combine DB inactive clients and dynamically auto-archived clients
  const inactiveClients = useMemo(() => {
    const merged = new Set<string>([...dbInactiveClients, ...autoArchivedClients]);
    return Array.from(merged);
  }, [dbInactiveClients, autoArchivedClients]);

  // Build aggregate directory stats for each unique client
  const clientDirectoryStats = useMemo(() => {
    const stats: Record<string, {
      name: string;
      projectCount: number;
      activeProjectCount: number;
      totalRevenue: number;
      totalHours: number;
      primaryOffice: string;
      feeCalcsCount: number;
      assignedRolesCount: number;
    }> = {};

    const todayStr = format(new Date(), "yyyy-MM-dd");

    for (const p of projects) {
      if (!p.ultimate_parent) continue;
      const client = p.ultimate_parent;
      if (!stats[client]) {
        stats[client] = {
          name: client,
          projectCount: 0,
          activeProjectCount: 0,
          totalRevenue: 0,
          totalHours: 0,
          primaryOffice: p.office || "United Kingdom",
          feeCalcsCount: 0,
          assignedRolesCount: 0,
        };
      }

      const clientStat = stats[client];
      clientStat.projectCount += 1;
      
      const isActive = p.end_date >= todayStr && p.start_date <= todayStr;
      if (isActive) {
        clientStat.activeProjectCount += 1;
      }

      // Roll up client primary office
      if (p.office && p.office !== "all") {
        clientStat.primaryOffice = p.office;
      }

      const projectRevenue = Number(p.revenue || p.gross_budget || 0);
      clientStat.totalRevenue += projectRevenue;

      if (p.last_fee_calc_url) {
        clientStat.feeCalcsCount += 1;
      }

      const roleIds = new Set<string>();
      if (p.project_scopes) {
        for (const s of p.project_scopes) {
          clientStat.totalHours += Number(s.scoped_hours || 0);
          if (s.role_id) roleIds.add(s.role_id);
        }
      }
      clientStat.assignedRolesCount = Math.max(clientStat.assignedRolesCount, roleIds.size);
    }

    return Object.values(stats)
      .filter((stat: any) => showArchived ? inactiveClients.includes(stat.name) : !inactiveClients.includes(stat.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, inactiveClients, showArchived]);

  // Build account list (parent_account) filtered by selected ultimate parent
  const accounts = useMemo(() => {
    if (!selectedClient) return [];
    const accountSet = new Set<string>();
    for (const p of projects) {
      if (p.ultimate_parent === selectedClient && p.parent_account) {
        accountSet.add(p.parent_account);
      }
    }
    return Array.from(accountSet).sort();
  }, [projects, selectedClient]);

  // Build office list
  const offices = useMemo(() => {
    const officeSet = new Set<string>();
    for (const p of projects) {
      if (p.office) officeSet.add(p.office);
    }
    return Array.from(officeSet).sort();
  }, [projects]);

  // Filtered projects for selected client + office
  const filteredProjects = useMemo(() => {
    if (!selectedClient) return [];
    return projects.filter((p: any) => {
      if (p.ultimate_parent !== selectedClient) return false;
      if (selectedAccount !== "all" && p.parent_account !== selectedAccount) return false;
      if (selectedOffice !== "all" && p.office !== selectedOffice) return false;
      return true;
    });
  }, [projects, selectedClient, selectedAccount, selectedOffice]);

  // Sort helper functions
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="inline h-3 w-3 text-muted-foreground/40 ml-1.5 shrink-0 align-middle" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="inline h-3 w-3 text-primary ml-1.5 shrink-0 align-middle" />
      : <ArrowDown className="inline h-3 w-3 text-primary ml-1.5 shrink-0 align-middle" />;
  };

  // Sorted projects for Projects tab
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle custom number conversion for sorting fields like revenue/budget
      if (sortField === "revenue") {
        aVal = Number(a.revenue || a.gross_budget || 0);
        bVal = Number(b.revenue || b.gross_budget || 0);
      }

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProjects, sortField, sortDirection]);

  // Google Drive url saving handlers
  const handleOpenUrlModal = (projectId: string, projectTitle: string, currentUrl: string) => {
    setEditingProjectId(projectId);
    setEditingProjectTitle(projectTitle);
    setEditingProjectUrl(currentUrl || "");
    setIsUrlModalOpen(true);
  };

  const handleSaveUrl = async () => {
    if (!editingProjectId) return;
    try {
      const trimmedUrl = editingProjectUrl.trim();
      const { error } = await supabase
        .from("projects")
        .update({ last_fee_calc_url: trimmedUrl || null } as any)
        .eq("id", editingProjectId);

      if (error) throw error;

      toast.success(`GDrive Link saved successfully for "${editingProjectTitle}"!`);
      setIsUrlModalOpen(false);
      refetchProjects();
    } catch (err: any) {
      console.error("Error saving fee calc URL:", err);
      toast.error(`Failed to save GDrive Link: ${err.message || err}`);
    }
  };

  // Determine month range across all filtered projects, respecting timeframe
  const { months, minDate, maxDate } = useMemo(() => {
    if (filteredProjects.length === 0) return { months: [], minDate: "", maxDate: "" };
    const allStarts = filteredProjects.map((p: any) => p.start_date);
    const allEnds = filteredProjects.map((p: any) => p.end_date);
    let minD = [...allStarts].sort()[0];
    let maxD = [...allEnds].sort().reverse()[0];

    const now = new Date();

    if (timeframe === "past") {
      maxD = format(now, "yyyy-MM-dd");
    } else if (timeframe === "future") {
      minD = format(now, "yyyy-MM-dd");
    } else if (timeframe === "last12") {
      minD = format(addMonths(now, -11), "yyyy-MM-01");
      maxD = format(now, "yyyy-MM-dd");
    } else if (timeframe === "next12") {
      minD = format(now, "yyyy-MM-01");
      maxD = format(addMonths(now, 12), "yyyy-MM-dd");
    } else if (timeframe === "next6") {
      minD = format(now, "yyyy-MM-01");
      maxD = format(addMonths(now, 5), "yyyy-MM-dd");
    } else if (timeframe === "last6next6") {
      minD = format(addMonths(now, -5), "yyyy-MM-01");
      maxD = format(addMonths(now, 5), "yyyy-MM-dd");
    } else if (timeframe === "custom" && customStart) {
      minD = format(customStart, "yyyy-MM-dd");
      maxD = customEnd ? format(customEnd, "yyyy-MM-dd") : format(now, "yyyy-MM-dd");
    }

    return { months: getMonthRange(minD, maxD), minDate: minD, maxDate: maxD };
  }, [filteredProjects, timeframe, customStart, customEnd]);

  // Role map for lookups
  const roleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of roles) map[r.id] = r.name;
    return map;
  }, [roles]);

  // Compute role capacity per month for ONE person: roleId -> monthKey -> capacity_hours
  const roleMonthCapacity = useMemo(() => {
    const cap: Record<string, Record<string, number>> = {};
    for (const m of months) {
      const workingDays = getWorkingDaysInMonth(m);
      for (const roleId of Object.keys(roleBillableCapacity)) {
        const hoursPerDay = roleBillableCapacity[roleId] || 0;
        if (!cap[roleId]) cap[roleId] = {};
        cap[roleId][m] = hoursPerDay * workingDays;
      }
    }
    return cap;
  }, [months, roleBillableCapacity, roleHeadcount]);

  // Helper: get capacity for a role across a set of months
  function getRoleCapacity(roleId: string, filter: "past" | "future" | "all") {
    let total = 0;
    for (const m of months) {
      const isPast = m < currentMonth;
      if (filter === "past" && !isPast) continue;
      if (filter === "future" && isPast) continue;
      total += roleMonthCapacity[roleId]?.[m] || 0;
    }
    return total;
  }

  function getRoleMonthCap(roleId: string, m: string) {
    return roleMonthCapacity[roleId]?.[m] || 0;
  }

  // Compute scoped data: aggregate by role across all projects
  const scopedByRole = useMemo(() => {
    const roleData: Record<string, { totalHours: number; monthlyHours: Record<string, number> }> = {};
    for (const project of filteredProjects) {
      const pStart = parseISO(project.start_date);
      const pEnd = parseISO(project.end_date);
      for (const scope of (project as any).project_scopes || []) {
        const roleId = scope.role_id || "unknown";
        const phasePcts = (scope.phase_percentages as Record<string, number>) || {};
        const monthly = computeMonthlyHours(pStart, pEnd, scope.scoped_hours, phasePcts);
        if (!roleData[roleId]) roleData[roleId] = { totalHours: 0, monthlyHours: {} };
        roleData[roleId].totalHours += scope.scoped_hours;
        mergeMonthlyHours(roleData[roleId].monthlyHours, monthly);
      }
    }
    return roleData;
  }, [filteredProjects]);

  // Fetch actual time entries for filtered projects
  const projectIds = useMemo(() => filteredProjects.map((p: any) => p.id), [filteredProjects]);

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["portfolio_time_entries", projectIds],
    enabled: projectIds.length > 0,
    queryFn: async () => {
      const allData: any[] = [];
      const batchSize = 50;
      for (let i = 0; i < projectIds.length; i += batchSize) {
        const batch = projectIds.slice(i, i + batchSize);
        let from = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error } = await supabase
            .from("time_entries")
            .select("hours, date, person_id, project_id, people(role_id)")
            .in("project_id", batch)
            .range(from, from + pageSize - 1);
          if (error) throw error;
          allData.push(...(data || []));
          if (!data || data.length < pageSize) break;
          from += pageSize;
        }
      }
      return allData;
    },
  });

  // Actual data by role
  const actualByRole = useMemo(() => {
    const roleData: Record<string, { totalHours: number; monthlyHours: Record<string, number> }> = {};
    for (const te of timeEntries) {
      const roleId = te.people?.role_id || "unknown";
      const monthKey = (te.date as string).substring(0, 7);
      if (!roleData[roleId]) roleData[roleId] = { totalHours: 0, monthlyHours: {} };
      roleData[roleId].totalHours += te.hours;
      roleData[roleId].monthlyHours[monthKey] = (roleData[roleId].monthlyHours[monthKey] || 0) + te.hours;
    }
    return roleData;
  }, [timeEntries]);

  // Current month for determining past vs future (declared at top of component)

  // Build display rows
  const displayRows = useMemo(() => {
    const allRoleIds = new Set([...Object.keys(scopedByRole)]);
    if (viewMode === "actual") {
      for (const id of Object.keys(actualByRole)) allRoleIds.add(id);
    }

    const rows: Array<{
      roleId: string;
      roleName: string;
      team: string;
      totalScoped: number;
      totalActual: number;
      monthlyScoped: Record<string, number>;
      monthlyActual: Record<string, number>;
    }> = [];

    for (const roleId of allRoleIds) {
      const scoped = scopedByRole[roleId] || { totalHours: 0, monthlyHours: {} };
      const actual = actualByRole[roleId] || { totalHours: 0, monthlyHours: {} };
      rows.push({
        roleId,
        roleName: roleMap[roleId] || "Unknown",
        team: roleTeamMap[roleId] || "Other",
        totalScoped: scoped.totalHours,
        totalActual: actual.totalHours,
        monthlyScoped: scoped.monthlyHours,
        monthlyActual: actual.monthlyHours,
      });
    }

    return rows;
  }, [scopedByRole, actualByRole, roleMap, roleTeamMap, viewMode]);

  // Group rows by team, sorted by total hours (most to least)
  const groupedRows = useMemo(() => {
    const teamGroups: Record<string, typeof displayRows> = {};
    for (const row of displayRows) {
      if (!teamGroups[row.team]) teamGroups[row.team] = [];
      teamGroups[row.team].push(row);
    }

    const getRowTotal = (row: typeof displayRows[0]) => {
      if (viewMode === "actual") {
        let total = 0;
        for (const m of months) {
          total += m < currentMonth ? (row.monthlyActual[m] || 0) : (row.monthlyScoped[m] || 0);
        }
        return total;
      }
      return row.totalScoped;
    };

    // Determine month totals for percentage threshold check
    const mTotalsScoped: Record<string, number> = {};
    const mTotalsActual: Record<string, number> = {};
    for (const row of displayRows) {
      for (const m of months) {
        mTotalsScoped[m] = (mTotalsScoped[m] || 0) + (row.monthlyScoped[m] || 0);
        mTotalsActual[m] = (mTotalsActual[m] || 0) + (row.monthlyActual[m] || 0);
      }
    }

    // Check if a role ever exceeds 5% of total hours in any visible month
    const isMinorRole = (row: typeof displayRows[0]) => {
      for (const m of months) {
        const isPast = m < currentMonth;
        const value = (viewMode === "actual" && isPast)
          ? (row.monthlyActual[m] || 0)
          : (row.monthlyScoped[m] || 0);
        const total = (viewMode === "actual" && isPast)
          ? (mTotalsActual[m] || 0)
          : (mTotalsScoped[m] || 0);
        if (total > 0 && (value / total) * 100 > 5) return false;
      }
      return true;
    };

    // Sort roles within each team and split into major/minor
    const result: Array<{
      team: string;
      rows: typeof displayRows;
      otherRow: typeof displayRows[0] | null;
      otherRoleNames: string[];
      otherRoleIds: string[];
      total: number;
    }> = [];

    for (const [team, teamRows] of Object.entries(teamGroups)) {
      teamRows.sort((a, b) => getRowTotal(b) - getRowTotal(a));

      const majorRows: typeof displayRows = [];
      const minorRows: typeof displayRows = [];
      for (const row of teamRows) {
        if (isMinorRole(row)) {
          minorRows.push(row);
        } else {
          majorRows.push(row);
        }
      }

      let otherRow: typeof displayRows[0] | null = null;
      let otherRoleNames: string[] = [];
      let otherRoleIds: string[] = [];
      if (minorRows.length > 0) {
        otherRoleNames = minorRows.map(r => r.roleName).sort();
        otherRoleIds = minorRows.map(r => r.roleId);
        const aggregated: typeof displayRows[0] = {
          roleId: `other-${team}`,
          roleName: "Other",
          team,
          totalScoped: 0,
          totalActual: 0,
          monthlyScoped: {},
          monthlyActual: {},
        };
        for (const r of minorRows) {
          aggregated.totalScoped += r.totalScoped;
          aggregated.totalActual += r.totalActual;
          for (const m of months) {
            aggregated.monthlyScoped[m] = (aggregated.monthlyScoped[m] || 0) + (r.monthlyScoped[m] || 0);
            aggregated.monthlyActual[m] = (aggregated.monthlyActual[m] || 0) + (r.monthlyActual[m] || 0);
          }
        }
        otherRow = aggregated;
      }

      result.push({
        team,
        rows: majorRows,
        otherRow,
        otherRoleNames,
        otherRoleIds,
        total: teamRows.reduce((s, r) => s + getRowTotal(r), 0),
      });
    }

    result.sort((a, b) => b.total - a.total);
    return result;
  }, [displayRows, viewMode, months, currentMonth, roleMonthCapacity]);

  const grandTotalScoped = displayRows.reduce((s, r) => s + r.totalScoped, 0);
  const grandTotalActual = displayRows.reduce((s, r) => s + r.totalActual, 0);

  // Month totals
  const monthTotals = useMemo(() => {
    const scopedTotals: Record<string, number> = {};
    const actualTotals: Record<string, number> = {};
    for (const row of displayRows) {
      for (const m of months) {
        scopedTotals[m] = (scopedTotals[m] || 0) + (row.monthlyScoped[m] || 0);
        actualTotals[m] = (actualTotals[m] || 0) + (row.monthlyActual[m] || 0);
      }
    }
    return { scopedTotals, actualTotals };
  }, [displayRows, months]);

  // Compute aggregate capacity for multiple role IDs across months
  function getMultiRoleCapacity(roleIds: string[], filter: "past" | "future" | "all") {
    let total = 0;
    for (const roleId of roleIds) {
      total += getRoleCapacity(roleId, filter);
    }
    return total;
  }

  function getMultiRoleMonthCap(roleIds: string[], m: string) {
    let total = 0;
    for (const roleId of roleIds) {
      total += getRoleMonthCap(roleId, m);
    }
    return total;
  }

  // All role IDs in display for total row capacity
  const allDisplayRoleIds = useMemo(() => displayRows.map(r => r.roleId), [displayRows]);

  function formatValue(hours: number, capacity: number) {
    if (unitMode === "hours") return hours > 0 ? `${Math.round(hours).toLocaleString()}h` : "—";
    if (capacity <= 0) return hours > 0 ? ">0%" : "—";
    const pct = (hours / capacity) * 100;
    return pct > 0 ? `${Math.round(pct)}%` : "—";
  }

  function getCellValue(row: typeof displayRows[0], m: string) {
    const isPast = m < currentMonth;
    const isActualView = viewMode === "actual";

    if (isActualView && isPast) {
      const actual = row.monthlyActual[m] || 0;
      const scoped = row.monthlyScoped[m] || 0;
      return { value: actual, scoped, showVariance: true, isPast: true };
    }
    const scoped = row.monthlyScoped[m] || 0;
    return { value: scoped, scoped: 0, showVariance: false, isPast: false };
  }

  function getSubTotal(row: typeof displayRows[0], filter: "past" | "future" | "all") {
    let total = 0;
    for (const m of months) {
      const isPast = m < currentMonth;
      if (filter === "past" && !isPast) continue;
      if (filter === "future" && isPast) continue;
      if (viewMode === "actual" && isPast) {
        total += row.monthlyActual[m] || 0;
      } else {
        total += row.monthlyScoped[m] || 0;
      }
    }
    return total;
  }

  function getSubTotalScoped(row: typeof displayRows[0], filter: "past" | "future" | "all") {
    let total = 0;
    for (const m of months) {
      const isPast = m < currentMonth;
      if (filter === "past" && !isPast) continue;
      if (filter === "future" && isPast) continue;
      total += row.monthlyScoped[m] || 0;
    }
    return total;
  }

  function getTotalValue(row: typeof displayRows[0]) {
    return getSubTotal(row, "all");
  }

  // Recompute visible total for actual view
  const visibleTotal = useMemo(() => {
    let total = 0;
    for (const row of displayRows) {
      total += getTotalValue(row);
    }
    return total;
  }, [displayRows, months, viewMode, currentMonth]);

  // Past and future grand totals
  const pastTotal = useMemo(() => displayRows.reduce((s, r) => s + getSubTotal(r, "past"), 0), [displayRows, months, viewMode, currentMonth]);
  const futureTotal = useMemo(() => displayRows.reduce((s, r) => s + getSubTotal(r, "future"), 0), [displayRows, months, viewMode, currentMonth]);
  const pastTotalScoped = useMemo(() => displayRows.reduce((s, r) => s + getSubTotalScoped(r, "past"), 0), [displayRows, months, currentMonth]);
  const futureTotalScoped = useMemo(() => displayRows.reduce((s, r) => s + getSubTotalScoped(r, "future"), 0), [displayRows, months, currentMonth]);

  const isScoped = viewMode === "scoped";

  // Compute role demands for team builder — monthly % of single-person capacity
  const roleDemands = useMemo(() => {
    const futureMonths = months.filter(m => m >= currentMonth);
    return displayRows
      .filter(r => r.roleId !== "unknown" && !r.roleId.startsWith("other-"))
      .map(row => {
        const monthlyPct: Record<string, number> = {};
        let hasAny = false;
        for (const m of futureMonths) {
          const hours = row.monthlyScoped[m] || 0;
          const cap = getRoleMonthCap(row.roleId, m);
          const pct = cap > 0 ? (hours / cap) * 100 : 0;
          if (pct > 0) hasAny = true;
          monthlyPct[m] = Math.round(pct);
        }
        return {
          roleId: row.roleId,
          roleName: row.roleName,
          team: row.team,
          monthlyPct,
        };
      })
      .filter(d => {
        return Object.values(d.monthlyPct).some(v => v > 0);
      });
  }, [displayRows, months, currentMonth]);

  // Capacity totals for the grand total row
  const totalPastCap = getMultiRoleCapacity(allDisplayRoleIds, "past");
  const totalFutureCap = getMultiRoleCapacity(allDisplayRoleIds, "future");
  const totalAllCap = getMultiRoleCapacity(allDisplayRoleIds, "all");

  // Memoized calculations for client overview tab
  const clientOverviewStats = useMemo(() => {
    if (!selectedClient) return null;
    let totalRev = 0;
    let activeProjs = 0;
    let closedProjs = 0;
    let totalHrs = 0;
    let avgMargin = 0;
    let marginCount = 0;
    const subAccounts = new Set<string>();
    const hubs = new Set<string>();

    const todayStr = format(new Date(), "yyyy-MM-dd");

    for (const p of projects) {
      if (p.ultimate_parent !== selectedClient) continue;
      totalRev += Number(p.revenue || p.gross_budget || 0);
      
      const isActive = p.end_date >= todayStr && p.start_date <= todayStr;
      if (isActive) {
        activeProjs += 1;
      } else {
        closedProjs += 1;
      }
      if (p.parent_account) subAccounts.add(p.parent_account);
      if (p.office && p.office !== "all") hubs.add(p.office);
      
      if (p.gp_margin_pct) {
        avgMargin += Number(p.gp_margin_pct);
        marginCount += 1;
      }

      if (p.project_scopes) {
        for (const s of p.project_scopes) {
          totalHrs += Number(s.scoped_hours || 0);
        }
      }
    }

    return {
      totalRevenue: totalRev,
      activeProjects: activeProjs,
      closedProjects: closedProjs,
      totalHours: totalHrs,
      avgMargin: marginCount > 0 ? Math.round(avgMargin / marginCount) : 70,
      subAccounts: Array.from(subAccounts),
      hubs: Array.from(hubs),
    };
  }, [projects, selectedClient]);

  // Aggregate total actual logged hours for active client
  const clientActualHours = useMemo(() => {
    if (!selectedClient) return 0;
    return timeEntries.reduce((sum: number, te: any) => sum + Number(te.hours || 0), 0);
  }, [timeEntries, selectedClient]);

  // Filter clients based on searchTerm and sort starred/pinned clients to the top
  const filteredClientStats = useMemo(() => {
    let list = clientDirectoryStats;
    if (searchTerm) {
      list = clientDirectoryStats.filter(c => isFuzzyClientMatch(c.name, searchTerm));
    }

    // Sort starred clients to the top
    return [...list].sort((a, b) => {
      const aStarred = starredClients.includes(a.name);
      const bStarred = starredClients.includes(b.name);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      return 0;
    });
  }, [clientDirectoryStats, searchTerm, starredClients]);

  // Helper to check and retrieve project-specific actual hours and variance
  const getProjectActualsAndVariance = (pId: string, scopedHrs: number) => {
    const actuals = timeEntries
      .filter((te: any) => te.project_id === pId)
      .reduce((sum: number, te: any) => sum + Number(te.hours || 0), 0);
    const variance = actuals - scopedHrs;
    const isOver = scopedHrs > 0 && actuals > scopedHrs * 1.10;
    const pct = scopedHrs > 0 ? Math.round((actuals / scopedHrs) * 100) : 0;
    return { actuals, variance, isOver, pct };
  };

  // Helper to compute project timeline progress %
  const getProjectProgress = (start: string, end: string) => {
    const s = parseISO(start);
    const e = parseISO(end);
    const now = new Date();
    if (now < s) return 0;
    if (now > e) return 100;
    const total = e.getTime() - s.getTime();
    const current = now.getTime() - s.getTime();
    return Math.round((current / total) * 100);
  };

  // Mock list of prospective multi-option calculations for upcoming features (future-proof AI scenarions)
  const mockFeeCalcs = useMemo(() => {
    if (!selectedClient) return [];
    return [
      {
        id: "calc-1",
        projectName: "Q4 Launch Campaign",
        optionName: "Option A: UK Standard Core Squad",
        feeValue: 145000,
        marginPct: 72,
        createdBy: "AI Copilot Agent",
        status: "under_review",
        createdAt: "2026-08-05",
        currency: "GBP",
      },
      {
        id: "calc-2",
        projectName: "Q4 Launch Campaign",
        optionName: "Option B: Offshore Hybrid Deployment",
        feeValue: 112000,
        marginPct: 79,
        createdBy: "Paul Webb (Director)",
        status: "draft",
        createdAt: "2026-08-08",
        currency: "GBP",
      }
    ];
  }, [selectedClient]);

  return (
    <div className="p-6 space-y-6">
      {/* ── Twin State Case 1: Client Roster / Directory View ── */}
      {!selectedClient ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">Client Portfolio</h1>
              <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                Select a brand or account to manage scopes, fee structures, financial KPIs, and resource modeling
              </p>
            </div>
            
            {/* View Switching & Layout Toggles */}
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Search clients or office hubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50 backdrop-blur-sm"
                />
              </div>

              {canArchive && (
                <Button
                  variant={showArchived ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 font-bold text-xs gap-1.5 transition-all shrink-0",
                    showArchived 
                      ? "bg-[#fe4f2a]/10 text-[#fe4f2a] hover:bg-[#fe4f2a]/20 border-[#fe4f2a]/30" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Folder className="h-3.5 w-3.5" />
                  {showArchived ? "Viewing Archived" : "Show Archived"}
                </Button>
              )}
              <div className="flex border rounded-lg overflow-hidden bg-background p-0.5">
                <Button 
                  variant={layoutMode === "tile" ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8 rounded-md"
                  onClick={() => setLayoutMode("tile")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={layoutMode === "list" ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8 rounded-md"
                  onClick={() => setLayoutMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {loadingProjects ? (
            <div className="py-24 text-center space-y-4">
              <div className="font-display font-black text-6xl tracking-tight text-primary drop-shadow-sm animate-pulse">
                {loadingProgress}%
              </div>
              <p className="text-sm text-muted-foreground font-semibold">Aggregating database portfolios and metrics...</p>
            </div>
          ) : filteredClientStats.length === 0 ? (
            <Card className="border border-dashed">
              <CardContent className="py-16 text-center space-y-3">
                <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-base font-semibold">No clients matching your search</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">Try refining your filter or select from the overall list.</p>
                {searchTerm && (
                  <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                    Clear Filter
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : layoutMode === "tile" ? (
            /* ── TILE VIEW GRID ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClientStats.map((c, index) => {
                const isUS = c.primaryOffice === "United States" || c.name.includes("US");
                const currencySym = isUS ? "$" : "£";

                // Alternating highlight hover colors (yellow, pink, red)
                const hoverColors = [
                  {
                    bar: "group-hover:bg-yellow-400",
                    button: "group-hover:bg-yellow-400 group-hover:text-black",
                    text: "group-hover:text-yellow-500",
                    border: "hover:border-yellow-400/30",
                  },
                  {
                    bar: "group-hover:bg-pink-500",
                    button: "group-hover:bg-pink-500 group-hover:text-white",
                    text: "group-hover:text-pink-500",
                    border: "hover:border-pink-500/30",
                  },
                  {
                    bar: "group-hover:bg-red-500",
                    button: "group-hover:bg-red-500 group-hover:text-white",
                    text: "group-hover:text-red-500",
                    border: "hover:border-red-500/30",
                  },
                ];
                const color = hoverColors[index % hoverColors.length];

                return (
                  <Card 
                    key={c.name} 
                    className={`group overflow-hidden bg-card/40 backdrop-blur-md border border-border/60 hover:shadow-lg shadow-sm transform hover:-translate-y-1 transition-all duration-300 cursor-pointer ${color.border}`}
                    onClick={() => handleSelectClient(c.name)}
                  >
                    {/* Visual Card Accent Bar */}
                    <div className={`h-1.5 w-full bg-primary ${color.bar} transition-colors duration-300`} />
                    
                    <CardContent className="p-6 space-y-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5 max-w-[70%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-lg font-bold ${color.text} transition-colors line-clamp-1`}>{c.name}</h3>
                            {autoArchivedClients.includes(c.name) && (
                              <span className="text-[9px] font-extrabold bg-muted/60 text-muted-foreground border border-muted-foreground/10 px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap" title="Archived automatically because all projects ended more than 365 days ago">
                                Auto-Archived
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 text-muted-foreground/60" />
                            <span>{c.primaryOffice}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0"
                            onClick={(e) => handleToggleClientStar(c.name, e)}
                          >
                            <Star className={`h-4 w-4 transition-all ${
                              starredClients.includes(c.name)
                                ? "fill-yellow-400 text-yellow-400 scale-110 drop-shadow-sm"
                                : "text-muted-foreground/60 hover:text-foreground hover:scale-110"
                            }`} />
                          </Button>

                          {canArchive && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border shadow-md">
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleClientInactive(c.name)}
                                    className={cn(
                                      "text-xs font-semibold cursor-pointer",
                                      inactiveClients.includes(c.name)
                                        ? "text-success hover:bg-success/10 hover:text-success"
                                        : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    )}
                                  >
                                    {inactiveClients.includes(c.name) ? "Mark Active" : "Mark Inactive"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}

                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectClient(c.name);
                            }}
                            className={`p-2 rounded-lg bg-primary/5 text-primary ${color.button} transition-all cursor-pointer`}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      {/* Stat Counters Grid */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 bg-muted/20 rounded-lg px-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Projects</span>
                          <span className="text-sm font-bold flex items-center gap-1 text-foreground">
                            <Briefcase className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            {c.projectCount}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Team Size</span>
                          <span className="text-sm font-bold flex items-center gap-1 text-foreground">
                            <Users2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                            {c.assignedRolesCount}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Fee Calcs</span>
                          <span className="text-sm font-bold flex items-center gap-1 text-foreground">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                            {c.feeCalcsCount}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* ── LIST VIEW TABLE ── */
            <Card className="overflow-hidden bg-card/40 backdrop-blur-md border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="pl-6 font-semibold">Client Name</TableHead>
                    <TableHead className="font-semibold text-center">Active / Total Projects</TableHead>
                    <TableHead className="font-semibold text-right">Combined Budgeted Fees</TableHead>
                    <TableHead className="font-semibold text-center">Assigned Team Roles</TableHead>
                    <TableHead className="font-semibold">Primary Office</TableHead>
                    <TableHead className="font-semibold text-center">Scoping Sheets</TableHead>
                    <TableHead className="text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientStats.map((c) => {
                    const isUS = c.primaryOffice === "United States" || c.name.includes("US");
                    const currencySym = isUS ? "$" : "£";
                    return (
                      <TableRow 
                        key={c.name} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => handleSelectClient(c.name)}
                      >
                        <TableCell className="pl-6 font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                            {autoArchivedClients.includes(c.name) && (
                              <span className="text-[9px] font-extrabold bg-muted/60 text-muted-foreground border border-muted-foreground/10 px-1.5 py-0.5 rounded uppercase tracking-wider" title="Archived automatically because all projects ended more than 365 days ago">
                                Auto-Archived
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          <span className="text-success">{c.activeProjectCount}</span>
                          <span className="text-muted-foreground/60 mx-1">/</span>
                          <span className="text-muted-foreground">{c.projectCount}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {currencySym}{Math.round(c.totalRevenue).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-sm">
                          {c.assignedRolesCount}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-medium">
                          {c.primaryOffice}
                        </TableCell>
                        <TableCell className="text-center font-medium text-sm text-muted-foreground">
                          {c.feeCalcsCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-semibold">
                              <FileSpreadsheet className="h-3 w-3" />
                              {c.feeCalcsCount} active
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0"
                              onClick={(e) => handleToggleClientStar(c.name, e)}
                            >
                              <Star className={`h-4 w-4 transition-all ${
                                starredClients.includes(c.name)
                                  ? "fill-yellow-400 text-yellow-400 scale-110 drop-shadow-md"
                                  : "text-muted-foreground/60 hover:text-foreground hover:scale-110"
                              }`} />
                            </Button>

                            {canArchive && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border shadow-md">
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleClientInactive(c.name)}
                                    className={cn(
                                      "text-xs font-semibold cursor-pointer",
                                      inactiveClients.includes(c.name)
                                        ? "text-success hover:bg-success/10 hover:text-success"
                                        : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    )}
                                  >
                                    {inactiveClients.includes(c.name) ? "Mark Active" : "Mark Inactive"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSelectClient(c.name)}
                              className="gap-1 group-hover:translate-x-1 transition-transform font-bold text-xs text-primary"
                            >
                              Workspace
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      ) : (
        /* ── Twin State Case 2: Client Command Center Workspace ── */
        <div className="space-y-6">
          
          {/* Breadcrumbs & Navigation */}
          <div className="flex items-center justify-between border-b pb-4 border-border/50">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSelectClient("")} 
                className="gap-1.5 text-muted-foreground bg-background/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
              </Button>
              <div className="h-4 w-px bg-border/80" />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span>Client Portfolio</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-foreground font-bold">{selectedClient}</span>
              </div>
            </div>
            
            {/* Child accounts selector helper */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Switch Hub:</span>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger className="h-8 w-[140px] bg-background/50">
                  <SelectValue placeholder="All Offices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Offices</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Command Header Banner */}
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card/80 via-card/40 to-background/50 backdrop-blur-md p-6 md:p-8 shadow-sm">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-primary/10 via-transparent to-transparent pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">Active Client Account</span>
                  {clientOverviewStats?.hubs.map(hub => (
                    <span key={hub} className="px-2.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground text-[10px] font-bold">{hub}</span>
                  ))}
                </div>
                <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">{selectedClient}</h1>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Centralized account center tracking active pipelines, financial deliverables, team resourcing allocations, and fee calculators.
                </p>
              </div>

              {/* Sub-Accounts / Brands quick indicators */}
              {clientOverviewStats && clientOverviewStats.subAccounts.length > 0 && (
                <div className="flex flex-col gap-1 md:text-right border-t md:border-t-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0 border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Child Entities / Brands ({clientOverviewStats.subAccounts.length})</span>
                  <div className="flex flex-wrap md:justify-end gap-1.5 mt-1.5">
                    {clientOverviewStats.subAccounts.map((sub, idx) => (
                      <span key={sub} className="px-2 py-0.5 rounded bg-muted/60 text-foreground text-[11px] font-medium border border-border/30">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Radix Styled Custom Workspace Sub-Tabs Navigation */}
          <div className="flex items-center gap-1 p-1 bg-muted/30 border rounded-lg max-w-2xl backdrop-blur-sm">

            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("projects")}
              className={cn("flex-1 text-xs font-bold py-2 h-9 rounded-md transition-all gap-1.5", activeTab === "projects" ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground")}
            >
              <Briefcase className="h-4 w-4 text-teal-500" />
              Projects ({filteredProjects.length})
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("fee_calcs")}
              className={cn("flex-1 text-xs font-bold py-2 h-9 rounded-md transition-all gap-1.5", activeTab === "fee_calcs" ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground")}
            >
              <FileSpreadsheet className="h-4 w-4 text-pink-500" />
              Fee Calculations
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("resourcing")}
              className={cn("flex-1 text-xs font-bold py-2 h-9 rounded-md transition-all gap-1.5", activeTab === "resourcing" ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground")}
            >
              <Activity className="h-4 w-4 text-primary" />
              Resource Allocation
            </Button>
          </div>



          {/* Tab Content Block 2: Projects & Scopes (with margin status and variance alerts) */}
          {activeTab === "projects" && (
            <Card className="border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead 
                      className="pl-6 font-semibold cursor-pointer hover:bg-muted/30 select-none transition-colors"
                      onClick={() => handleSort("title")}
                    >
                      Project Name {renderSortIcon("title")}
                    </TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-muted/30 select-none transition-colors"
                      onClick={() => handleSort("parent_account")}
                    >
                      Sub-Account {renderSortIcon("parent_account")}
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-center cursor-pointer hover:bg-muted/30 select-none transition-colors"
                      onClick={() => handleSort("start_date")}
                    >
                      Start Date {renderSortIcon("start_date")}
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-center cursor-pointer hover:bg-muted/30 select-none transition-colors"
                      onClick={() => handleSort("end_date")}
                    >
                      End Date {renderSortIcon("end_date")}
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-right cursor-pointer hover:bg-muted/30 select-none transition-colors"
                      onClick={() => handleSort("revenue")}
                    >
                      Fee Value {renderSortIcon("revenue")}
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-center cursor-pointer hover:bg-muted/30 select-none transition-colors"
                      onClick={() => handleSort("gp_margin_pct")}
                    >
                      Margin Health {renderSortIcon("gp_margin_pct")}
                    </TableHead>
                    <TableHead className="font-semibold text-center">Hours Scoped vs Actuals</TableHead>
                    <TableHead className="font-semibold text-center">Variance Alert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((p) => {
                    const isUS = p.office === "United States" || selectedOffice === "United States" || p.ultimate_parent?.includes("US");
                    const currencySym = isUS ? "$" : "£";
                    const progress = getProjectProgress(p.start_date, p.end_date);
                    
                    // Margin check
                    const margin = p.gp_margin_pct ? Number(p.gp_margin_pct) : 70;
                    let marginBadgeColor = "bg-success/10 text-success border-success/30";
                    if (margin < 60) {
                      marginBadgeColor = "bg-destructive/10 text-destructive border-destructive/30";
                    } else if (margin < 70) {
                      marginBadgeColor = "bg-warning/10 text-warning border-warning/30";
                    }

                    // Scoped vs Actual hours checking
                    const totalScopedHrs = p.project_scopes?.reduce((sum: number, s: any) => sum + Number(s.scoped_hours || 0), 0) || 0;
                    const { actuals, variance, isOver, pct } = getProjectActualsAndVariance(p.id, totalScopedHrs);

                    return (
                      <TableRow key={p.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-6 font-bold py-4">
                          <div className="flex items-center flex-wrap gap-2">
                            <Link 
                              to={`/projects/${p.id}`} 
                              className="font-bold text-sm text-primary hover:underline inline-flex items-center gap-1 group"
                            >
                              {p.title}
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            {p.last_fee_calc_url && (
                              <a 
                                href={p.last_fee_calc_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold border border-emerald-500/20 transition-all cursor-pointer"
                                title="Open connected GDrive Spreadsheet"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileSpreadsheet className="h-3 w-3" />
                                GDrive
                              </a>
                            )}
                          </div>
                          <div className="w-48 mt-1.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Timeline Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-muted-foreground">{p.parent_account || "—"}</TableCell>
                        <TableCell className="text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {p.start_date ? format(parseISO(p.start_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {p.end_date ? format(parseISO(p.end_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {currencySym}{Math.round(p.revenue || p.gross_budget || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2.5 py-0.5 rounded-full border text-xs font-extrabold whitespace-nowrap", marginBadgeColor)}>
                            {margin}% Margin
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs">
                          <div>
                            <span className="text-foreground">{Math.round(actuals).toLocaleString()}h</span>
                            <span className="text-muted-foreground/60 mx-1">/</span>
                            <span className="text-muted-foreground">{Math.round(totalScopedHrs).toLocaleString()}h</span>
                          </div>
                          {totalScopedHrs > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">({pct}% utilized)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {totalScopedHrs === 0 ? (
                            <span className="text-muted-foreground/30 text-xs font-medium">No scopes</span>
                          ) : isOver ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-extrabold border border-destructive/20 animate-pulse">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              +{Math.round(variance)}h Over budget
                            </span>
                          ) : actuals > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-extrabold border border-success/20">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              Within Budget
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 font-medium">No actuals yet</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Tab Content Block 3: Fee Calculations Tab (Multi-scenario drafts repository) */}
          {activeTab === "fee_calcs" && (
            <div className="space-y-6">
              


              {/* Connected live project sheet records */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-1.5 text-foreground">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    Active Project Scopes & Scoping Links
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live fee-calculators and Google Sheets currently linked to the projects under {selectedClient}.
                  </p>
                </div>

                <Card className="border border-border/60 overflow-hidden bg-card/10">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="pl-6 font-semibold">Project Title</TableHead>
                        <TableHead className="font-semibold">Scoping Currency</TableHead>
                        <TableHead className="font-semibold text-right">Revenue Contract Value</TableHead>
                        <TableHead className="font-semibold text-right">Budget Cost</TableHead>
                        <TableHead className="font-semibold text-center">Gross Profit Margin</TableHead>
                        <TableHead className="text-right pr-6 font-semibold">GDrive Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((p) => {
                        const isUS = p.office === "United States" || selectedOffice === "United States" || p.ultimate_parent?.includes("US");
                        const currencySym = isUS ? "$" : "£";
                        return (
                          <TableRow key={p.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="pl-6 font-bold py-3.5 text-sm text-foreground">{p.title}</TableCell>
                            <TableCell className="text-xs font-semibold text-muted-foreground uppercase">{p.fee_calc_currency || p.rate_cards?.currency || "GBP"}</TableCell>
                            <TableCell className="text-right font-bold text-sm">
                              {currencySym}{Math.round(p.revenue || p.gross_budget || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm text-muted-foreground">
                              {currencySym}{Math.round(p.budget_cost || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs text-teal-500">
                              {p.gp_margin_pct ? `${p.gp_margin_pct}%` : "70%"}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="inline-flex items-center gap-2">
                                {p.last_fee_calc_url ? (
                                  <>
                                    <Button 
                                      onClick={() => handleOpenUrlModal(p.id, p.title, p.last_fee_calc_url)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] h-7"
                                    >
                                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                                      GDrive Connected
                                    </Button>
                                    <a 
                                      href={p.last_fee_calc_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center p-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-md transition-all h-7 w-7"
                                      title="Open Google Sheet directly"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </>
                                ) : (
                                  <Button 
                                    onClick={() => handleOpenUrlModal(p.id, p.title, "")}
                                    variant="ghost"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-md text-xs font-bold transition-all h-7"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Link
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No active scoping profiles connected.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {/* Tab Content Block 4: Resource Allocation & Capacity Matrix (PRESERVED ORIGINAL WORK) */}
          {activeTab === "resourcing" && (
            <div className="space-y-6">
              
              {/* Capacity matrix settings and filters */}
              <Card className="border border-border/60 bg-muted/10">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      
                      {/* View selector (Scoped vs Actual) */}
                      <div className="flex items-center border rounded-lg overflow-hidden bg-background p-0.5">
                        <Button
                          variant={viewMode === "scoped" ? "secondary" : "ghost"}
                          size="sm"
                          className="text-xs h-7 font-semibold"
                          onClick={() => setViewMode("scoped")}
                        >
                          Scoped Hours
                        </Button>
                        <Button
                          variant={viewMode === "actual" ? "secondary" : "ghost"}
                          size="sm"
                          className="text-xs h-7 font-semibold"
                          onClick={() => setViewMode("actual")}
                        >
                          Actual vs. Scoped
                        </Button>
                      </div>

                      {/* Capacity Units */}
                      <div className="flex items-center border rounded-lg overflow-hidden bg-background p-0.5">
                        <Button
                          variant={unitMode === "pct" ? "secondary" : "ghost"}
                          size="sm"
                          className="text-xs h-7 font-semibold"
                          onClick={() => setUnitMode("pct")}
                        >
                          % Capacity
                        </Button>
                        <Button
                          variant={unitMode === "hours" ? "secondary" : "ghost"}
                          size="sm"
                          className="text-xs h-7 font-semibold"
                          onClick={() => setUnitMode("hours")}
                        >
                          Hours Value
                        </Button>
                      </div>

                      {/* Timeframe picker */}
                      <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="h-8 w-[160px] bg-background">
                          <SelectValue placeholder="All Months" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          <SelectItem value="past">Past</SelectItem>
                          <SelectItem value="future">Future</SelectItem>
                          <SelectItem value="last12">Last 12 Months</SelectItem>
                          <SelectItem value="next6">Next 6 Months</SelectItem>
                          <SelectItem value="next12">Next 12 Months</SelectItem>
                          <SelectItem value="last6next6">Last 6 + Next 6</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>

                      {timeframe === "custom" && (
                        <CustomDateRangePicker
                          start={customStart}
                          end={customEnd}
                          onSelect={({ start, end }) => {
                            setCustomStart(start);
                            setCustomEnd(end);
                          }}
                          selectedClass="bg-yellow-500 text-white hover:bg-yellow-500 hover:text-white focus:bg-yellow-500 focus:text-white"
                          rangeMiddleClass="aria-selected:bg-yellow-400 aria-selected:text-yellow-950"
                          hoverPreviewClass="!bg-yellow-100 !text-yellow-900 rounded-none"
                          cellClass="h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-yellow-400 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                        />
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground font-semibold">
                      {filteredProjects.length} matching campaign{filteredProjects.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* The original hours capacity matrix table */}
              {filteredProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground text-xs font-semibold">No scoped projects found matching the filters.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border/60 overflow-hidden shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="sticky left-0 bg-background z-20 text-sm font-bold pl-6 min-w-[200px]">Role / Discipline</TableHead>
                            <TableHead className="text-right text-sm font-bold border-l min-w-[90px]">{viewMode === "actual" ? "Actual Past" : "Past Total"}</TableHead>
                            <TableHead className="text-right text-sm font-bold min-w-[90px]">Future Total</TableHead>
                            <TableHead className="text-right text-sm font-bold border-r min-w-[90px]">Combined Total</TableHead>
                            {months.map((m) => (
                              <TableHead key={m} className={cn("text-center font-bold text-xs min-w-[80px]", m < currentMonth && "bg-muted/20 text-muted-foreground")}>
                                <div className="font-semibold uppercase tracking-wider">{format(parseISO(`${m}-01`), "MMM yy")}</div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedRows.map(({ team: teamName, rows, otherRow, otherRoleNames, otherRoleIds }) => {
                            return (
                            <>
                              <TableRow key={teamName} className="bg-muted/30 font-bold hover:bg-muted/30 border-y">
                                <TableCell colSpan={4 + months.length} className="sticky left-0 bg-muted/30 text-xs uppercase tracking-wider font-extrabold pl-6 text-foreground/85">
                                  {teamName}
                                </TableCell>
                              </TableRow>
                              {rows.map((row) => {
                                const rowPast = getSubTotal(row, "past");
                                const rowFuture = getSubTotal(row, "future");
                                const rowTotal = rowPast + rowFuture;
                                const rowPastScoped = getSubTotalScoped(row, "past");
                                const rowFutureScoped = getSubTotalScoped(row, "future");
                                const rowVisibleScoped = rowPastScoped + rowFutureScoped;
                                const rowPastCap = getRoleCapacity(row.roleId, "past");
                                const rowFutureCap = getRoleCapacity(row.roleId, "future");
                                const rowTotalCap = getRoleCapacity(row.roleId, "all");
                                return (
                                  <TableRow key={row.roleId} className="hover:bg-muted/5">
                                    <TableCell className="sticky left-0 bg-background z-10 font-bold text-sm pl-6 text-foreground">{row.roleName}</TableCell>
                                    <TableCell className="text-right text-sm font-semibold border-l">
                                      <div>{formatValue(rowPast, rowPastCap)}</div>
                                      {viewMode === "actual" && <VarianceLabel actual={rowPast} scoped={rowPastScoped} unitMode={unitMode} capacity={rowPastCap} scopedCapacity={rowPastCap} showNA />}
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-semibold">
                                      <div>{formatValue(rowFuture, rowFutureCap)}</div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-semibold border-r">
                                      <div>{formatValue(rowTotal, rowTotalCap)}</div>
                                      {viewMode === "actual" && <VarianceLabel actual={rowTotal} scoped={rowVisibleScoped} unitMode={unitMode} capacity={rowTotalCap} scopedCapacity={rowTotalCap} showNA />}
                                    </TableCell>
                                    {months.map((m) => {
                                      const cell = getCellValue(row, m);
                                      const mCap = getRoleMonthCap(row.roleId, m);
                                      return (
                                        <TableCell key={m} className={cn("text-center text-sm", m < currentMonth && "bg-muted/10")}>
                                          {cell.value > 0 ? (
                                            <>
                                              <div className="font-semibold">{formatValue(cell.value, mCap)}</div>
                                              {cell.showVariance && <VarianceLabel actual={cell.value} scoped={cell.scoped} unitMode={unitMode} capacity={mCap} scopedCapacity={mCap} />}
                                            </>
                                          ) : <span className="text-muted-foreground/30">—</span>}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                );
                              })}
                              {otherRow && getTotalValue(otherRow) > 0 && (
                                <TableRow key={otherRow.roleId} className="text-muted-foreground hover:bg-muted/5">
                                  <TableCell className="sticky left-0 bg-background z-10 text-sm pl-6">
                                    <span className="flex items-center gap-1.5">
                                      <span className="italic">Other</span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-[240px]">
                                            <p className="text-xs">Roles that never exceed 5% of monthly hours: {otherRoleNames.join(", ")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right text-sm border-l">
                                    <div>{formatValue(getSubTotal(otherRow, "past"), getMultiRoleCapacity(otherRoleIds, "past"))}</div>
                                    {viewMode === "actual" && <VarianceLabel actual={getSubTotal(otherRow, "past")} scoped={getSubTotalScoped(otherRow, "past")} unitMode={unitMode} capacity={getMultiRoleCapacity(otherRoleIds, "past")} scopedCapacity={getMultiRoleCapacity(otherRoleIds, "past")} showNA />}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    <div>{formatValue(getSubTotal(otherRow, "future"), getMultiRoleCapacity(otherRoleIds, "future"))}</div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm border-r">
                                    <div>{formatValue(getTotalValue(otherRow), getMultiRoleCapacity(otherRoleIds, "all"))}</div>
                                    {viewMode === "actual" && <VarianceLabel actual={getTotalValue(otherRow)} scoped={getSubTotalScoped(otherRow, "all")} unitMode={unitMode} capacity={getMultiRoleCapacity(otherRoleIds, "all")} scopedCapacity={getMultiRoleCapacity(otherRoleIds, "all")} showNA />}
                                  </TableCell>
                                  {months.map((m) => {
                                    const cell = getCellValue(otherRow, m);
                                    const mCap = getMultiRoleMonthCap(otherRoleIds, m);
                                    return (
                                      <TableCell key={m} className={cn("text-center text-sm", m < currentMonth && "bg-muted/10")}>
                                        {cell.value > 0 ? (
                                          <>
                                            <div className="font-semibold">{formatValue(cell.value, mCap)}</div>
                                            {cell.showVariance && <VarianceLabel actual={cell.value} scoped={cell.scoped} unitMode={unitMode} capacity={mCap} scopedCapacity={mCap} />}
                                          </>
                                        ) : <span className="text-muted-foreground/30">—</span>}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              )}
                            </>
                            );
                          })}
                          <TableRow className="border-t-2 font-bold bg-muted/60">
                            <TableCell className="sticky left-0 bg-muted/60 z-10 uppercase text-xs tracking-wider font-extrabold pl-6 text-foreground">Total</TableCell>
                            <TableCell className="text-right border-l">
                              <div>{formatValue(pastTotal, totalPastCap)}</div>
                              {viewMode === "actual" && <VarianceLabel actual={pastTotal} scoped={pastTotalScoped} unitMode={unitMode} capacity={totalPastCap} scopedCapacity={totalPastCap} showNA />}
                            </TableCell>
                            <TableCell className="text-right">
                              <div>{formatValue(futureTotal, totalFutureCap)}</div>
                            </TableCell>
                            <TableCell className="text-right border-r">
                              <div>{formatValue(visibleTotal, totalAllCap)}</div>
                              {viewMode === "actual" && <VarianceLabel actual={visibleTotal} scoped={pastTotalScoped + futureTotalScoped} unitMode={unitMode} capacity={totalAllCap} scopedCapacity={totalAllCap} showNA />}
                            </TableCell>
                            {months.map((m) => {
                              const isPast = m < currentMonth;
                              const value = isPast && viewMode === "actual"
                                ? (monthTotals.actualTotals[m] || 0)
                                : (monthTotals.scopedTotals[m] || 0);
                              const scoped = monthTotals.scopedTotals[m] || 0;
                              const mCap = getMultiRoleMonthCap(allDisplayRoleIds, m);
                              return (
                                <TableCell key={m} className={cn("text-center font-bold", m < currentMonth && "bg-muted/10")}>
                                  {value > 0 ? (
                                    <>
                                      <div>{formatValue(value, mCap)}</div>
                                      {viewMode === "actual" && isPast && <VarianceLabel actual={value} scoped={scoped} unitMode={unitMode} capacity={mCap} scopedCapacity={mCap} />}
                                    </>
                                  ) : <span className="text-muted-foreground/30">—</span>}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* The original client team allocation and resourcing builder list */}
              <ClientTeamBuilder 
                clientName={selectedClient} 
                roleDemands={roleDemands} 
                months={months.filter(m => m >= currentMonth)} 
                clientOffice={selectedOffice} 
              />
            </div>
          )}
        </div>
      )}

      {/* Premium Google Drive Link Modal Popup */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in"
            onClick={() => setIsUrlModalOpen(false)}
          />
          
          {/* Premium Card Dialog */}
          <Card className="relative w-full max-w-lg border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Highlight Band */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-primary to-pink-500" />
            
            <div className="p-6 space-y-5">
              {/* Title & Close */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                    Configure GDrive Link
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Assign or update the Google Sheets fee calculator URL linked to this campaign.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsUrlModalOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-full"
                >
                  ✕
                </Button>
              </div>

              {/* Project Target Box */}
              <div className="p-3 bg-muted/30 border border-border/40 rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-extrabold block">Selected Campaign</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{editingProjectTitle}</span>
              </div>

              {/* Paste Input Area */}
              <div className="space-y-2">
                <Label htmlFor="gdrive-url" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Google Sheets / Drive URL
                </Label>
                <div className="relative">
                  <Input
                    id="gdrive-url"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={editingProjectUrl}
                    onChange={(e) => setEditingProjectUrl(e.target.value)}
                    className="pr-10 h-10 border-border/80 focus-visible:ring-primary text-xs bg-background/60 text-foreground"
                  />
                  <div className="absolute right-3 top-[50%] -translate-y-[50%] text-muted-foreground/40 pointer-events-none">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Pro-tip: Set link sharing permissions to &quot;Anyone with the link can view&quot; in Google Sheets to allow seamless embedded access.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsUrlModalOpen(false)}
                  className="h-9 text-xs font-bold border-border/80 hover:bg-muted/40"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveUrl}
                  className="h-9 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Save GDrive Link
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ClientPortfolioPage ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg max-w-4xl mx-auto my-12">
          <h2 className="text-lg font-bold mb-2">Something went wrong rendering the Client Portfolio Page</h2>
          <p className="text-sm text-muted-foreground mb-4">Please copy and send us the error trace below so we can fix it instantly:</p>
          <pre className="text-xs overflow-auto bg-black p-4 rounded text-red-400 font-mono whitespace-pre-wrap">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ClientPortfolioPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ClientPortfolioPage />
    </ErrorBoundary>
  );
}
