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
  formulaTemplate: (p: ServiceHourPresumptions) => string;
  logicDescription: string;
}

interface ServiceCategoryConfig {
  category: string;
  icon: React.ElementType;
  phase: string;
  description: string;
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
    const resetEntries: PresumptionHistoryEntry[] = modifiedKeys.map((ruleId) => ({
      id: `${Date.now()}-${ruleId}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      userName: currentUserName,
      userEmail: currentUserEmail,
      category: "All Categories",
      task: `Reset ${ruleId} to V6-3 Default`,
      role: "System Default",
      ruleId,
      previousValue: activePresumptions[ruleId],
      newValue: DEFAULT_SERVICE_HOUR_PRESUMPTIONS[ruleId],
      unit: " hrs",
      action: "reset",
    }));

    const nextHistory = [...resetEntries, ...history];
    setOverrides({});
    setHistory(nextHistory);

    try {
      await savePresumptionChange({}, nextHistory);
      toast.success("All allocated hours reset to official V6-3 defaults.");
    } catch {
      toast.error("Reset locally, but failed to sync to cloud database.");
    }
  };

  const benchmarksGBP = [
    { platform: "Instagram", format: "Single Image", a: 115, b: -8.39, minCPM: "£12.00", viewRate: "25%", notes: "Static grid post" },
    { platform: "Instagram", format: "Multi Image (Carousel)", a: 171, b: -12.50, minCPM: "£12.00", viewRate: "25%", notes: "2+ slides carousel" },
    { platform: "Instagram", format: "Short Video (Reels)", a: 175, b: -12.50, minCPM: "£12.00", viewRate: "34%", notes: "Vertical Reel < 90s" },
    { platform: "Instagram", format: "Story Frames", a: 151, b: -12.50, minCPM: "£12.00", viewRate: "5%", notes: "Ephemeral story set" },
    { platform: "TikTok", format: "Short Video", a: 259, b: -18.70, minCPM: "£12.00", viewRate: "15%", notes: "Native vertical video" },
    { platform: "YouTube", format: "Short Video (Shorts)", a: 277, b: -20.70, minCPM: "£12.00", viewRate: "15%", notes: "YouTube Shorts < 60s" },
    { platform: "YouTube", format: "Long Video (Dedicated/Integr.)", a: 277, b: -20.70, minCPM: "£12.00", viewRate: "15%", notes: "Standard 8-15 min video" },
    { platform: "YouTube", format: "Story Frames (Community)", a: 151, b: -12.50, minCPM: "£12.00", viewRate: "5%", notes: "Community post / story" },
    { platform: "Content House", format: "Single Image", a: 200, b: 0, minCPM: "£200 flat", viewRate: "Flat fee", notes: "Studio production unit" },
    { platform: "Content House", format: "Short Video", a: 1500, b: 0, minCPM: "£1,500 flat", viewRate: "Flat fee", notes: "Studio production unit" },
    { platform: "Content House", format: "Long Video", a: 2500, b: 0, minCPM: "£2,500 flat", viewRate: "Flat fee", notes: "Studio production unit" },
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
      description: "Baseline kickoff, commercial terms, and governance allocations applied to every project scope during Return To Brief (RTB).",
      tasks: [
        {
          task: "Kickoff & Strategic Planning",
          role: "Account Director",
          params: [{ ruleId: "setup_ad_planning", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_ad_planning} hrs × 1 Project`,
          logicDescription: "Applied once to every campaign for client kickoff and strategic alignment.",
        },
        {
          task: "Execution Setup & Account Planning",
          role: "Account Manager",
          params: [{ ruleId: "setup_am_planning", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_am_planning} hrs × 1 Project`,
          logicDescription: "Applied once to every campaign for operational onboarding and project setup.",
        },
        {
          task: "Creative Strategy Oversight",
          role: "Creative Director",
          params: [{ ruleId: "setup_cd_planning", unit: " hrs" }],
          scalingBadge: "Conditional Fixed",
          formulaTemplate: (p) => `${p.setup_cd_planning} hrs × (1 if Creative Active, else 0)`,
          logicDescription: "Included only when the Creative & Strategy service module is enabled on the scope.",
        },
        {
          task: "Content Strategy Framing",
          role: "Content Strategy Director",
          params: [{ ruleId: "setup_csd_planning", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_csd_planning} hrs × 1 Project`,
          logicDescription: "Applied once per project to establish the initial content strategy framework.",
        },
        {
          task: "Financial Scope & Budgeting",
          role: "Project Manager",
          params: [{ ruleId: "setup_pm_budgeting", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_pm_budgeting} hrs × 1 Project`,
          logicDescription: "Applied once per project for commercial scope modelling and resource planning.",
        },
        {
          task: "Executive Review",
          role: "Senior Account Director",
          params: [{ ruleId: "setup_sad_review", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_sad_review} hr × 1 Project`,
          logicDescription: "Applied once per project for senior executive sign-off on Return To Brief.",
        },
        {
          task: "Client Term Sheet Preparation",
          role: "Global Senior Business Affairs Manager",
          params: [{ ruleId: "setup_sba_terms", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_sba_terms} hr × 1 Project`,
          logicDescription: "Applied once per project for legal and commercial term sheet preparation.",
        },
        {
          task: "Client Deal Governance",
          role: "Global Director of Business Affairs",
          params: [{ ruleId: "setup_dba_review", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.setup_dba_review} hrs × 1 Project`,
          logicDescription: "Applied once per project for master client contract review and risk governance.",
        },
      ],
    },
    {
      category: "Creative & Strategy Development",
      icon: Sparkles,
      phase: "RTB",
      description: "Generates creative concepting, route design, pitch decks, and feasibility hours dynamically scaled by Return To Brief (RTB) rounds.",
      tasks: [
        {
          task: "Strategy Development",
          role: "Senior Content Strategist",
          params: [{ ruleId: "creative_strat_dev", unit: " hrs" }],
          scalingBadge: "Fixed When Active",
          formulaTemplate: (p) => `${p.creative_strat_dev} hrs × 1 Creative Campaign`,
          logicDescription: "Base strategic research and platform narrative when Creative & Strategy is enabled.",
        },
        {
          task: "Creative Ideation & Execution",
          role: "Creative",
          params: [
            { ruleId: "creative_ideation_base", label: "Base", unit: "h" },
            { ruleId: "creative_ideation_per_job", label: "Per Job", unit: "h" },
          ],
          scalingBadge: "Scales by Creative Jobs",
          formulaTemplate: (p) => `${p.creative_ideation_base} hrs + (${p.creative_ideation_per_job} hrs × Creative Jobs)`,
          logicDescription: "Base ideation hours plus per-job execution (where Creative Jobs = Total RTB Creative Days ÷ 4).",
        },
        {
          task: "Visual Route & Art Direction",
          role: "Senior Designer",
          params: [{ ruleId: "creative_designer_per_job", label: "Per Job", unit: " hrs" }],
          scalingBadge: "Scales by Creative Jobs",
          formulaTemplate: (p) => `${p.creative_designer_per_job} hrs × Creative Jobs`,
          logicDescription: "Multiplies allocated hours by the number of Creative Jobs generated from concepts and ideas.",
        },
        {
          task: "Deck Presentation Strategy",
          role: "Senior Content Strategist",
          params: [{ ruleId: "creative_pres_strat", unit: " hrs" }],
          scalingBadge: "Capped Allocation",
          formulaTemplate: (p) => `${p.creative_pres_strat} hrs (Default: Min(Strategy Hrs ÷ 4, 4h))`,
          logicDescription: "Allocated to building the strategic narrative section of the Return To Brief presentation deck.",
        },
        {
          task: "Deck Presentation Creative",
          role: "Senior Creative",
          params: [{ ruleId: "creative_pres_creative_cap", label: "Cap", unit: " hrs" }],
          scalingBadge: "25% Up to Cap",
          formulaTemplate: (p) => `Min(25% × Creative Ideation Hrs, ${p.creative_pres_creative_cap} hrs max)`,
          logicDescription: "Calculates 25% of Creative Ideation hours for copywriting the deck, capped at the allocated maximum.",
        },
        {
          task: "Deck Presentation Design",
          role: "Senior Designer",
          params: [{ ruleId: "creative_pres_design_pct", unit: "%" }],
          scalingBadge: "% of Creative & Deck Hrs",
          formulaTemplate: (p) => `${p.creative_pres_design_pct}% × (Creative Ideation + Strategy Deck + Creative Deck Hrs)`,
          logicDescription: "Calculates visual deck layout time as a percentage of combined creative and deck writing hours.",
        },
        {
          task: "Production Feasibility & Costs",
          role: "Senior Producer",
          params: [{ ruleId: "creative_producer_pct", unit: "%" }],
          scalingBadge: "% of Design & Strategy",
          formulaTemplate: (p) => `${p.creative_producer_pct}% × (Visual Route Design Hrs + Strategy Dev Hrs)`,
          logicDescription: "Allocates producer time for scoping shoot feasibility and budgets as a percentage of design and strategy hours.",
        },
        {
          task: "Creative Direction Oversight",
          role: "Creative Director",
          params: [{ ruleId: "creative_cd_pct", unit: "%" }],
          scalingBadge: "% of Creative Execution",
          formulaTemplate: (p) => `${p.creative_cd_pct}% × (Creative Ideation + Visual Route + Deck Hrs)`,
          logicDescription: "Senior creative leadership review scaled as a percentage of total creative and design hours.",
        },
        {
          task: "Strategy Direction Oversight",
          role: "Content Strategy Director",
          params: [{ ruleId: "creative_csd_pct", unit: "%" }],
          scalingBadge: "% of Strategy Hrs",
          formulaTemplate: (p) => `${p.creative_csd_pct}% × (Strategy Dev Hrs + Strategy Deck Hrs)`,
          logicDescription: "Executive strategy sign-off scaled as a percentage of total strategy development and presentation hours.",
        },
      ],
    },
    {
      category: "Talent Brief & Creator Contracting",
      icon: Users,
      phase: "Creators & Contracting",
      description: "Calculates casting, longlist curation, creator fee negotiations, and Business Affairs contract drafting scaled by creator count.",
      tasks: [
        {
          task: "Influencer Brief Draft",
          role: "Account Manager",
          params: [{ ruleId: "talent_brief_am", unit: " hrs" }],
          scalingBadge: "Fixed per Campaign",
          formulaTemplate: (p) => `${p.talent_brief_am} hrs × 1 Active Talent Scope`,
          logicDescription: "Fixed allocation for drafting the master creator brief when Talent is enabled.",
        },
        {
          task: "Influencer Brief Creative Input",
          role: "Senior Creative",
          params: [{ ruleId: "talent_brief_sc", unit: " hrs" }],
          scalingBadge: "Fixed per Campaign",
          formulaTemplate: (p) => `${p.talent_brief_sc} hrs × 1 Active Talent Scope`,
          logicDescription: "Fixed creative oversight to align the creator brief with the approved campaign territories.",
        },
        {
          task: "Influencer Brief Revisions",
          role: "Account Manager / Senior Creative",
          params: [
            { ruleId: "talent_brief_rev_am", label: "AM", unit: "h" },
            { ruleId: "talent_brief_rev_sc", label: "SC", unit: "h" },
          ],
          scalingBadge: "Per Revision Round",
          formulaTemplate: (p) => `(${p.talent_brief_rev_am}h AM + ${p.talent_brief_rev_sc}h SC) × Brief Revisions`,
          logicDescription: "Multiplies allocated hours by the number of client brief revision rounds selected in the scope.",
        },
        {
          task: "Creator Search & Longlist",
          role: "Account Executive",
          params: [{ ruleId: "talent_search_ae", unit: " hrs" }],
          scalingBadge: "Per Creator",
          formulaTemplate: (p) => `${p.talent_search_ae} hrs × Total Creators`,
          logicDescription: "Discovery, audience vetting, and longlist compilation per contracted creator.",
        },
        {
          task: "Creator Search Oversight",
          role: "Account Manager",
          params: [{ ruleId: "talent_search_am", unit: " hrs" }],
          scalingBadge: "Per Creator",
          formulaTemplate: (p) => `${p.talent_search_am} hr × Total Creators`,
          logicDescription: "Account Manager quality check, brand-safety audit, and shortlist selection per creator.",
        },
        {
          task: "Longlist Client Revisions",
          role: "AE & AM",
          params: [{ ruleId: "talent_longlist_rev_pct", unit: "%" }],
          scalingBadge: "% per Revision Round",
          formulaTemplate: (p) => `${p.talent_longlist_rev_pct}% × Initial Search Hrs × Longlist Revisions`,
          logicDescription: "Each client longlist feedback round adds this percentage of the initial AE and AM search hours.",
        },
        {
          task: "Outreach & Fee Negotiations",
          role: "AE & AM",
          params: [
            { ruleId: "talent_engage_ae", label: "AE", unit: "h" },
            { ruleId: "talent_negotiate_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "Per Creator",
          formulaTemplate: (p) => `(${p.talent_engage_ae}h AE + ${p.talent_negotiate_am}h AM) × Total Creators`,
          logicDescription: "Agent outreach, availability checks, and commercial fee negotiation per contracted creator.",
        },
        {
          task: "Contract Drafting & Execution",
          role: "Account Manager",
          params: [{ ruleId: "talent_contract_am", unit: " hrs" }],
          scalingBadge: "Per Creator",
          formulaTemplate: (p) => `${p.talent_contract_am} hr × Total Creators`,
          logicDescription: "Statement of work alignment, deliverable scheduling, and commercial checks per creator.",
        },
        {
          task: "Master Term Sheet Negotiation",
          role: "Global Senior Business Affairs Manager",
          params: [{ ruleId: "talent_terms_sba", unit: " hrs" }],
          scalingBadge: "Fixed per Campaign",
          formulaTemplate: (p) => `${p.talent_terms_sba} hrs × 1 Active Talent Scope`,
          logicDescription: "Legal template customisation, usage rights clauses, and exclusivity terms per talent campaign.",
        },
        {
          task: "Deal Risk Review",
          role: "Global Director of Business Affairs",
          params: [{ ruleId: "talent_terms_dba", unit: " hrs" }],
          scalingBadge: "Fixed per Campaign",
          formulaTemplate: (p) => `${p.talent_terms_dba} hr × 1 Active Talent Scope`,
          logicDescription: "Senior legal risk assessment across the campaign's creator contracting framework.",
        },
        {
          task: "Contract Execution & Compliance",
          role: "Global Business Affairs Executive",
          params: [{ ruleId: "talent_contract_bae", unit: " hrs" }],
          scalingBadge: "Per Creator",
          formulaTemplate: (p) => `${p.talent_contract_bae} hrs × Total Creators`,
          logicDescription: "Individual talent contract redlining, legal review, and countersignature tracking per creator.",
        },
      ],
    },
    {
      category: "Live Campaign Management",
      icon: Video,
      phase: "Content Creation & Go Live",
      description: "Operational management for creator briefing, product deliveries, draft review stages, and go-live coordination.",
      tasks: [
        {
          task: "Instagram Briefing",
          role: "AE & AM",
          params: [
            { ruleId: "camp_ig_brief_ae", label: "AE", unit: "h" },
            { ruleId: "camp_ig_brief_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "Per IG Creator",
          formulaTemplate: (p) => `(${p.camp_ig_brief_ae}h AE + ${p.camp_ig_brief_am}h AM) × Instagram Creators`,
          logicDescription: "Onboarding call, creative walkthrough, and deliverable schedule alignment per Instagram creator.",
        },
        {
          task: "Instagram Image/Story Management",
          role: "AE & AM",
          params: [
            { ruleId: "camp_ig_img_ae", label: "AE", unit: "h" },
            { ruleId: "camp_ig_img_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "Per IG Static/Story Asset",
          formulaTemplate: (p) => `(${p.camp_ig_img_ae}h AE + ${p.camp_ig_img_am}h AM) × (IG Images + IG Stories)`,
          logicDescription: "Concept check, draft feedback, caption compliance, and live link verification per static/story deliverable.",
        },
        {
          task: "Instagram Video / Reel Management",
          role: "AE & AM",
          params: [
            { ruleId: "camp_ig_vid_ae", label: "AE", unit: "h" },
            { ruleId: "camp_ig_vid_am", label: "AM", unit: "h" },
          ],
          scalingBadge: "Per IG Reel Asset",
          formulaTemplate: (p) => `(${p.camp_ig_vid_ae}h AE + ${p.camp_ig_vid_am}h AM) × Instagram Reels`,
          logicDescription: "Storyboard review, rough-cut feedback, audio check, and publication approval per Instagram Reel.",
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
          scalingBadge: "Per TikTok Creator & Video",
          formulaTemplate: (p) => `(${p.camp_tt_brief_ae + p.camp_tt_brief_am}h × TT Creators) + (${p.camp_tt_vid_ae + p.camp_tt_vid_am}h × TT Videos)`,
          logicDescription: "Combines per-creator briefing hours with per-video production management across TikTok deliverables.",
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
          scalingBadge: "Per YouTube Creator & Video",
          formulaTemplate: (p) => `(${p.camp_yt_brief_ae + p.camp_yt_brief_am}h × YT Creators) + (${p.camp_yt_vid_ae + p.camp_yt_vid_am}h × YT Videos)`,
          logicDescription: "Combines per-creator briefing hours with talking-point and video integration reviews across YouTube deliverables.",
        },
        {
          task: "Creative Content Reviews",
          role: "Creative",
          params: [{ ruleId: "camp_creative_review", unit: " hrs" }],
          scalingBadge: "Per Deliverable",
          formulaTemplate: (p) => `${p.camp_creative_review} hrs × Total Deliverables`,
          logicDescription: "Creative quality-assurance check on every submitted creator draft across Instagram, TikTok, YouTube, and Gifting.",
        },
        {
          task: "Gifting Creator Briefing & Logistics",
          role: "AE & AM",
          params: [
            { ruleId: "camp_gift_brief_total", label: "Brief", unit: "h" },
            { ruleId: "camp_gift_mgmt_total", label: "Mgmt", unit: "h" },
          ],
          scalingBadge: "Per Gifting Creator",
          formulaTemplate: (p) => `(${p.camp_gift_brief_total}h Brief + ${p.camp_gift_mgmt_total}h Mgmt) × Gifting Creators`,
          logicDescription: "Streamlined outreach, address collection, and organic post tracking split equally between AE and AM.",
        },
        {
          task: "Product Procurement Shipments",
          role: "AE & AM",
          params: [{ ruleId: "camp_proc_total", unit: " hrs" }],
          scalingBadge: "Per Shipment",
          formulaTemplate: (p) => `${p.camp_proc_total} hrs × Total Shipments (Split 50/50 AE & AM)`,
          logicDescription: "Courier coordination, customs documentation, and delivery tracking per product shipment.",
        },
      ],
    },
    {
      category: "Specialist Production Services",
      icon: Layers,
      phase: "Content Creation & Go Live",
      description: "Calculations for bespoke production tracks including Content House shoots, AR Filters, Gifting Boxes, and Events.",
      tasks: [
        {
          task: "Content House Shoot Units",
          role: "AE, AM, Designer, Creative",
          params: [{ ruleId: "prod_ch_total", unit: " hrs" }],
          scalingBadge: "Per Content House Asset",
          formulaTemplate: (p) => `${p.prod_ch_total} hrs × Content House Assets`,
          logicDescription: "Distributed across AE (2.75h), AM (2h), Designer (1h), and Creative (0.5h) per studio asset.",
        },
        {
          task: "AR Filters Development",
          role: "Designer & Senior Creative",
          params: [
            { ruleId: "prod_ar_design", label: "Design", unit: "h" },
            { ruleId: "prod_ar_creative", label: "Creative", unit: "h" },
          ],
          scalingBadge: "Per AR Filter",
          formulaTemplate: (p) => `(${p.prod_ar_design}h Designer + ${p.prod_ar_creative}h Snr Creative) × AR Filters`,
          logicDescription: "3D asset modelling, interactive logic, and platform submission per AR effect.",
        },
        {
          task: "AR Filter Influencer Promotion",
          role: "Account Manager",
          params: [{ ruleId: "prod_ar_am", unit: " hrs" }],
          scalingBadge: "Per AR Filter",
          formulaTemplate: (p) => `${p.prod_ar_am} hrs × AR Filters`,
          logicDescription: "Covers creator seeding search (3h), outreach (2h), and contracting (4h) per filter launch.",
        },
        {
          task: "Custom GIFs / Stickers",
          role: "Designer",
          params: [{ ruleId: "prod_gifs_design", unit: " hrs" }],
          scalingBadge: "Per GIF / Sticker",
          formulaTemplate: (p) => `${p.prod_gifs_design} hrs × GIF Count`,
          logicDescription: "Illustration, frame-by-frame animation, and GIPHY brand channel upload per sticker.",
        },
        {
          task: "Gifting Box Concept & Design",
          role: "Designer & Senior Designer",
          params: [{ ruleId: "prod_gift_concept_total", unit: " hrs" }],
          scalingBadge: "Per Box Design",
          formulaTemplate: (p) => `${p.prod_gift_concept_total} hrs × Gifting Designs (83% Design / 17% Snr Design)`,
          logicDescription: "Initial packaging concepts, structural mockups, and visual direction per unique box design.",
        },
        {
          task: "Gifting Box Route & Production",
          role: "Designer & Senior Designer",
          params: [{ ruleId: "prod_gift_route_prod_total", unit: " hrs" }],
          scalingBadge: "Per Box Design",
          formulaTemplate: (p) => `${p.prod_gift_route_prod_total} hrs × Gifting Designs (Route Dev + Print Production)`,
          logicDescription: "Print-ready artwork, die-line engineering, and proofing per unique gifting box design.",
        },
        {
          task: "Gifting Box Sourcing & Suppliers",
          role: "Producer",
          params: [{ ruleId: "prod_gift_producer", unit: " hrs" }],
          scalingBadge: "Per Box Design",
          formulaTemplate: (p) => `${p.prod_gift_producer} hrs × Gifting Designs`,
          logicDescription: "Vendor quotes, manufacturing management (16h), and bespoke item sourcing (12h) per design.",
        },
        {
          task: "Gifting Box Packing & Dispatch",
          role: "Account Executive",
          params: [{ ruleId: "prod_gift_pack_ae", unit: " hrs" }],
          scalingBadge: "Per Mailed Box",
          formulaTemplate: (p) => `${p.prod_gift_pack_ae} hrs × Gifting Boxes Shipped`,
          logicDescription: "Fulfilment coordination, personalised note insertion, and dispatch per physical box.",
        },
        {
          task: "Brand Events Management",
          role: "Snr Creative & Account Manager",
          params: [
            { ruleId: "prod_event_creative", label: "Creative", unit: "h" },
            { ruleId: "prod_event_am", label: "AM/Event", unit: "h" },
          ],
          scalingBadge: "Fixed Concept + Per Event",
          formulaTemplate: (p) => `${p.prod_event_creative}h Concept + (${p.prod_event_am}h AM × Event Count)`,
          logicDescription: "Fixed creative concepting plus per-event vendor bookings (12h) and on-site management (6h).",
        },
      ],
    },
    {
      category: "Paid Media Strategy & Management",
      icon: TrendingUp,
      phase: "Content Creation & Go Live",
      description: "Calculations for paid social amplify, whitelisting/spark ads, asset adaptations, and media campaign pacing.",
      tasks: [
        {
          task: "Paid Social Strategy & Creative",
          role: "Paid Media Director",
          params: [{ ruleId: "paid_strat_dir", unit: " hrs" }],
          scalingBadge: "Per Live Month",
          formulaTemplate: (p) => `${p.paid_strat_dir} hrs × Paid Live Months`,
          logicDescription: "Combines monthly creative review (1h) and strategic media planning (6h) for each active month.",
        },
        {
          task: "Ad Account Setup & Governance",
          role: "Paid Media Manager",
          params: [{ ruleId: "paid_setup_mgr", unit: " hrs" }],
          scalingBadge: "Per Live Month",
          formulaTemplate: (p) => `${p.paid_setup_mgr} hr × Paid Live Months`,
          logicDescription: "Pixel verification, ad account hygiene, and billing governance per active paid month.",
        },
        {
          task: "Creator Access / Whitelisting Setup",
          role: "Senior Paid Media Executive",
          params: [{ ruleId: "paid_whitelisting_exec", unit: " hrs" }],
          scalingBadge: "Per Creator",
          formulaTemplate: (p) => `${p.paid_whitelisting_exec} hrs × Total Creators`,
          logicDescription: "Spark Ad codes, Meta partnership permissions, and creator handle connections per creator.",
        },
        {
          task: "Audience & Campaign Architecture",
          role: "Senior Paid Media Executive",
          params: [{ ruleId: "paid_build_exec", unit: " hrs" }],
          scalingBadge: "Per Live Month",
          formulaTemplate: (p) => `${p.paid_build_exec} hrs × Paid Live Months`,
          logicDescription: "Custom audience building (1.5h) and initial campaign/ad-set structuring (3.0h) per live month.",
        },
        {
          task: "Static & Dynamic Asset Adaptations",
          role: "Designer",
          params: [
            { ruleId: "paid_adapt_static", label: "Static", unit: "h" },
            { ruleId: "paid_adapt_video", label: "Video", unit: "h" },
          ],
          scalingBadge: "Per Paid Asset",
          formulaTemplate: (p) => `(${p.paid_adapt_static}h × Paid Static) + (${p.paid_adapt_video}h × Paid Video)`,
          logicDescription: "Aspect-ratio resizing (9:16, 4:5, 1:1), end-cards, and safe-zone adjustments per paid asset.",
        },
        {
          task: "Ongoing Optimization & Bid Pacing",
          role: "Paid Media Team (Exec, Mgr, Dir)",
          params: [{ ruleId: "paid_opt_base_total", unit: " hrs" }],
          scalingBadge: "Months × Platforms × Spend",
          formulaTemplate: (p) => `Live Months × (${p.paid_opt_base_total}h Base + 8h × Platforms) × Spend Multiplier`,
          logicDescription: "Scales by active paid channels and media spend tier (1.0x <$100k, 1.25x $100k–$500k, 1.5x >$500k).",
        },
        {
          task: "Weekly Performance Reporting",
          role: "Paid Media Exec, Mgr & Director",
          params: [{ ruleId: "paid_rep_base_total", unit: " hrs" }],
          scalingBadge: "Months × Platforms × Complexity",
          formulaTemplate: (p) => `Live Months × (${p.paid_rep_base_total}h Base + 4.5h × Platforms) × Complexity`,
          logicDescription: "Monthly paid reporting hours scaled by active channels and campaign complexity (1.0x Standard, 1.5x Complex).",
        },
        {
          task: "Paid Media Strategic Consultancy",
          role: "Paid Media Director",
          params: [
            { ruleId: "paid_consult_light", label: "Light", unit: "h" },
            { ruleId: "paid_consult_heavy", label: "Heavy", unit: "h" },
          ],
          scalingBadge: "Per Live Month by Tier",
          formulaTemplate: (p) => `(${p.paid_consult_light}h Light or ${p.paid_consult_heavy}h Heavy) × Paid Live Months`,
          logicDescription: "Executive media advisory scaled by the selected Consultancy Involvement level.",
        },
      ],
    },
    {
      category: "Reporting & Analytics Insights",
      icon: BarChart3,
      phase: "Reporting & Wrap Up",
      description: "Generates data collection, deduplication, dashboard setups, and comprehensive executive reports.",
      tasks: [
        {
          task: "BI Dashboard Setup & Tagging",
          role: "Analytics & Insights Manager",
          params: [
            { ruleId: "rep_dash_setup", label: "Setup", unit: "h" },
            { ruleId: "rep_dash_maint", label: "Maint/Mo", unit: "h" },
          ],
          scalingBadge: "Per Dashboard + Monthly",
          formulaTemplate: (p) => `(${p.rep_dash_setup}h Setup + ${p.rep_dash_maint}h × Project Months) × Dashboards`,
          logicDescription: "Covers initial dashboard build & tagging setup plus recurring monthly data maintenance per dashboard.",
        },
        {
          task: "Ongoing Insights Advisory",
          role: "Analytics & Insights Manager",
          params: [
            { ruleId: "rep_ongoing_light", label: "Light", unit: "h" },
            { ruleId: "rep_ongoing_heavy", label: "Heavy", unit: "h" },
          ],
          scalingBadge: "Per Project Month",
          formulaTemplate: (p) => `(${p.rep_ongoing_light}h Light or ${p.rep_ongoing_heavy}h Heavy) × Project Months`,
          logicDescription: "Recurring mid-flight performance analysis when Reporting Involvement is set to Light or Heavy.",
        },
        {
          task: "Snapshot Report (Lite Wrap-Up)",
          role: "Analytics, Account Team & Design",
          params: [{ ruleId: "rep_snapshot_total", unit: " hrs" }],
          scalingBadge: "Per Snapshot Report",
          formulaTemplate: (p) => `${p.rep_snapshot_total} hrs × Snapshot Reports`,
          logicDescription: "Fast quantitative wrap-up distributed across Analytics (18h), AE (7h), AM (3h), AD (0.5h), Snr Analytics (2h), and Design (2h).",
        },
        {
          task: "Standard Campaign Report",
          role: "Analytics, Account, Strategy & Design",
          params: [{ ruleId: "rep_standard_total", unit: " hrs" }],
          scalingBadge: "Per Standard Report",
          formulaTemplate: (p) => `${p.rep_standard_total} hrs × Standard Reports`,
          logicDescription: "Full post-campaign analysis across Analytics (27h), AE (11h), AM (8h), AD (3h), Snr Analytics (3h), Strategy (3h), and Design (4h).",
        },
        {
          task: "Advanced / Multi-Market Report",
          role: "Snr Analytics, Account, Strategy & Design",
          params: [{ ruleId: "rep_advanced_total", unit: " hrs" }],
          scalingBadge: "Per Advanced Report",
          formulaTemplate: (p) => `${p.rep_advanced_total} hrs × Advanced Reports`,
          logicDescription: "Enterprise multi-market report across Snr Analytics (39h), AE (17h), AM (16h), AD (16h), Head of Analytics (2h), Strategy (4h), and Design (6h).",
        },
      ],
    },
    {
      category: "Account Governance & Project Management",
      icon: ShieldAlert,
      phase: "Overhead & Governance",
      description: "End-to-end account direction, weekly client syncs, risk management, and overall project governance.",
      tasks: [
        {
          task: "Weekly Client Status Meetings",
          role: "AE (4h/mo) + AM (2h/mo)",
          params: [{ ruleId: "gov_status_total", unit: " hrs" }],
          scalingBadge: "Per Project Month",
          formulaTemplate: (p) => `${p.gov_status_total} hrs × Project Months (67% AE / 33% AM)`,
          logicDescription: "Weekly client status calls, agendas, status reports, and action tracking for every active month.",
        },
        {
          task: "Commercial & Business Affairs Admin",
          role: "Global Business Affairs Executive",
          params: [{ ruleId: "gov_admin_bae", unit: " hrs" }],
          scalingBadge: "Fixed per Project",
          formulaTemplate: (p) => `${p.gov_admin_bae} hrs × 1 Project`,
          logicDescription: "Fixed allocation for ad-hoc legal queries, PO reconciliation, and compliance paperwork.",
        },
        {
          task: "Account Director Supervision",
          role: "Account Director",
          params: [{ ruleId: "gov_mgmt_ad_pct", unit: "%" }],
          scalingBadge: "% of Non-Mgmt Hours",
          formulaTemplate: (p) => `${p.gov_mgmt_ad_pct}% × Sum(All Non-Management Hours)`,
          logicDescription: "Senior account leadership scaled automatically as a percentage of all delivery hours on the project.",
        },
        {
          task: "Senior Account Director Governance",
          role: "Senior Account Director",
          params: [{ ruleId: "gov_mgmt_sad_pct", unit: "%" }],
          scalingBadge: "% of Non-Mgmt Hours",
          formulaTemplate: (p) => `${p.gov_mgmt_sad_pct}% × Sum(All Non-Management Hours) [5% + 4% tiers]`,
          logicDescription: "Executive client governance and quality oversight scaled as a percentage of total non-management hours.",
        },
        {
          task: "Dedicated Project Management (SPM)",
          role: "Senior Project Manager",
          params: [
            { ruleId: "gov_pm_light", label: "Light", unit: "h/mo" },
            { ruleId: "gov_pm_oversight", label: "Oversight", unit: "h/mo" },
            { ruleId: "gov_pm_full", label: "Full", unit: "h/mo" },
          ],
          scalingBadge: "Per Month by PM Tier",
          formulaTemplate: (p) => `(${p.gov_pm_light}h Light | ${p.gov_pm_oversight}h Oversight | ${p.gov_pm_full}h Full) × Project Months`,
          logicDescription: "Multiplies the selected Project Management involvement tier by total campaign duration in months.",
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
        const formulaStr = t.formulaTemplate(activePresumptions).toLowerCase();
        return (
          t.task.toLowerCase().includes(query) ||
          t.role.toLowerCase().includes(query) ||
          t.scalingBadge.toLowerCase().includes(query) ||
          t.logicDescription.toLowerCase().includes(query) ||
          formulaStr.includes(query)
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
                        {entry.action === "reset" ? "Reset to Default" : "Hours Updated"}
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
            Service Hours Engine
          </TabsTrigger>
          <TabsTrigger value="creator-costs" className="font-semibold text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Creator Cost Engine
          </TabsTrigger>
          <TabsTrigger value="territories-boosters" className="font-semibold text-xs gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Territories & Boosters
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Service Hours Engine */}
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
                    Click any value in the Allocated Hours column to edit it. Changes immediately update the Fee Calculator and are recorded in Version History.
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
                      <div className="bg-muted/30 px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground">{cat.category}</h3>
                            <p className="text-xs text-muted-foreground">{cat.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-medium bg-background shrink-0 w-fit">
                          Phase: {cat.phase}
                        </Badge>
                      </div>
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow>
                            <TableHead className="text-xs font-semibold w-[22%]">Task / Activity</TableHead>
                            <TableHead className="text-xs font-semibold w-[20%]">Assigned Role</TableHead>
                            <TableHead className="text-xs font-semibold w-[22%]">Allocated Hours</TableHead>
                            <TableHead className="text-xs font-semibold w-[36%]">Formula/Multiplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cat.tasks.map((task, tIdx) => (
                            <TableRow key={tIdx} className="hover:bg-muted/15 align-top">
                              <TableCell className="text-xs font-semibold text-foreground py-3">
                                {task.task}
                              </TableCell>
                              <TableCell className="text-xs py-3">
                                <Badge variant="secondary" className="font-medium text-[11px]">
                                  {task.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-3">
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
                              <TableCell className="text-xs py-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold px-1.5 py-0 bg-primary/5 text-primary border-primary/20"
                                    >
                                      {task.scalingBadge}
                                    </Badge>
                                    <code className="bg-muted/80 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-foreground">
                                      {task.formulaTemplate(activePresumptions)}
                                    </code>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {task.logicDescription}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Creator Cost Engine */}
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
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Primary Creator Pricing Equations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-background p-3 rounded-md border">
                    <span className="font-semibold text-foreground block mb-1">1. Estimated Post Views / Impressions</span>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-1.5 rounded">
                      Views = Followers × Format View Rate
                    </code>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      View rates vary by platform (e.g. IG Reels 34%, IG Static 25%, TikTok 15%, IG Stories 5%).
                    </p>
                  </div>
                  <div className="bg-background p-3 rounded-md border">
                    <span className="font-semibold text-foreground block mb-1">2. Logarithmic Dynamic CPM</span>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-1.5 rounded">
                      CPM = Max(a + b · ln(Views), MinCPM)
                    </code>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Coefficients (a, b) define the economies of scale curve; higher impressions yield lower per-view costs.
                    </p>
                  </div>
                  <div className="bg-background p-3 rounded-md border">
                    <span className="font-semibold text-foreground block mb-1">3. Base Content Fee Per Post</span>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-1.5 rounded">
                      Fee = (Views / 1,000) × CPM × Territory Multiplier
                    </code>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Adjusts baseline rate for creator territory index (e.g. US 1.40x, UK 1.00x, Nordics 2.00x).
                    </p>
                  </div>
                  <div className="bg-background p-3 rounded-md border">
                    <span className="font-semibold text-foreground block mb-1">4. Total Influencer Fee with Rights</span>
                    <code className="text-primary font-bold font-mono block text-xs bg-muted/50 p-1.5 rounded">
                      Total = Content Fee + Reposting + Boosters + Campaign Multiplier
                    </code>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Includes paid amplify (+usage ramp), brand exclusivity, and content rights extensions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benchmarks Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Platform & Deliverable CPM Benchmark Coefficients (UK Baseline)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Platform</TableHead>
                        <TableHead className="text-xs font-semibold">Deliverable Format</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Benchmark (a)</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Slope (b)</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Floor CPM (c)</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Est. View Rate</TableHead>
                        <TableHead className="text-xs font-semibold">Format Specification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {benchmarksGBP.map((b, i) => (
                        <TableRow key={i} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-bold text-foreground">{b.platform}</TableCell>
                          <TableCell className="text-xs font-medium">{b.format}</TableCell>
                          <TableCell className="text-xs font-mono text-center font-semibold">{b.a}</TableCell>
                          <TableCell className="text-xs font-mono text-center text-muted-foreground">{b.b}</TableCell>
                          <TableCell className="text-xs font-mono text-center font-bold text-primary">{b.minCPM}</TableCell>
                          <TableCell className="text-xs font-mono text-center font-bold text-emerald-600">{b.viewRate}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{b.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
