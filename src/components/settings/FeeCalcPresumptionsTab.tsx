import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calculator,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  Globe,
  Layers,
  Search,
  History,
  RotateCcw,
  ShieldAlert,
  Percent,
  Video,
  BarChart3,
  Cpu,
  UserCheck,
  ArrowRight,
  Pencil,
  Check,
  X,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DEFAULT_SERVICE_HOUR_PRESUMPTIONS,
  getStoredPresumptionOverrides,
  getStoredPresumptionHistory,
  syncPresumptionsFromDatabase,
  savePresumptionChange,
  PRESUMPTIONS_UPDATED_EVENT,
  type PresumptionRuleId,
  type ServiceHourPresumptions,
  type PresumptionHistoryEntry,
} from "@/components/fee-calculator/serviceHoursEngine";

interface EditableParamConfig {
  ruleId: PresumptionRuleId;
  label?: string;
  unit: string;
}

interface ServiceTaskConfig {
  task: string;
  role: string;
  params: EditableParamConfig[];
  scalingBadge: string;
  multiplierSummary: string;
  equationDetail: (p: ServiceHourPresumptions) => string;
  detailedExplanation: string;
  workedExample: (p: ServiceHourPresumptions) => string;
}

interface ServiceCategoryConfig {
  category: string;
  icon: React.ElementType;
  phase: string;
  tasks: ServiceTaskConfig[];
}

export function FeeCalcPresumptionsTab() {
  const { user, appUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [overrides, setOverrides] = useState<Partial<ServiceHourPresumptions>>(() =>
    getStoredPresumptionOverrides()
  );
  const [history, setHistory] = useState<PresumptionHistoryEntry[]>(() =>
    getStoredPresumptionHistory()
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<PresumptionRuleId | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>("");
  const [expandedInfoRows, setExpandedInfoRows] = useState<Record<string, boolean>>({});

  const toggleInfoRow = (rowKey: string) => {
    setExpandedInfoRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  useEffect(() => {
    syncPresumptionsFromDatabase().then(({ overrides: dbOverrides, history: dbHistory }) => {
      setOverrides(dbOverrides);
      setHistory(dbHistory);
    });
    const handleSync = () => {
      setOverrides(getStoredPresumptionOverrides());
      setHistory(getStoredPresumptionHistory());
    };
    window.addEventListener(PRESUMPTIONS_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(PRESUMPTIONS_UPDATED_EVENT, handleSync);
  }, []);

  const activePresumptions: ServiceHourPresumptions = {
    ...DEFAULT_SERVICE_HOUR_PRESUMPTIONS,
    ...overrides,
  };

  const currentUserName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    appUser?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "Platform User";

  const currentUserEmail = appUser?.email || user?.email || "user@billiondollarboy.com";

  const handleCommitEdit = async (
    category: string,
    task: string,
    role: string,
    param: EditableParamConfig,
    rawValue: string
  ) => {
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Please enter a valid non-negative number.");
      setEditingRuleId(null);
      return;
    }

    const rounded = Math.round(parsed * 100) / 100;
    const previousValue = activePresumptions[param.ruleId];

    if (rounded === previousValue) {
      setEditingRuleId(null);
      return;
    }

    const nextOverrides: Partial<ServiceHourPresumptions> = { ...overrides };
    if (rounded === DEFAULT_SERVICE_HOUR_PRESUMPTIONS[param.ruleId]) {
      delete nextOverrides[param.ruleId];
    } else {
      nextOverrides[param.ruleId] = rounded;
    }

    const entry: PresumptionHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      userName: currentUserName,
      userEmail: currentUserEmail,
      category,
      task: param.label ? `${task} (${param.label})` : task,
      role,
      ruleId: param.ruleId,
      previousValue,
      newValue: rounded,
      unit: param.unit,
      action: "update",
    };

    const nextHistory = [entry, ...history];
    setOverrides(nextOverrides);
    setHistory(nextHistory);
    setEditingRuleId(null);

    try {
      await savePresumptionChange(nextOverrides, nextHistory);
      toast.success(`Updated "${task}" to ${rounded}${param.unit}`);
    } catch {
      toast.error("Saved locally, but failed to sync change to cloud database.");
    }
  };

  const handleResetRule = async (
    category: string,
    task: string,
    role: string,
    param: EditableParamConfig
  ) => {
    const previousValue = activePresumptions[param.ruleId];
    const defaultValue = DEFAULT_SERVICE_HOUR_PRESUMPTIONS[param.ruleId];
    if (previousValue === defaultValue) return;

    const nextOverrides: Partial<ServiceHourPresumptions> = { ...overrides };
    delete nextOverrides[param.ruleId];

    const entry: PresumptionHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      userName: currentUserName,
      userEmail: currentUserEmail,
      category,
      task: param.label ? `${task} (${param.label})` : task,
      role,
      ruleId: param.ruleId,
      previousValue,
      newValue: defaultValue,
      unit: param.unit,
      action: "reset",
    };

    const nextHistory = [entry, ...history];
    setOverrides(nextOverrides);
    setHistory(nextHistory);

    try {
      await savePresumptionChange(nextOverrides, nextHistory);
      toast.success(`Reset "${task}" to default (${defaultValue}${param.unit})`);
    } catch {
      toast.error("Reset locally, but failed to sync to cloud database.");
    }
  };

  const handleResetAll = async () => {
    const modifiedKeys = Object.keys(overrides) as PresumptionRuleId[];
    if (modifiedKeys.length === 0) return;

    const now = new Date().toISOString();
    const resetEntries: PresumptionHistoryEntry[] = modifiedKeys.map((ruleId) => {
      const isPercent = ruleId.endsWith("_pct") || ruleId.startsWith("view_rate_");
      return {
        id: `${Date.now()}-${ruleId}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        userName: currentUserName,
        userEmail: currentUserEmail,
        category: ruleId.startsWith("view_rate_") ? "Talent Costs" : "All Categories",
        task: `Reset ${ruleId} to V6-3 Default`,
        role: "System Default",
        ruleId,
        previousValue: activePresumptions[ruleId],
        newValue: DEFAULT_SERVICE_HOUR_PRESUMPTIONS[ruleId],
        unit: isPercent ? "%" : " hrs",
        action: "reset",
      };
    });

    const nextHistory = [...resetEntries, ...history];
    setOverrides({});
    setHistory(nextHistory);

    try {
      await savePresumptionChange({}, nextHistory);
      toast.success("All presumptions reset to official V6-3 defaults.");
    } catch {
      toast.error("Reset locally, but failed to sync to cloud database.");
    }
  };

  const benchmarksGBP: {
    platform: string;
    format: string;
    a: number;
    b: number;
    minCPM: string;
    viewRateRuleId?: PresumptionRuleId;
    staticViewRate?: string;
  }[] = [
    { platform: "Instagram", format: "Single Image", a: 115, b: -8.39, minCPM: "£12.00", viewRateRuleId: "view_rate_ig_single_img" },
    { platform: "Instagram", format: "Multi Image (Carousel)", a: 171, b: -12.50, minCPM: "£12.00", viewRateRuleId: "view_rate_ig_multi_img" },
    { platform: "Instagram", format: "Short Video (Reels)", a: 175, b: -12.50, minCPM: "£12.00", viewRateRuleId: "view_rate_ig_short_vid" },
    { platform: "Instagram", format: "Story Frames", a: 151, b: -12.50, minCPM: "£12.00", viewRateRuleId: "view_rate_ig_story" },
    { platform: "TikTok", format: "Short Video", a: 259, b: -18.70, minCPM: "£12.00", viewRateRuleId: "view_rate_tt_short_vid" },
    { platform: "YouTube", format: "Short Video (Shorts)", a: 277, b: -20.70, minCPM: "£12.00", viewRateRuleId: "view_rate_yt_short_vid" },
    { platform: "YouTube", format: "Long Video (Dedicated/Integr.)", a: 277, b: -20.70, minCPM: "£12.00", viewRateRuleId: "view_rate_yt_long_vid" },
    { platform: "YouTube", format: "Story Frames (Community)", a: 151, b: -12.50, minCPM: "£12.00", viewRateRuleId: "view_rate_yt_story" },
    { platform: "Content House", format: "Single Image", a: 200, b: 0, minCPM: "£200 flat", staticViewRate: "Flat fee" },
    { platform: "Content House", format: "Short Video", a: 1500, b: 0, minCPM: "£1,500 flat", staticViewRate: "Flat fee" },
    { platform: "Content House", format: "Long Video", a: 2500, b: 0, minCPM: "£2,500 flat", staticViewRate: "Flat fee" },
  ];

  const territoryMultipliers = [
    { country: "United Kingdom", flag: "🇬🇧", multiplier: "1.00x", code: "UK", desc: "Baseline reference market" },
    { country: "United States", flag: "🇺🇸", multiplier: "1.40x", code: "US", desc: "Premium tier market (+40%)" },
    { country: "Nordics", flag: "🇸🇪", multiplier: "2.00x", code: "NO/SE/DK", desc: "High living cost index (+100%)" },
    { country: "Germany", flag: "🇩🇪", multiplier: "1.20x", code: "DE", desc: "DACH regional tier (+20%)" },
    { country: "Netherlands", flag: "🇳🇱", multiplier: "1.20x", code: "NL", desc: "Benelux regional tier (+20%)" },
    { country: "France", flag: "🇫🇷", multiplier: "1.00x", code: "FR", desc: "Standard European tier" },
    { country: "Italy", flag: "🇮🇹", multiplier: "0.70x", code: "IT", desc: "Southern Europe adjustment (-30%)" },
    { country: "Spain", flag: "🇪🇸", multiplier: "0.70x", code: "ES", desc: "Southern Europe adjustment (-30%)" },
    { country: "Brazil", flag: "🇧🇷", multiplier: "0.55x", code: "BR", desc: "LATAM regional adjustment (-45%)" },
    { country: "India", flag: "🇮🇳", multiplier: "0.50x", code: "IN", desc: "APAC regional adjustment (-50%)" },
  ];

  const serviceCategories: ServiceCategoryConfig[] = [
    {
      category: "Set Up & Planning",
      icon: Clock,
      phase: "RTB",
      tasks: [
        {
          task: "Kickoff & Strategic Planning",
          role: "Account Director",
          params: [{ ruleId: "setup_ad_planning", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_ad_planning} hrs (Flat project baseline)`,
          detailedExplanation:
            "Every project scope automatically includes this fixed baseline allocation for the Account Director to lead client kickoff, align on campaign objectives, and establish the strategic roadmap during Return To Brief (RTB). It does not scale with creator count or project duration.",
          workedExample: (p) => `Any active project scope → ${p.setup_ad_planning} hrs allocated to Account Director.`,
        },
        {
          task: "Execution Setup & Account Planning",
          role: "Account Manager",
          params: [{ ruleId: "setup_am_planning", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_am_planning} hrs (Flat project baseline)`,
          detailedExplanation:
            "A one-off allocation applied to every project scope for the Account Manager to set up operational trackers, internal workspace templates, timeline milestones, and client communication channels.",
          workedExample: (p) => `Any active project scope → ${p.setup_am_planning} hrs allocated to Account Manager.`,
        },
        {
          task: "Creative Strategy Oversight",
          role: "Creative Director",
          params: [{ ruleId: "setup_cd_planning", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "When Creative service is enabled",
          equationDetail: (p) => `Total Hours = ${p.setup_cd_planning} hrs × (1 if Creative Active, else 0)`,
          detailedExplanation:
            "Applies a fixed allocation for the Creative Director during initial setup only when the Creative & Strategy module is toggled on in the Fee Calculator. If Creative is disabled, 0 hours are allocated.",
          workedExample: (p) => `Creative enabled → ${p.setup_cd_planning} hrs | Creative disabled → 0 hrs.`,
        },
        {
          task: "Content Strategy Framing",
          role: "Content Strategy Director",
          params: [{ ruleId: "setup_csd_planning", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_csd_planning} hrs (Flat project baseline)`,
          detailedExplanation:
            "Included once on every project scope for the Content Strategy Director to frame audience insights, platform architecture, and strategic pillars at project kickoff.",
          workedExample: (p) => `Any active project scope → ${p.setup_csd_planning} hrs allocated to Content Strategy Director.`,
        },
        {
          task: "Financial Scope & Budgeting",
          role: "Project Manager",
          params: [{ ruleId: "setup_pm_budgeting", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_pm_budgeting} hrs (Flat project baseline)`,
          detailedExplanation:
            "Fixed allocation on every project for the Project Manager to build the commercial scope, resource plan, and internal fee reconciliation.",
          workedExample: (p) => `Any active project scope → ${p.setup_pm_budgeting} hrs allocated to Project Manager.`,
        },
        {
          task: "Executive Review",
          role: "Senior Account Director",
          params: [{ ruleId: "setup_sad_review", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_sad_review} hrs (Flat project baseline)`,
          detailedExplanation:
            "Fixed allocation for senior executive sign-off on commercial deliverables, client expectations, and Return To Brief alignment.",
          workedExample: (p) => `Any active project scope → ${p.setup_sad_review} hrs allocated to Senior Account Director.`,
        },
        {
          task: "Client Term Sheet Preparation",
          role: "Global Senior Business Affairs Manager",
          params: [{ ruleId: "setup_sba_terms", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_sba_terms} hrs (Flat project baseline)`,
          detailedExplanation:
            "Fixed legal preparation time for drafting the client term sheet and commercial schedule at the start of the engagement.",
          workedExample: (p) => `Any active project scope → ${p.setup_sba_terms} hrs allocated to Global Senior Business Affairs Manager.`,
        },
        {
          task: "Client Deal Governance",
          role: "Global Director of Business Affairs",
          params: [{ ruleId: "setup_dba_review", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.setup_dba_review} hrs (Flat project baseline)`,
          detailedExplanation:
            "Fixed allocation for master client MSA/SOW contract review, liability checks, and commercial deal governance.",
          workedExample: (p) => `Any active project scope → ${p.setup_dba_review} hrs allocated to Global Director of Business Affairs.`,
        },
      ],
    },
    {
      category: "Creative & Strategy Development",
      icon: Sparkles,
      phase: "RTB",
      tasks: [
        {
          task: "Strategy Development",
          role: "Senior Content Strategist",
          params: [{ ruleId: "creative_strat_dev", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "When Creative & Strategy is active",
          equationDetail: (p) => `Total Hours = ${p.creative_strat_dev} hrs (When Creative Jobs > 0)`,
          detailedExplanation:
            "Allocated whenever the Creative & Strategy module is enabled and at least one creative concept or executional idea is scoped. Covers audience research, cultural truths, and strategic platform territories.",
          workedExample: (p) => `Creative active with ≥1 concept/idea → ${p.creative_strat_dev} hrs.`,
        },
        {
          task: "Creative Ideation & Execution",
          role: "Creative",
          params: [
            { ruleId: "creative_ideation_base", label: "Base", unit: "h" },
            { ruleId: "creative_ideation_per_job", label: "Per Job", unit: "h" },
          ],
          scalingBadge: "Base + × Creative Jobs",
          multiplierSummary: "Scales by RTB concepts, ideas & feedback rounds",
          equationDetail: (p) =>
            `Total Hours = ${p.creative_ideation_base}h Base + (${p.creative_ideation_per_job}h × Creative Jobs)`,
          detailedExplanation:
            "Combines a fixed base ideation allocation with a per-job multiplier. 'Creative Jobs' is derived from the Return To Brief (RTB) formula: for each round (1 + Feedback Rounds), Creative Days = (Concepts × 5) + (Ideas × 2.5) + (Ideas × (Concepts − 1)), with Concepts capped at 1 from Round 3 onwards. Total Creative Jobs = Total Creative Days ÷ 4.",
          workedExample: (p) =>
            `If Creative Jobs = 3 → ${p.creative_ideation_base} + (3 × ${p.creative_ideation_per_job}) = ${
              Math.round((p.creative_ideation_base + 3 * p.creative_ideation_per_job) * 10) / 10
            } hrs.`,
        },
        {
          task: "Visual Route & Art Direction",
          role: "Senior Designer",
          params: [{ ruleId: "creative_designer_per_job", label: "Per Job", unit: " hrs" }],
          scalingBadge: "× Creative Jobs",
          multiplierSummary: "Per derived Creative Job",
          equationDetail: (p) => `Total Hours = ${p.creative_designer_per_job} hrs × Creative Jobs`,
          detailedExplanation:
            "Multiplies the allocated hours by the number of Creative Jobs (Total RTB Creative Days ÷ 4) to cover moodboards, visual mockups, and art direction routes.",
          workedExample: (p) =>
            `If Creative Jobs = 3 → 3 × ${p.creative_designer_per_job} = ${
              Math.round(3 * p.creative_designer_per_job * 10) / 10
            } hrs.`,
        },
        {
          task: "Deck Presentation Strategy",
          role: "Senior Content Strategist",
          params: [{ ruleId: "creative_pres_strat", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Capped strategy deck allocation",
          equationDetail: (p) => `Total Hours = ${p.creative_pres_strat} hrs (Default: Min(25% × Strategy Dev, 4h))`,
          detailedExplanation:
            "Time allocated to the Senior Content Strategist to author and structure the strategy narrative within the client Return To Brief presentation deck.",
          workedExample: (p) => `Active Creative scope → ${p.creative_pres_strat} hrs.`,
        },
        {
          task: "Deck Presentation Creative",
          role: "Senior Creative",
          params: [{ ruleId: "creative_pres_creative_cap", label: "Cap", unit: " hrs" }],
          scalingBadge: "25% up to Cap",
          multiplierSummary: "Quarter of Creative Ideation hours (capped)",
          equationDetail: (p) => `Total Hours = Min(25% × Creative Ideation Hrs, ${p.creative_pres_creative_cap} hrs)`,
          detailedExplanation:
            "Allocates 25% of total Creative Ideation & Execution hours to write up creative territories and scripts into the presentation deck, up to the maximum cap.",
          workedExample: (p) =>
            `If Creative Ideation = 28h → 25% is 7h (below ${p.creative_pres_creative_cap}h cap) → 7.0 hrs.`,
        },
        {
          task: "Deck Presentation Design",
          role: "Senior Designer",
          params: [{ ruleId: "creative_pres_design_pct", unit: "%" }],
          scalingBadge: "% of Creative & Deck",
          multiplierSummary: "Applied to Ideation + Strategy Deck + Creative Deck",
          equationDetail: (p) =>
            `Total Hours = ${p.creative_pres_design_pct}% × (Creative Ideation + Strategy Deck + Creative Deck Hrs)`,
          detailedExplanation:
            "Calculates Senior Designer presentation layout and formatting hours as a percentage of the combined creative ideation and deck writing hours.",
          workedExample: (p) =>
            `If combined Ideation & Deck writing = 40h → ${p.creative_pres_design_pct}% × 40h = ${
              Math.round(40 * (p.creative_pres_design_pct / 100) * 10) / 10
            } hrs.`,
        },
        {
          task: "Production Feasibility & Costs",
          role: "Senior Producer",
          params: [{ ruleId: "creative_producer_pct", unit: "%" }],
          scalingBadge: "% of Design & Strategy",
          multiplierSummary: "Applied to Visual Route Design + Strategy Dev",
          equationDetail: (p) =>
            `Total Hours = ${p.creative_producer_pct}% × (Visual Route Design Hrs + Strategy Dev Hrs)`,
          detailedExplanation:
            "Allocates Senior Producer time to scope shoot feasibility, production schedules, and preliminary budgets during Return To Brief, scaled as a percentage of design and strategy development hours.",
          workedExample: (p) =>
            `If Visual Route (6h) + Strategy Dev (15h) = 21h → ${p.creative_producer_pct}% × 21h = ${
              Math.round(21 * (p.creative_producer_pct / 100) * 10) / 10
            } hrs.`,
        },
        {
          task: "Creative Direction Oversight",
          role: "Creative Director",
          params: [{ ruleId: "creative_cd_pct", unit: "%" }],
          scalingBadge: "% of Creative Hrs",
          multiplierSummary: "Applied to Ideation + Visual Route + Deck hours",
          equationDetail: (p) =>
            `Total Hours = ${p.creative_cd_pct}% × (Creative Ideation + Visual Route + Creative Deck + Design Deck Hrs)`,
          detailedExplanation:
            "Calculates Creative Director supervision, concept reviews, and pitch attendance as a percentage of all creative and design execution hours in the module.",
          workedExample: (p) =>
            `If total creative & design execution = 40h → ${p.creative_cd_pct}% × 40h = ${
              Math.round(40 * (p.creative_cd_pct / 100) * 10) / 10
            } hrs.`,
        },
        {
          task: "Strategy Direction Oversight",
          role: "Content Strategy Director",
          params: [{ ruleId: "creative_csd_pct", unit: "%" }],
          scalingBadge: "% of Strategy Hrs",
          multiplierSummary: "Applied to Strategy Dev + Strategy Deck hours",
          equationDetail: (p) => `Total Hours = ${p.creative_csd_pct}% × (Strategy Dev Hrs + Strategy Deck Hrs)`,
          detailedExplanation:
            "Calculates Content Strategy Director direction and sign-off as a percentage of total strategy development and presentation hours.",
          workedExample: (p) =>
            `If Strategy Dev (15h) + Strategy Deck (3.75h) = 18.75h → ${p.creative_csd_pct}% × 18.75h = ${
              Math.round(18.75 * (p.creative_csd_pct / 100) * 10) / 10
            } hrs.`,
        },
      ],
    },
    {
      category: "Talent Brief & Creator Contracting",
      icon: Users,
      phase: "Creators & Contracting",
      tasks: [
        {
          task: "Influencer Brief Draft",
          role: "Account Manager",
          params: [{ ruleId: "talent_brief_am", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "When Talent campaign is active",
          equationDetail: (p) => `Total Hours = ${p.talent_brief_am} hrs (When Talent Active & Creators > 0)`,
          detailedExplanation:
            "One-off allocation for the Account Manager to write the master influencer brief (deliverable specs, mandatories, do's & don'ts, timeline) whenever Talent is enabled on the campaign.",
          workedExample: (p) => `Talent enabled with ≥1 creator → ${p.talent_brief_am} hrs.`,
        },
        {
          task: "Influencer Brief Creative Input",
          role: "Senior Creative",
          params: [{ ruleId: "talent_brief_sc", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "When Talent campaign is active",
          equationDetail: (p) => `Total Hours = ${p.talent_brief_sc} hrs (When Talent Active & Creators > 0)`,
          detailedExplanation:
            "Fixed allocation for a Senior Creative to inject creative thought-starters, visual references, and tonal guidance into the master influencer brief.",
          workedExample: (p) => `Talent enabled with ≥1 creator → ${p.talent_brief_sc} hrs.`,
        },
        {
          task: "Influencer Brief Revisions",
          role: "Account Manager / Senior Creative",
          params: [
            { ruleId: "talent_brief_rev_am", label: "AM", unit: "h" },
            { ruleId: "talent_brief_rev_sc", label: "SC", unit: "h" },
          ],
          scalingBadge: "× Brief Revisions",
          multiplierSummary: "Per client brief revision round",
          equationDetail: (p) =>
            `Total Hours = (${p.talent_brief_rev_am}h AM + ${p.talent_brief_rev_sc}h SC) × Brief Revision Rounds`,
          detailedExplanation:
            "Multiplies the Account Manager and Senior Creative revision allocations by the number of Influencer Brief Revision rounds specified in the Fee Calculator.",
          workedExample: (p) =>
            `2 revision rounds → AM: ${2 * p.talent_brief_rev_am}h, Senior Creative: ${2 * p.talent_brief_rev_sc}h.`,
        },
        {
          task: "Creator Search & Longlist",
          role: "Account Executive",
          params: [{ ruleId: "talent_search_ae", unit: " hrs" }],
          scalingBadge: "× Creators",
          multiplierSummary: "Per contracted creator",
          equationDetail: (p) => `Total Hours = ${p.talent_search_ae} hrs × Total Creators`,
          detailedExplanation:
            "Scales linearly with the total number of contracted creators across all talent groups. Covers discovery, audience credibility checks, engagement rate verification, and longlist build.",
          workedExample: (p) => `10 creators → 10 × ${p.talent_search_ae} = ${10 * p.talent_search_ae} hrs.`,
        },
        {
          task: "Creator Search Oversight",
          role: "Account Manager",
          params: [{ ruleId: "talent_search_am", unit: " hrs" }],
          scalingBadge: "× Creators",
          multiplierSummary: "Per contracted creator",
          equationDetail: (p) => `Total Hours = ${p.talent_search_am} hrs × Total Creators`,
          detailedExplanation:
            "Scales linearly with total contracted creators for the Account Manager to audit brand fit, review historical partnerships, and curate the client-ready shortlist.",
          workedExample: (p) => `10 creators → 10 × ${p.talent_search_am} = ${10 * p.talent_search_am} hrs.`,
        },
        {
          task: "Longlist Client Revisions",
          role: "AE & AM",
          params: [{ ruleId: "talent_longlist_rev_pct", unit: "%" }],
          scalingBadge: "% × Revisions",
          multiplierSummary: "Of initial Search hours per revision round",
          equationDetail: (p) =>
            `Total Hours = (${p.talent_longlist_rev_pct}% × Initial Search Hrs) × Longlist Revision Rounds`,
          detailedExplanation:
            "Each round of client feedback on the creator longlist adds this percentage of the baseline AE and AM Creator Search hours to source replacement talent.",
          workedExample: (p) =>
            `If initial Search = 30h and 1 revision round → ${p.talent_longlist_rev_pct}% × 30h = ${
              Math.round(30 * (p.talent_longlist_rev_pct / 100) * 10) / 10
            } hrs.`,
        },
        {
          task: "Outreach & Fee Negotiations",
          role: "AE & AM",
          params: [
            { ruleId: "talent_engage_ae", label: "AE", unit: "h" },
            { ruleId: "talent_negotiate_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "× Creators",
          multiplierSummary: "Per contracted creator",
          equationDetail: (p) => `Total Hours = (${p.talent_engage_ae}h AE + ${p.talent_negotiate_am}h AM) × Total Creators`,
          detailedExplanation:
            "Covers talent agent outreach, availability checks, exclusivity vetting (AE) and commercial fee & usage rights negotiation (AM) for every contracted creator.",
          workedExample: (p) =>
            `10 creators → AE: ${10 * p.talent_engage_ae}h, AM: ${10 * p.talent_negotiate_am}h (Total ${
              10 * (p.talent_engage_ae + p.talent_negotiate_am)
            } hrs).`,
        },
        {
          task: "Contract Drafting & Execution",
          role: "Account Manager",
          params: [{ ruleId: "talent_contract_am", unit: " hrs" }],
          scalingBadge: "× Creators",
          multiplierSummary: "Per contracted creator",
          equationDetail: (p) => `Total Hours = ${p.talent_contract_am} hrs × Total Creators`,
          detailedExplanation:
            "Allocates Account Manager time per creator to populate commercial schedules, deliverable dates, and payment terms in each creator agreement.",
          workedExample: (p) => `10 creators → 10 × ${p.talent_contract_am} = ${10 * p.talent_contract_am} hrs.`,
        },
        {
          task: "Master Term Sheet Negotiation",
          role: "Global Senior Business Affairs Manager",
          params: [{ ruleId: "talent_terms_sba", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "When Talent campaign is active",
          equationDetail: (p) => `Total Hours = ${p.talent_terms_sba} hrs (Flat campaign allocation)`,
          detailedExplanation:
            "Fixed legal allocation per campaign to customise the master influencer contract template with client-specific usage rights, morality clauses, and territory rules.",
          workedExample: (p) => `Active Talent scope → ${p.talent_terms_sba} hrs.`,
        },
        {
          task: "Deal Risk Review",
          role: "Global Director of Business Affairs",
          params: [{ ruleId: "talent_terms_dba", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "When Talent campaign is active",
          equationDetail: (p) => `Total Hours = ${p.talent_terms_dba} hrs (Flat campaign allocation)`,
          detailedExplanation:
            "Fixed senior legal sign-off on master talent contracting terms and regulatory compliance.",
          workedExample: (p) => `Active Talent scope → ${p.talent_terms_dba} hrs.`,
        },
        {
          task: "Contract Execution & Compliance",
          role: "Global Business Affairs Executive",
          params: [{ ruleId: "talent_contract_bae", unit: " hrs" }],
          scalingBadge: "× Creators",
          multiplierSummary: "Per contracted creator",
          equationDetail: (p) => `Total Hours = ${p.talent_contract_bae} hrs × Total Creators`,
          detailedExplanation:
            "Covers legal redlines with talent agents, markup approvals, and final signature execution per contracted creator.",
          workedExample: (p) => `10 creators → 10 × ${p.talent_contract_bae} = ${10 * p.talent_contract_bae} hrs.`,
        },
      ],
    },
    {
      category: "Live Campaign Management",
      icon: Video,
      phase: "Content Creation & Go Live",
      tasks: [
        {
          task: "Instagram Briefing",
          role: "AE & AM",
          params: [
            { ruleId: "camp_ig_brief_ae", label: "AE", unit: "h" },
            { ruleId: "camp_ig_brief_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "× IG Creators",
          multiplierSummary: "Per Instagram creator",
          equationDetail: (p) =>
            `Total Hours = (${p.camp_ig_brief_ae}h AE + ${p.camp_ig_brief_am}h AM) × Instagram Creators`,
          detailedExplanation:
            "Multiplies AE and AM briefing hours by the number of creators assigned to Instagram talent groups. Covers briefing calls, creative alignment, and shipping/timeline confirmation.",
          workedExample: (p) =>
            `5 Instagram creators → AE: ${Math.round(5 * p.camp_ig_brief_ae * 10) / 10}h, AM: ${
              Math.round(5 * p.camp_ig_brief_am * 10) / 10
            }h.`,
        },
        {
          task: "Instagram Image/Story Management",
          role: "AE & AM",
          params: [
            { ruleId: "camp_ig_img_ae", label: "AE", unit: "h" },
            { ruleId: "camp_ig_img_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "× IG Static/Story",
          multiplierSummary: "Per Instagram image, carousel, or story set",
          equationDetail: (p) =>
            `Total Hours = (${p.camp_ig_img_ae}h AE + ${p.camp_ig_img_am}h AM) × (IG Images + IG Stories)`,
          detailedExplanation:
            "Applies when Content Ideation and Content Production are active. Multiplies AE and AM management hours by total Instagram static posts, carousels, and story frame sets.",
          workedExample: (p) =>
            `10 IG image/story deliverables → AE: ${Math.round(10 * p.camp_ig_img_ae * 10) / 10}h, AM: ${
              Math.round(10 * p.camp_ig_img_am * 10) / 10
            }h.`,
        },
        {
          task: "Instagram Video / Reel Management",
          role: "AE & AM",
          params: [
            { ruleId: "camp_ig_vid_ae", label: "AE", unit: "h" },
            { ruleId: "camp_ig_vid_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "× IG Reels",
          multiplierSummary: "Per Instagram Reel deliverable",
          equationDetail: (p) => `Total Hours = (${p.camp_ig_vid_ae}h AE + ${p.camp_ig_vid_am}h AM) × Instagram Videos`,
          detailedExplanation:
            "Multiplies AE and AM production management hours by the total number of Instagram Reels/short videos across all Instagram creator groups.",
          workedExample: (p) =>
            `8 Instagram Reels → AE: ${Math.round(8 * p.camp_ig_vid_ae * 10) / 10}h, AM: ${
              Math.round(8 * p.camp_ig_vid_am * 10) / 10
            }h.`,
        },
        {
          task: "TikTok Briefing & Video Management",
          role: "AE & AM",
          params: [
            { ruleId: "camp_tt_brief_ae", label: "Brief AE", unit: "h" },
            { ruleId: "camp_tt_brief_am", label: "Brief AM", unit: "h" },
            { ruleId: "camp_tt_vid_ae", label: "Vid AE", unit: "h" },
            { ruleId: "camp_tt_vid_am", label: "Vid AM", unit: "h" },
          ],
          scalingBadge: "× TT Creators & Videos",
          multiplierSummary: "Briefing per creator + management per video",
          equationDetail: (p) =>
            `Total Hours = ((${p.camp_tt_brief_ae}h + ${p.camp_tt_brief_am}h) × TT Creators) + ((${p.camp_tt_vid_ae}h + ${p.camp_tt_vid_am}h) × TT Videos)`,
          detailedExplanation:
            "Splits TikTok campaign management into two components: onboarding/briefing hours multiplied by TikTok creator count, plus draft review and go-live management multiplied by total TikTok video deliverables.",
          workedExample: (p) =>
            `4 TT creators producing 8 TT videos → ${
              4 * (p.camp_tt_brief_ae + p.camp_tt_brief_am) + 8 * (p.camp_tt_vid_ae + p.camp_tt_vid_am)
            } hrs total.`,
        },
        {
          task: "YouTube Briefing & Video Management",
          role: "AE & AM",
          params: [
            { ruleId: "camp_yt_brief_ae", label: "Brief AE", unit: "h" },
            { ruleId: "camp_yt_brief_am", label: "Brief AM", unit: "h" },
            { ruleId: "camp_yt_vid_ae", label: "Vid AE", unit: "h" },
            { ruleId: "camp_yt_vid_am", label: "Vid AM", unit: "h" },
          ],
          scalingBadge: "× YT Creators & Videos",
          multiplierSummary: "Briefing per creator + management per video",
          equationDetail: (p) =>
            `Total Hours = ((${p.camp_yt_brief_ae}h + ${p.camp_yt_brief_am}h) × YT Creators) + ((${p.camp_yt_vid_ae}h + ${p.camp_yt_vid_am}h) × YT Videos)`,
          detailedExplanation:
            "Combines per-creator briefing hours with per-video script, rough-cut, and integration management across all YouTube creators and deliverables.",
          workedExample: (p) =>
            `2 YT creators producing 4 YT videos → ${
              2 * (p.camp_yt_brief_ae + p.camp_yt_brief_am) + 4 * (p.camp_yt_vid_ae + p.camp_yt_vid_am)
            } hrs total.`,
        },
        {
          task: "Creative Content Reviews",
          role: "Creative",
          params: [{ ruleId: "camp_creative_review", unit: " hrs" }],
          scalingBadge: "× Deliverables",
          multiplierSummary: "Per creator deliverable across all platforms",
          equationDetail: (p) =>
            `Total Hours = ${p.camp_creative_review} hrs × (IG Assets + TT Videos + YT Videos + Gifting Creators)`,
          detailedExplanation:
            "Allocates Creative team QA review time for every single deliverable submitted across Instagram, TikTok, YouTube, and Gifting tracks to ensure creative and brand standards are met.",
          workedExample: (p) =>
            `20 total deliverables → 20 × ${p.camp_creative_review} = ${
              Math.round(20 * p.camp_creative_review * 10) / 10
            } hrs.`,
        },
        {
          task: "Gifting Creator Briefing & Logistics",
          role: "AE & AM",
          params: [
            { ruleId: "camp_gift_brief_total", label: "Brief", unit: "h" },
            { ruleId: "camp_gift_mgmt_total", label: "Mgmt", unit: "h" },
          ],
          scalingBadge: "× Gifting Creators",
          multiplierSummary: "Per organic gifting creator (split 50/50 AE & AM)",
          equationDetail: (p) =>
            `Total Hours = (${p.camp_gift_brief_total}h Brief + ${p.camp_gift_mgmt_total}h Mgmt) × Gifting Creators`,
          detailedExplanation:
            "Applies a lightweight workflow for organic gifting tiers. Both the Briefing allocation and Content Management allocation are split equally (50% AE / 50% AM) and multiplied by the number of gifting creators.",
          workedExample: (p) =>
            `20 gifting creators → 20 × (${p.camp_gift_brief_total} + ${p.camp_gift_mgmt_total}) = ${
              Math.round(20 * (p.camp_gift_brief_total + p.camp_gift_mgmt_total) * 10) / 10
            } hrs.`,
        },
        {
          task: "Product Procurement Shipments",
          role: "AE & AM",
          params: [{ ruleId: "camp_proc_total", unit: " hrs" }],
          scalingBadge: "× Shipments",
          multiplierSummary: "Per product shipment (split 50/50 AE & AM)",
          equationDetail: (p) => `Total Hours = ${p.camp_proc_total} hrs × Total Shipments (50% AE / 50% AM)`,
          detailedExplanation:
            "When Product Procurement is enabled, multiplies the per-shipment time by total shipments to cover address validation, dispatch coordination, and tracking.",
          workedExample: (p) =>
            `15 shipments → 15 × ${p.camp_proc_total} = ${Math.round(15 * p.camp_proc_total * 10) / 10} hrs.`,
        },
      ],
    },
    {
      category: "Specialist Production Services",
      icon: Layers,
      phase: "Content Creation & Go Live",
      tasks: [
        {
          task: "Content House Shoot Units",
          role: "AE, AM, Designer, Creative",
          params: [{ ruleId: "prod_ch_total", unit: " hrs" }],
          scalingBadge: "× Shoot Assets",
          multiplierSummary: "Per Content House asset unit",
          equationDetail: (p) =>
            `Total Hours = ${p.prod_ch_total} hrs × Content House Assets (44% AE, 32% AM, 16% Designer, 8% Creative)`,
          detailedExplanation:
            "Triggered when Content House deliverables are scoped. Total hours per studio asset are distributed across Account Executive (briefing, prod mgmt, product selection), Account Manager (briefing, prod mgmt), Designer, and Creative.",
          workedExample: (p) =>
            `4 Content House assets → 4 × ${p.prod_ch_total} = ${Math.round(4 * p.prod_ch_total * 10) / 10} hrs.`,
        },
        {
          task: "AR Filters Development",
          role: "Designer & Senior Creative",
          params: [
            { ruleId: "prod_ar_design", label: "Design", unit: "h" },
            { ruleId: "prod_ar_creative", label: "Creative", unit: "h" },
          ],
          scalingBadge: "× AR Filters",
          multiplierSummary: "Per AR filter built",
          equationDetail: (p) =>
            `Total Hours = (${p.prod_ar_design}h Designer + ${p.prod_ar_creative}h Snr Creative) × AR Filters`,
          detailedExplanation:
            "Multiplies Designer 3D/effect build hours and Senior Creative concepting hours by the number of AR Filters entered in Other Services.",
          workedExample: (p) =>
            `1 AR Filter → ${p.prod_ar_design}h Designer + ${p.prod_ar_creative}h Senior Creative = ${
              p.prod_ar_design + p.prod_ar_creative
            } hrs.`,
        },
        {
          task: "AR Filter Influencer Promotion",
          role: "Account Manager",
          params: [{ ruleId: "prod_ar_am", unit: " hrs" }],
          scalingBadge: "× AR Filters",
          multiplierSummary: "Per AR filter seeded",
          equationDetail: (p) => `Total Hours = ${p.prod_ar_am} hrs × AR Filters (Search + Engage + Contract)`,
          detailedExplanation:
            "Allocates Account Manager time per AR filter to source, engage, and contract seeding creators to promote the filter at launch.",
          workedExample: (p) => `1 AR Filter → ${p.prod_ar_am} hrs allocated to Account Manager.`,
        },
        {
          task: "Custom GIFs / Stickers",
          role: "Designer",
          params: [{ ruleId: "prod_gifs_design", unit: " hrs" }],
          scalingBadge: "× GIFs",
          multiplierSummary: "Per custom GIF / sticker",
          equationDetail: (p) => `Total Hours = ${p.prod_gifs_design} hrs × GIF Count`,
          detailedExplanation:
            "Multiplies Designer illustration and animation hours by the number of custom GIPHY stickers scoped.",
          workedExample: (p) => `3 GIFs → 3 × ${p.prod_gifs_design} = ${3 * p.prod_gifs_design} hrs.`,
        },
        {
          task: "Gifting Box Concept & Design",
          role: "Designer & Senior Designer",
          params: [{ ruleId: "prod_gift_concept_total", unit: " hrs" }],
          scalingBadge: "× Box Designs",
          multiplierSummary: "Per unique gifting box design",
          equationDetail: (p) =>
            `Total Hours = ${p.prod_gift_concept_total} hrs × Gifting Designs (83.3% Designer / 16.7% Snr Designer)`,
          detailedExplanation:
            "Covers initial structural packaging concepts and visual mockups per unique gifting box design, split 5:1 between Designer and Senior Designer.",
          workedExample: (p) =>
            `1 box design → ${p.prod_gift_concept_total} hrs total (Designer + Senior Designer).`,
        },
        {
          task: "Gifting Box Route & Production",
          role: "Designer & Senior Designer",
          params: [{ ruleId: "prod_gift_route_prod_total", unit: " hrs" }],
          scalingBadge: "× Box Designs",
          multiplierSummary: "Per unique gifting box design",
          equationDetail: (p) =>
            `Total Hours = ${p.prod_gift_route_prod_total} hrs × Gifting Designs (Route Dev + Print Production)`,
          detailedExplanation:
            "Covers full artwork route development and print-ready die-line production per unique gifting box design, split between Designer and Senior Designer.",
          workedExample: (p) => `1 box design → ${p.prod_gift_route_prod_total} hrs total.`,
        },
        {
          task: "Gifting Box Sourcing & Suppliers",
          role: "Producer",
          params: [{ ruleId: "prod_gift_producer", unit: " hrs" }],
          scalingBadge: "× Box Designs",
          multiplierSummary: "Per unique gifting box design",
          equationDetail: (p) =>
            `Total Hours = ${p.prod_gift_producer} hrs × Gifting Designs (57% Supplier Mgmt / 43% Sourcing)`,
          detailedExplanation:
            "Allocates Producer time per box design to manage packaging manufacturers, print proofs, and bespoke item sourcing.",
          workedExample: (p) => `1 box design → ${p.prod_gift_producer} hrs allocated to Producer.`,
        },
        {
          task: "Gifting Box Packing & Dispatch",
          role: "Account Executive",
          params: [{ ruleId: "prod_gift_pack_ae", unit: " hrs" }],
          scalingBadge: "× Boxes Shipped",
          multiplierSummary: "Per physical gifting box mailed",
          equationDetail: (p) => `Total Hours = ${p.prod_gift_pack_ae} hrs × Gifting Boxes`,
          detailedExplanation:
            "Multiplies fulfilment and dispatch handling time by the total number of physical gifting boxes shipped to creators.",
          workedExample: (p) =>
            `50 gifting boxes → 50 × ${p.prod_gift_pack_ae} = ${Math.round(50 * p.prod_gift_pack_ae * 10) / 10} hrs.`,
        },
        {
          task: "Brand Events Management",
          role: "Snr Creative & Account Manager",
          params: [
            { ruleId: "prod_event_creative", label: "Creative", unit: "h" },
            { ruleId: "prod_event_am", label: "AM/Event", unit: "h" },
          ],
          scalingBadge: "Fixed + × Events",
          multiplierSummary: "Fixed concepting + AM hours per event",
          equationDetail: (p) =>
            `Total Hours = ${p.prod_event_creative}h Snr Creative (Fixed) + (${p.prod_event_am}h AM × Event Count)`,
          detailedExplanation:
            "When Brand Events are scoped, allocates a fixed Senior Creative block for event concepting plus per-event Account Manager hours covering vendor bookings (2/3) and live event attendance (1/3).",
          workedExample: (p) =>
            `2 events → ${p.prod_event_creative}h Creative + (2 × ${p.prod_event_am}h AM) = ${
              p.prod_event_creative + 2 * p.prod_event_am
            } hrs.`,
        },
      ],
    },
    {
      category: "Paid Media Strategy & Management",
      icon: TrendingUp,
      phase: "Content Creation & Go Live",
      tasks: [
        {
          task: "Paid Social Strategy & Creative",
          role: "Paid Media Director",
          params: [{ ruleId: "paid_strat_dir", unit: " hrs" }],
          scalingBadge: "× Live Months",
          multiplierSummary: "Per active paid media month",
          equationDetail: (p) => `Total Hours = ${p.paid_strat_dir} hrs × Paid Live Months`,
          detailedExplanation:
            "Multiplies Paid Media Director strategic planning and creative review hours by the number of active Paid Media Live Months.",
          workedExample: (p) => `3 live months → 3 × ${p.paid_strat_dir} = ${3 * p.paid_strat_dir} hrs.`,
        },
        {
          task: "Ad Account Setup & Governance",
          role: "Paid Media Manager",
          params: [{ ruleId: "paid_setup_mgr", unit: " hrs" }],
          scalingBadge: "× Live Months",
          multiplierSummary: "Per active paid media month",
          equationDetail: (p) => `Total Hours = ${p.paid_setup_mgr} hrs × Paid Live Months`,
          detailedExplanation:
            "Covers monthly ad account setup, pixel tracking verification, and billing governance across the active paid media flight.",
          workedExample: (p) => `3 live months → 3 × ${p.paid_setup_mgr} = ${3 * p.paid_setup_mgr} hrs.`,
        },
        {
          task: "Creator Access / Whitelisting Setup",
          role: "Senior Paid Media Executive",
          params: [{ ruleId: "paid_whitelisting_exec", unit: " hrs" }],
          scalingBadge: "× Creators",
          multiplierSummary: "Per contracted creator",
          equationDetail: (p) => `Total Hours = ${p.paid_whitelisting_exec} hrs × Total Creators`,
          detailedExplanation:
            "Allocates technical setup time per creator to establish Meta Branded Content permissions, TikTok Spark Ad codes, and handle connections.",
          workedExample: (p) =>
            `10 creators → 10 × ${p.paid_whitelisting_exec} = ${10 * p.paid_whitelisting_exec} hrs.`,
        },
        {
          task: "Audience & Campaign Architecture",
          role: "Senior Paid Media Executive",
          params: [{ ruleId: "paid_build_exec", unit: " hrs" }],
          scalingBadge: "× Live Months",
          multiplierSummary: "Per active paid media month",
          equationDetail: (p) => `Total Hours = ${p.paid_build_exec} hrs × Paid Live Months`,
          detailedExplanation:
            "Covers custom audience creation (1/3) and campaign/ad-set structure build (2/3) for each active month of paid amplification.",
          workedExample: (p) => `3 live months → 3 × ${p.paid_build_exec} = ${3 * p.paid_build_exec} hrs.`,
        },
        {
          task: "Static & Dynamic Asset Adaptations",
          role: "Designer",
          params: [
            { ruleId: "paid_adapt_static", label: "Static", unit: "h" },
            { ruleId: "paid_adapt_video", label: "Video", unit: "h" },
          ],
          scalingBadge: "× Paid Assets",
          multiplierSummary: "Per paid static & dynamic asset",
          equationDetail: (p) =>
            `Total Hours = (${p.paid_adapt_static}h × Paid Static Assets) + (${p.paid_adapt_video}h × Paid Video Assets)`,
          detailedExplanation:
            "Calculates Designer time to resize and adapt organic creator assets into paid placement formats (9:16, 4:5, 1:1) with CTAs and safe zones.",
          workedExample: (p) =>
            `8 static + 4 video assets → (8 × ${p.paid_adapt_static}) + (4 × ${p.paid_adapt_video}) = ${
              8 * p.paid_adapt_static + 4 * p.paid_adapt_video
            } hrs.`,
        },
        {
          task: "Ongoing Optimization & Bid Pacing",
          role: "Paid Media Team (Exec, Mgr, Dir)",
          params: [{ ruleId: "paid_opt_base_total", unit: " hrs" }],
          scalingBadge: "× Months, Platforms & Spend",
          multiplierSummary: "Scales by live months, channel count (+8h/ch) & spend tier",
          equationDetail: (p) =>
            `Total Hours = Live Months × (${p.paid_opt_base_total}h Base + 8h × Platforms) × Spend Multiplier`,
          detailedExplanation:
            "Combines monthly base optimization hours across Senior Paid Media Exec (9h), Manager (3h), and Director (1h) plus 8h per active paid platform (5h Exec, 2h Mgr, 1h Dir), multiplied by the Media Spend Tier (1.0x under $100k, 1.25x for $100k–$500k, 1.5x for $500k+).",
          workedExample: (p) =>
            `2 months, 2 platforms, <$100k spend (1.0x) → 2 × (${p.paid_opt_base_total} + 16) × 1.0 = ${
              2 * (p.paid_opt_base_total + 16)
            } hrs.`,
        },
        {
          task: "Weekly Performance Reporting",
          role: "Paid Media Exec, Mgr & Director",
          params: [{ ruleId: "paid_rep_base_total", unit: " hrs" }],
          scalingBadge: "× Months, Platforms & Complexity",
          multiplierSummary: "Scales by live months, channel count (+4.5h/ch) & complexity",
          equationDetail: (p) =>
            `Total Hours = Live Months × (${p.paid_rep_base_total}h Base + 4.5h × Platforms) × Complexity Multiplier`,
          detailedExplanation:
            "Covers paid media reporting across Exec (4h), Director (2h), and Manager (1h) plus 4.5h per active paid channel, scaled by Paid Media Complexity (1.0x Standard, 1.5x Complex).",
          workedExample: (p) =>
            `2 months, 1 platform, Standard (1.0x) → 2 × (${p.paid_rep_base_total} + 4.5) = ${
              2 * (p.paid_rep_base_total + 4.5)
            } hrs.`,
        },
        {
          task: "Paid Media Strategic Consultancy",
          role: "Paid Media Director",
          params: [
            { ruleId: "paid_consult_light", label: "Light", unit: "h" },
            { ruleId: "paid_consult_heavy", label: "Heavy", unit: "h" },
          ],
          scalingBadge: "× Live Months (By Tier)",
          multiplierSummary: "Selected consultancy involvement × live months",
          equationDetail: (p) =>
            `Total Hours = (${p.paid_consult_light}h if Light, ${p.paid_consult_heavy}h if Heavy) × Paid Live Months`,
          detailedExplanation:
            "Applies the selected Consultancy Involvement rate (Light or Heavy) multiplied by the number of Paid Live Months for senior media advisory.",
          workedExample: (p) =>
            `3 live months on Light tier → 3 × ${p.paid_consult_light} = ${3 * p.paid_consult_light} hrs.`,
        },
      ],
    },
    {
      category: "Reporting & Analytics Insights",
      icon: BarChart3,
      phase: "Reporting & Wrap Up",
      tasks: [
        {
          task: "BI Dashboard Setup & Tagging",
          role: "Analytics & Insights Manager",
          params: [
            { ruleId: "rep_dash_setup", label: "Setup", unit: "h" },
            { ruleId: "rep_dash_maint", label: "Maint/Mo", unit: "h" },
          ],
          scalingBadge: "× Dashboards & Months",
          multiplierSummary: "Initial setup per dashboard + monthly maintenance",
          equationDetail: (p) =>
            `Total Hours = Dashboards × (${p.rep_dash_setup}h Setup + (${p.rep_dash_maint}h × Project Months))`,
          detailedExplanation:
            "For each dashboard scoped, allocates initial setup and post-analytics sheet tagging (60% dashboard build / 40% tagging setup) plus recurring monthly maintenance over the campaign duration.",
          workedExample: (p) =>
            `1 dashboard over 3 months → ${p.rep_dash_setup} + (3 × ${p.rep_dash_maint}) = ${
              p.rep_dash_setup + 3 * p.rep_dash_maint
            } hrs.`,
        },
        {
          task: "Ongoing Insights Advisory",
          role: "Analytics & Insights Manager",
          params: [
            { ruleId: "rep_ongoing_light", label: "Light", unit: "h" },
            { ruleId: "rep_ongoing_heavy", label: "Heavy", unit: "h" },
          ],
          scalingBadge: "× Project Months (By Tier)",
          multiplierSummary: "Selected reporting involvement × project months",
          equationDetail: (p) =>
            `Total Hours = (${p.rep_ongoing_light}h Light | ${p.rep_ongoing_heavy}h Heavy | 0h Reporting Only) × Project Months`,
          detailedExplanation:
            "Allocates monthly Analytics & Insights Manager hours when Reporting Involvement is set to Light or Heavy. If set to 'Reporting only', 0 ongoing advisory hours are added.",
          workedExample: (p) =>
            `3 project months on Light tier → 3 × ${p.rep_ongoing_light} = ${3 * p.rep_ongoing_light} hrs.`,
        },
        {
          task: "Snapshot Report (Lite Wrap-Up)",
          role: "Analytics, Account Team & Design",
          params: [{ ruleId: "rep_snapshot_total", unit: " hrs" }],
          scalingBadge: "× Snapshot Reports",
          multiplierSummary: "Per Snapshot Report scoped",
          equationDetail: (p) =>
            `Total Hours = ${p.rep_snapshot_total} hrs × Snapshot Reports (Analytics 55%, AE 22%, AM 9%, Snr Analytics 6%, Design 6%, AD 2%)`,
          detailedExplanation:
            "Multiplies the total Snapshot Report allocation by the number of Snapshot Reports scoped, distributing hours across Analytics & Insights Manager, Account Executive, Account Manager, Account Director, Senior Analytics Manager, and Designer.",
          workedExample: (p) => `1 Snapshot Report → ${p.rep_snapshot_total} hrs across the reporting team.`,
        },
        {
          task: "Standard Campaign Report",
          role: "Analytics, Account, Strategy & Design",
          params: [{ ruleId: "rep_standard_total", unit: " hrs" }],
          scalingBadge: "× Standard Reports",
          multiplierSummary: "Per Standard Report scoped",
          equationDetail: (p) =>
            `Total Hours = ${p.rep_standard_total} hrs × Standard Reports (Analytics 46%, AE 19%, AM 14%, Design 7%, AD 5%, Snr Analytics 5%, Strategy 5%)`,
          detailedExplanation:
            "Full post-campaign wrap-up report including qualitative content tagging and strategic learnings, multiplied by the number of Standard Reports scoped.",
          workedExample: (p) => `1 Standard Report → ${p.rep_standard_total} hrs across the reporting team.`,
        },
        {
          task: "Advanced / Multi-Market Report",
          role: "Snr Analytics, Account, Strategy & Design",
          params: [{ ruleId: "rep_advanced_total", unit: " hrs" }],
          scalingBadge: "× Advanced Reports",
          multiplierSummary: "Per Advanced Report scoped",
          equationDetail: (p) =>
            `Total Hours = ${p.rep_advanced_total} hrs × Advanced Reports (Snr Analytics 39%, AE 17%, AM 16%, AD 16%, Design 6%, Strategy 4%, Head of Analytics 2%)`,
          detailedExplanation:
            "Comprehensive multi-market or executive wrap-up report with senior leadership oversight, multiplied by the number of Advanced Reports scoped.",
          workedExample: (p) => `1 Advanced Report → ${p.rep_advanced_total} hrs across the senior reporting team.`,
        },
      ],
    },
    {
      category: "Account Governance & Project Management",
      icon: ShieldAlert,
      phase: "Overhead & Governance",
      tasks: [
        {
          task: "Weekly Client Status Meetings",
          role: "AE (4h/mo) + AM (2h/mo)",
          params: [{ ruleId: "gov_status_total", unit: " hrs" }],
          scalingBadge: "× Project Months",
          multiplierSummary: "Per campaign month (67% AE / 33% AM)",
          equationDetail: (p) => `Total Hours = ${p.gov_status_total} hrs × Project Duration Months`,
          detailedExplanation:
            "Applied to every project scope across its full duration in months. Two-thirds of the monthly allocation is assigned to Account Executive and one-third to Account Manager for weekly status calls, agendas, and contact reports.",
          workedExample: (p) =>
            `3-month campaign → 3 × ${p.gov_status_total} = ${3 * p.gov_status_total} hrs total.`,
        },
        {
          task: "Commercial & Business Affairs Admin",
          role: "Global Business Affairs Executive",
          params: [{ ruleId: "gov_admin_bae", unit: " hrs" }],
          scalingBadge: "Fixed",
          multiplierSummary: "Baseline project allocation",
          equationDetail: (p) => `Total Hours = ${p.gov_admin_bae} hrs (Flat project baseline)`,
          detailedExplanation:
            "Fixed allocation included on every campaign for ongoing administrative compliance, PO tracking, and ad-hoc Business Affairs support.",
          workedExample: (p) => `Any active project scope → ${p.gov_admin_bae} hrs.`,
        },
        {
          task: "Account Director Supervision",
          role: "Account Director",
          params: [{ ruleId: "gov_mgmt_ad_pct", unit: "%" }],
          scalingBadge: "% of Non-Mgmt Hours",
          multiplierSummary: "Calculated on sum of all delivery hours",
          equationDetail: (p) => `Total Hours = ${p.gov_mgmt_ad_pct}% × Sum(All Non-Management Hours)`,
          detailedExplanation:
            "Calculated last after all other service modules are summed. When Project Management is enabled, allocates Account Director supervision as a percentage of all non-management hours across the entire scope.",
          workedExample: (p) =>
            `If all other project hours = 200h → ${p.gov_mgmt_ad_pct}% × 200h = ${
              Math.round(200 * (p.gov_mgmt_ad_pct / 100) * 10) / 10
            } hrs.`,
        },
        {
          task: "Senior Account Director Governance",
          role: "Senior Account Director",
          params: [{ ruleId: "gov_mgmt_sad_pct", unit: "%" }],
          scalingBadge: "% of Non-Mgmt Hours",
          multiplierSummary: "Calculated on sum of all delivery hours",
          equationDetail: (p) =>
            `Total Hours = ${p.gov_mgmt_sad_pct}% × Sum(All Non-Management Hours) [Split 5/9 & 4/9 tiers]`,
          detailedExplanation:
            "Calculated last on all non-management hours when Project Management is enabled. Provides executive client sponsorship, escalation management, and commercial quality control.",
          workedExample: (p) =>
            `If all other project hours = 200h → ${p.gov_mgmt_sad_pct}% × 200h = ${
              Math.round(200 * (p.gov_mgmt_sad_pct / 100) * 10) / 10
            } hrs.`,
        },
        {
          task: "Dedicated Project Management (SPM)",
          role: "Senior Project Manager",
          params: [
            { ruleId: "gov_pm_light", label: "Light", unit: "h/mo" },
            { ruleId: "gov_pm_oversight", label: "Oversight", unit: "h/mo" },
            { ruleId: "gov_pm_full", label: "Full", unit: "h/mo" },
          ],
          scalingBadge: "× Project Months (By Tier)",
          multiplierSummary: "Selected PM involvement tier × project months",
          equationDetail: (p) =>
            `Total Hours = (${p.gov_pm_light}h Light | ${p.gov_pm_oversight}h Oversight | ${p.gov_pm_full}h Full) × Project Months`,
          detailedExplanation:
            "Multiplies the monthly hours for the chosen Project Management Involvement dropdown ('Set up / Light', 'Set up / Execution Oversight', or 'Full - End to End') by the total campaign duration in months.",
          workedExample: (p) =>
            `3-month project on Oversight tier → 3 × ${p.gov_pm_oversight} = ${3 * p.gov_pm_oversight} hrs.`,
        },
      ],
    },
  ];

  // Filter down to only matching tasks/activities when searchQuery is entered
  const filteredCategories = serviceCategories
    .map((cat) => {
      if (!searchQuery.trim()) return cat;
      const query = searchQuery.toLowerCase().trim();
      const matchingTasks = cat.tasks.filter((t) => {
        const eqStr = t.equationDetail(activePresumptions).toLowerCase();
        return (
          t.task.toLowerCase().includes(query) ||
          t.role.toLowerCase().includes(query) ||
          t.scalingBadge.toLowerCase().includes(query) ||
          t.multiplierSummary.toLowerCase().includes(query) ||
          t.detailedExplanation.toLowerCase().includes(query) ||
          eqStr.includes(query)
        );
      });
      return {
        ...cat,
        tasks: matchingTasks,
      };
    })
    .filter((cat) => cat.tasks.length > 0);

  const modifiedCount = Object.keys(overrides).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Fee Calculator Presumptions & Calculation Rules
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Official mathematical models, algorithmic CPM curves, rate multipliers, and editable service hours logic powering the Fee Calculator.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {modifiedCount > 0 && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs">
                {modifiedCount} Custom {modifiedCount === 1 ? "Override" : "Overrides"}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="gap-1.5 font-semibold text-xs border-gray-300 hover:bg-gray-50"
            >
              <History className="w-3.5 h-3.5 text-primary" />
              Version History
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-primary/10 text-primary">
                  {history.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Creator CPM Curve</span>
            <p className="text-sm font-bold text-gray-800">Logarithmic Scale</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">a + b · ln(Views), Min £12 CPM</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">US Conversion Factor</span>
            <p className="text-sm font-bold text-gray-800">1.35x GBP Baseline</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Native USD benchmark conversion</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Companion Creator Cost</span>
            <p className="text-sm font-bold text-gray-800">3.0% Fixed</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">On Creator Budget + Contingency</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Talent Contingency</span>
            <p className="text-sm font-bold text-gray-800">10% (UK) / 25% (US)</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Default risk allocation buffer</p>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[82vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <History className="w-4 h-4 text-primary" />
                  Fee Calculator Presumptions — Version History
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Audit log of all changes made to allocated service hours and multipliers, including who made each change and when.
                </DialogDescription>
              </div>
              {modifiedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="text-xs h-8 gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All to V6-3 Defaults
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 my-2">
            {history.map((entry) => {
              const formattedDate = new Date(entry.timestamp).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-lg border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={entry.action === "reset" ? "secondary" : "default"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {entry.action === "reset"
                          ? "Reset to Default"
                          : entry.ruleId?.startsWith("view_rate_")
                          ? "View Rate Updated"
                          : "Hours Updated"}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">{entry.task}</span>
                      <span className="text-[11px] text-muted-foreground">({entry.category})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{entry.userName}</span>
                      <span>({entry.userEmail})</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 bg-muted/40 px-3 py-1.5 rounded-md border">
                    <span className="text-xs font-mono line-through text-muted-foreground">
                      {entry.previousValue}{entry.unit}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono font-bold text-primary">
                      {entry.newValue}{entry.unit}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Baseline Entry */}
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] px-1.5 py-0">
                    Baseline Version V6-3
                  </Badge>
                  <span className="text-xs font-bold text-gray-900">
                    Official UK / US Fee Calculator Engine Rules
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  System baseline presumptions initialised across all 8 service categories and creator CPM benchmark models.
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono shrink-0 w-fit bg-white">
                Standard Reference
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Tabs */}
      <Tabs defaultValue="service-hours" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/60 border">
          <TabsTrigger value="service-hours" className="font-semibold text-xs gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Service Hours
          </TabsTrigger>
          <TabsTrigger value="creator-costs" className="font-semibold text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Talent Costs
          </TabsTrigger>
          <TabsTrigger value="territories-boosters" className="font-semibold text-xs gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Territories & Boosters
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Service Hours */}
        <TabsContent value="service-hours" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    How Service Hours are Generated
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Click any value in Allocated Hours to edit it, or select the info icon in Formula/Multiplier for a full breakdown of how each rule works.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search specific task, activity, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-7 h-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No tasks or activities matching "{searchQuery}".
                </div>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <div key={idx} className="border rounded-lg overflow-hidden bg-card shadow-2xs">
                      <div className="bg-muted/30 px-4 py-2.5 border-b flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-sm text-foreground">{cat.category}</h3>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-medium bg-background shrink-0 w-fit">
                          Phase: {cat.phase}
                        </Badge>
                      </div>
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow>
                            <TableHead className="text-xs font-semibold w-[24%]">Task / Activity</TableHead>
                            <TableHead className="text-xs font-semibold w-[22%]">Assigned Role</TableHead>
                            <TableHead className="text-xs font-semibold w-[22%]">Allocated Hours</TableHead>
                            <TableHead className="text-xs font-semibold w-[32%]">Formula/Multiplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cat.tasks.map((task, tIdx) => {
                            const rowKey = `${cat.category}-${task.task}`;
                            const isExpanded = !!expandedInfoRows[rowKey];
                            return (
                              <React.Fragment key={tIdx}>
                                <TableRow className="hover:bg-muted/15 align-middle">
                                  <TableCell className="text-xs font-semibold text-foreground py-2.5">
                                    {task.task}
                                  </TableCell>
                                  <TableCell className="text-xs py-2.5">
                                    <Badge variant="secondary" className="font-medium text-[11px]">
                                      {task.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs py-2.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {task.params.map((param) => {
                                        const currentVal = activePresumptions[param.ruleId];
                                        const defaultVal = DEFAULT_SERVICE_HOUR_PRESUMPTIONS[param.ruleId];
                                        const isModified = currentVal !== defaultVal;
                                        const isEditing = editingRuleId === param.ruleId;

                                        if (isEditing) {
                                          return (
                                            <div
                                              key={param.ruleId}
                                              className="inline-flex items-center gap-1 bg-background border border-primary rounded-md px-1.5 py-0.5 shadow-2xs"
                                            >
                                              {param.label && (
                                                <span className="text-[10px] font-semibold text-muted-foreground">
                                                  {param.label}:
                                                </span>
                                              )}
                                              <input
                                                type="number"
                                                step="0.05"
                                                min="0"
                                                autoFocus
                                                value={editingDraft}
                                                onChange={(e) => setEditingDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    handleCommitEdit(cat.category, task.task, task.role, param, editingDraft);
                                                  } else if (e.key === "Escape") {
                                                    setEditingRuleId(null);
                                                  }
                                                }}
                                                className="w-14 text-xs font-mono font-bold text-primary bg-transparent focus:outline-none"
                                              />
                                              <span className="text-[10px] text-muted-foreground font-mono">
                                                {param.unit.trim()}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleCommitEdit(cat.category, task.task, task.role, param, editingDraft)
                                                }
                                                className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                                title="Save"
                                              >
                                                <Check className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingRuleId(null)}
                                                className="p-0.5 text-muted-foreground hover:bg-muted rounded"
                                                title="Cancel"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={param.ruleId} className="inline-flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingRuleId(param.ruleId);
                                                setEditingDraft(String(currentVal));
                                              }}
                                              className={`group inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-mono font-bold transition-colors ${
                                                isModified
                                                  ? "bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100/80"
                                                  : "bg-muted/40 border-transparent hover:border-gray-300 hover:bg-muted text-primary"
                                              }`}
                                              title="Click to edit allocated hours"
                                            >
                                              {param.label && (
                                                <span className="text-[10px] font-sans font-medium text-muted-foreground">
                                                  {param.label}:
                                                </span>
                                              )}
                                              <span>
                                                {currentVal}
                                                {param.unit}
                                              </span>
                                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity text-muted-foreground ml-0.5" />
                                            </button>
                                            {isModified && (
                                              <button
                                                type="button"
                                                onClick={() => handleResetRule(cat.category, task.task, task.role, param)}
                                                className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded"
                                                title={`Reset to default (${defaultVal}${param.unit})`}
                                              >
                                                <RotateCcw className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs py-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] font-semibold px-1.5 py-0 bg-primary/5 text-primary border-primary/20 shrink-0"
                                        >
                                          {task.scalingBadge}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {task.multiplierSummary}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleInfoRow(rowKey)}
                                        className={`inline-flex items-center gap-0.5 px-1.5 py-1 rounded-md border text-[11px] font-medium transition-colors shrink-0 ${
                                          isExpanded
                                            ? "bg-primary/10 border-primary/30 text-primary"
                                            : "bg-background border-gray-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                        title="View detailed formula logic and how it works"
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                        {isExpanded ? (
                                          <ChevronUp className="w-3 h-3" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow className="bg-primary/[0.03] hover:bg-primary/[0.04]">
                                    <TableCell colSpan={4} className="py-3 px-4">
                                      <div className="rounded-lg border border-primary/15 bg-background p-3.5 space-y-2 text-xs shadow-2xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                          <span className="font-bold text-foreground flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-primary" />
                                            Formula & Calculation Logic: {task.task}
                                          </span>
                                          <code className="bg-muted px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-primary">
                                            {task.equationDetail(activePresumptions)}
                                          </code>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          {task.detailedExplanation}
                                        </p>
                                        <div className="bg-muted/40 rounded px-2.5 py-1.5 border text-[11px] flex flex-wrap items-center gap-1.5">
                                          <span className="font-semibold text-foreground">Example:</span>
                                          <span className="font-mono text-muted-foreground">
                                            {task.workedExample(activePresumptions)}
                                          </span>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Talent Costs */}
        <TabsContent value="creator-costs" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                How Creator Fees are Generated
              </CardTitle>
              <CardDescription className="text-xs">
                Creator pricing uses a logarithmic CPM algorithm derived from historical influencer transactions, format view-rates, and follower tiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formula Callout */}
              <div className="p-5 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Primary Creator Pricing Equations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-lg border shadow-2xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold shrink-0">
                        1
                      </span>
                      <h5 className="text-sm md:text-[15px] font-bold text-gray-900 tracking-tight">
                        Estimated Post Views / Impressions
                      </h5>
                    </div>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-2 rounded">
                      Views = Followers × Format View Rate
                    </code>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      View rates vary by platform (e.g. IG Reels {activePresumptions.view_rate_ig_short_vid}%, IG Static {activePresumptions.view_rate_ig_single_img}%, TikTok {activePresumptions.view_rate_tt_short_vid}%, IG Stories {activePresumptions.view_rate_ig_story}%).
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border shadow-2xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold shrink-0">
                        2
                      </span>
                      <h5 className="text-sm md:text-[15px] font-bold text-gray-900 tracking-tight">
                        Logarithmic Dynamic CPM
                      </h5>
                    </div>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-2 rounded">
                      CPM = Max(a + b · ln(Views), MinCPM)
                    </code>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Coefficients (a, b) define the economies of scale curve; higher impressions yield lower per-view costs down to the floor CPM (c).
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border shadow-2xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold shrink-0">
                        3
                      </span>
                      <h5 className="text-sm md:text-[15px] font-bold text-gray-900 tracking-tight">
                        Base Content Fee Per Post
                      </h5>
                    </div>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-2 rounded">
                      Fee = (Views / 1,000) × CPM × Territory Multiplier
                    </code>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Adjusts baseline rate for creator territory index (e.g. US 1.40x, UK 1.00x, Nordics 2.00x).
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border shadow-2xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold shrink-0">
                        4
                      </span>
                      <h5 className="text-sm md:text-[15px] font-bold text-gray-900 tracking-tight">
                        Total Influencer Fee with Rights
                      </h5>
                    </div>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-2 rounded">
                      Total = Content Fee + Reposting + Boosters + Campaign Multiplier
                    </code>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Includes paid amplify (+usage ramp), brand exclusivity, and content rights extensions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benchmarks Table */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Platform & Deliverable CPM Benchmark Coefficients (UK Baseline)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hover over the logarithmic curve headers for formula definitions, or click any Est. View Rate to edit it.
                    </p>
                  </div>
                </div>
                <TooltipProvider delayDuration={150}>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-xs font-semibold">Platform</TableHead>
                          <TableHead className="text-xs font-semibold">Deliverable Format</TableHead>
                          <TableHead className="text-xs font-semibold text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center gap-1 cursor-help hover:text-primary transition-colors">
                                  Benchmark (a)
                                  <Info className="w-3.5 h-3.5 text-muted-foreground/75" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
                                <p className="font-bold text-foreground mb-1">Intercept Coefficient (a)</p>
                                <p className="text-muted-foreground">
                                  The starting baseline value in the logarithmic curve <code className="font-mono text-primary">CPM = Max(a + b · ln(Views), c)</code> before scaling down for higher impression volumes. For Content House formats, this represents the flat studio unit rate.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center gap-1 cursor-help hover:text-primary transition-colors">
                                  Slope (b)
                                  <Info className="w-3.5 h-3.5 text-muted-foreground/75" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
                                <p className="font-bold text-foreground mb-1">Logarithmic Decay Slope (b)</p>
                                <p className="text-muted-foreground">
                                  Controls how rapidly CPM decreases as estimated post views grow (<code className="font-mono text-primary">b · ln(Views)</code>). Because <code className="font-mono">b</code> is negative, larger creator tiers achieve progressively lower cost-per-thousand impressions (economies of scale).
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center gap-1 cursor-help hover:text-primary transition-colors">
                                  Floor CPM (c)
                                  <Info className="w-3.5 h-3.5 text-muted-foreground/75" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
                                <p className="font-bold text-foreground mb-1">Minimum CPM Floor (c)</p>
                                <p className="text-muted-foreground">
                                  The lower bound in <code className="font-mono text-primary">Max(a + b · ln(Views), c)</code>. Prevents the logarithmic curve from dropping below a minimum commercial threshold (e.g. £12.00 CPM in UK) on Mega/Macro creators with very high view counts.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center">Est. View Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {benchmarksGBP.map((b, i) => {
                          const ruleId = b.viewRateRuleId;
                          const currentVal = ruleId ? activePresumptions[ruleId] : null;
                          const defaultVal = ruleId ? DEFAULT_SERVICE_HOUR_PRESUMPTIONS[ruleId] : null;
                          const isModified = ruleId != null && currentVal !== defaultVal;
                          const isEditing = ruleId != null && editingRuleId === ruleId;
                          const taskLabel = `${b.platform} — ${b.format} (Est. View Rate)`;
                          const paramConfig: EditableParamConfig | null = ruleId
                            ? { ruleId, unit: "%" }
                            : null;

                          return (
                            <TableRow key={i} className="hover:bg-muted/20">
                              <TableCell className="text-xs font-bold text-foreground">{b.platform}</TableCell>
                              <TableCell className="text-xs font-medium">{b.format}</TableCell>
                              <TableCell className="text-xs font-mono text-center font-semibold">{b.a}</TableCell>
                              <TableCell className="text-xs font-mono text-center text-muted-foreground">{b.b}</TableCell>
                              <TableCell className="text-xs font-mono text-center font-bold text-primary">{b.minCPM}</TableCell>
                              <TableCell className="text-xs text-center py-2">
                                {ruleId && paramConfig ? (
                                  isEditing ? (
                                    <div className="inline-flex items-center gap-1 bg-background border border-primary rounded-md px-1.5 py-0.5 shadow-2xs">
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        autoFocus
                                        value={editingDraft}
                                        onChange={(e) => setEditingDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleCommitEdit(
                                              "Talent Costs — CPM Benchmarks",
                                              taskLabel,
                                              b.platform,
                                              paramConfig,
                                              editingDraft
                                            );
                                          } else if (e.key === "Escape") {
                                            setEditingRuleId(null);
                                          }
                                        }}
                                        className="w-14 text-xs font-mono font-bold text-primary bg-transparent focus:outline-none text-center"
                                      />
                                      <span className="text-[10px] text-muted-foreground font-mono">%</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCommitEdit(
                                            "Talent Costs — CPM Benchmarks",
                                            taskLabel,
                                            b.platform,
                                            paramConfig,
                                            editingDraft
                                          )
                                        }
                                        className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                        title="Save"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingRuleId(null)}
                                        className="p-0.5 text-muted-foreground hover:bg-muted rounded"
                                        title="Cancel"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingRuleId(ruleId);
                                          setEditingDraft(String(currentVal));
                                        }}
                                        className={`group inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-mono font-bold transition-colors ${
                                          isModified
                                            ? "bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100/80"
                                            : "bg-emerald-50/60 border-transparent hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                                        }`}
                                        title="Click to edit estimated view rate"
                                      >
                                        <span>{currentVal}%</span>
                                        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity text-muted-foreground ml-0.5" />
                                      </button>
                                      {isModified && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleResetRule(
                                              "Talent Costs — CPM Benchmarks",
                                              taskLabel,
                                              b.platform,
                                              paramConfig
                                            )
                                          }
                                          className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded"
                                          title={`Reset to default (${defaultVal}%)`}
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <Badge variant="secondary" className="font-mono text-[11px] font-medium">
                                    {b.staticViewRate}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TooltipProvider>
                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  * Note: US office currency benchmarks apply a native 1.35x currency conversion factor on coefficients (a, b, c).
                </p>
              </div>

              {/* Pass-Through & Surcharges */}
              <div className="border rounded-lg p-4 bg-muted/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">Pass-Through Buffers & Risk Surcharges</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-md bg-white border">
                    <span className="font-bold text-stone-900 block mb-1">Companion Creator Costs</span>
                    <p className="text-lg font-black text-primary font-mono">3.0%</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Applied to total creator cost + contingency to cover gifting samples, briefing packs, and creator care.
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-white border">
                    <span className="font-bold text-stone-900 block mb-1">Talent Contingency</span>
                    <p className="text-lg font-black text-primary font-mono">10% UK / 25% US</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Covers negotiation variances, late talent replacements, and agent fee differentials.
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-white border">
                    <span className="font-bold text-stone-900 block mb-1">FX Premium</span>
                    <p className="text-lg font-black text-primary font-mono">Variable %</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Protective premium when client currency differs from talent disbursement currency.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Territories & Boosters */}
        <TabsContent value="territories-boosters" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Territory Multipliers */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Territory Pricing Multipliers
                </CardTitle>
                <CardDescription className="text-xs">
                  Regional pricing index applied to creator base fees according to creator audience and residency.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Territory / Market</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Multiplier</TableHead>
                      <TableHead className="text-xs font-semibold">Economic Index Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {territoryMultipliers.map((tm, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-semibold text-foreground py-2.5">
                          <span className="mr-1.5">{tm.flag}</span>
                          {tm.country}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-center text-primary py-2.5">
                          {tm.multiplier}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5">
                          {tm.desc}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Booster & Rights Equations */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Usage Rights & Campaign Multipliers
                </CardTitle>
                <CardDescription className="text-xs">
                  Uplifts applied to base creator fees for extended organic, paid amplify, exclusivity, and campaign complexities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Organic Usage Booster</span>
                    <Badge variant="outline" className="text-[10px] font-mono">Capped at 1.2% × weeks</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Weeks ≤ 52: <code className="font-mono text-primary font-bold">0.5% × weeks</code>. Weeks &gt; 52: Linear ramp from 0.5% to 1.0% over next 52 weeks.
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Paid Media Amplify Booster</span>
                    <Badge variant="outline" className="text-[10px] font-mono">Capped at 6.0% × weeks</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Weeks ≤ 12: <code className="font-mono text-primary font-bold">3.5% × weeks</code>. Weeks &gt; 12: Linear ramp from 3.5% to 5.0% over next 40 weeks.
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Brand Exclusivity Booster</span>
                    <Badge variant="outline" className="text-[10px] font-mono">Capped at 10.0% × weeks</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Weeks ≤ 8: <code className="font-mono text-primary font-bold">5.0% × weeks</code>. Weeks &gt; 8: Linear ramp from 5.0% to 8.0% over next 44 weeks.
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Brand Reposting Uplift</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">+40% Content Fee</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Grants brand permission to cross-post and repost creator assets on brand owned-and-operated channels.
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Campaign Complexity Multipliers (De-duplication)</span>
                    <Badge variant="outline" className="text-[10px] font-mono">Diminishing returns</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Time Pressure (+20%), Seasonal (+20%), Restricted Goods (+20%), Popular (+40%), Niche (+30%).
                  </p>
                  <code className="block bg-background p-1.5 rounded border text-[11px] font-mono text-primary mt-1">
                    Adjusted Multiplier = Raw / (1 + (Count - 1) × 0.20)
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
