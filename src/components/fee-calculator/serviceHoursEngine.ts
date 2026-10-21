/**
 * Service Hours Engine — replicates the "Time Management" tab
 * from the UK / US Fee Calculator Excel V6-3.
 *
 * Each section matches a section header in the Excel.
 * Hours per task line come from the exact formulas in the spreadsheet.
 * Total cost per line = Hours × Rate Card hourly rate for that role.
 */

import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */

export interface TaskLine {
  section: string;        // Excel section header (e.g. "Set Up & Planning")
  task: string;           // Task description (e.g. "Planning")
  role: string;           // Exact role name matching rate_cards.roles.name
  hours: number;
  phase: string | null;   // Phase mapping (null = N/A)
}

/* ─── Editable Presumptions & Version History ─── */

export const DEFAULT_SERVICE_HOUR_PRESUMPTIONS = {
  // 1. Set Up & Planning (Phase: RTB)
  setup_ad_planning: 5.0,
  setup_am_planning: 5.0,
  setup_cd_planning: 1.5,
  setup_csd_planning: 1.5,
  setup_pm_budgeting: 1.5,
  setup_sad_review: 1.0,
  setup_sba_terms: 1.0,
  setup_dba_review: 5.0,

  // 2. Creative & Strategy Development (Phase: RTB)
  creative_strat_dev: 15.0,
  creative_ideation_base: 8.0,
  creative_ideation_per_job: 6.5,
  creative_designer_per_job: 2.0,
  creative_pres_strat: 3.75,
  creative_pres_creative_cap: 8.0,
  creative_pres_design_pct: 5.0,
  creative_producer_pct: 22.5,
  creative_cd_pct: 12.5,
  creative_csd_pct: 22.5,

  // 3. Talent Brief & Creator Contracting (Phase: Creators & Contracting)
  talent_brief_am: 6.0,
  talent_brief_sc: 1.5,
  talent_brief_rev_am: 3.0,
  talent_brief_rev_sc: 0.5,
  talent_search_ae: 2.0,
  talent_search_am: 1.0,
  talent_longlist_rev_pct: 25.0,
  talent_engage_ae: 1.5,
  talent_negotiate_am: 1.5,
  talent_contract_am: 1.0,
  talent_terms_sba: 8.0,
  talent_terms_dba: 1.0,
  talent_contract_bae: 1.5,

  // 4. Live Campaign Management (Phase: Content Creation & Go Live)
  camp_ig_brief_ae: 0.8,
  camp_ig_brief_am: 0.5,
  camp_ig_img_ae: 0.6,
  camp_ig_img_am: 0.8,
  camp_ig_vid_ae: 0.6,
  camp_ig_vid_am: 0.8,
  camp_tt_brief_ae: 0.5,
  camp_tt_brief_am: 0.5,
  camp_tt_vid_ae: 1.0,
  camp_tt_vid_am: 1.0,
  camp_yt_brief_ae: 0.5,
  camp_yt_brief_am: 0.5,
  camp_yt_vid_ae: 1.0,
  camp_yt_vid_am: 1.0,
  camp_creative_review: 0.2,
  camp_gift_brief_total: 0.5,
  camp_gift_mgmt_total: 0.25,
  camp_proc_total: 0.4,

  // 5. Specialist Production Services (Phase: Content Creation & Go Live)
  prod_ch_total: 6.25,
  prod_ar_design: 56.0,
  prod_ar_creative: 10.0,
  prod_ar_am: 9.0,
  prod_gifs_design: 8.0,
  prod_gift_concept_total: 19.2,
  prod_gift_route_prod_total: 64.8,
  prod_gift_producer: 28.0,
  prod_gift_am: 7.0,
  prod_gift_pack_ae: 0.3,
  prod_research_mgr: 4.0,
  prod_event_creative: 16.0,
  prod_event_am: 18.0,

  // 6. Paid Media Strategy & Management (Phase: Content Creation & Go Live)
  paid_strat_dir: 7.0,
  paid_setup_mgr: 1.0,
  paid_whitelisting_exec: 0.5,
  paid_build_exec: 4.5,
  paid_adapt_static: 0.25,
  paid_adapt_video: 1.0,
  paid_copy_exec: 0.25,
  paid_opt_base_total: 13.0,
  paid_status_base_total: 10.0,
  paid_rep_base_total: 7.0,
  paid_consult_light: 4.0,
  paid_consult_heavy: 16.0,

  // 7. Reporting & Analytics Insights (Phase: Reporting & Wrap Up)
  rep_dash_setup: 10.0,
  rep_dash_maint: 1.0,
  rep_ongoing_light: 4.0,
  rep_ongoing_heavy: 8.0,
  rep_snapshot_total: 32.5,
  rep_standard_total: 59.0,
  rep_advanced_total: 100.0,

  // 8. Account Governance & Project Management (Phase: Overhead & Governance)
  gov_status_total: 6.0,
  gov_admin_bae: 4.0,
  gov_mgmt_ad_pct: 10.0,
  gov_mgmt_sad_pct: 9.0,
  gov_pm_light: 5.0,
  gov_pm_oversight: 20.0,
  gov_pm_full: 40.0,

  // 9. Talent Costs — Estimated Format View Rates (%)
  view_rate_ig_single_img: 25.0,
  view_rate_ig_multi_img: 25.0,
  view_rate_ig_short_vid: 34.0,
  view_rate_ig_story: 5.0,
  view_rate_tt_short_vid: 15.0,
  view_rate_yt_short_vid: 15.0,
  view_rate_yt_long_vid: 15.0,
  view_rate_yt_story: 5.0,
};

export type PresumptionRuleId = keyof typeof DEFAULT_SERVICE_HOUR_PRESUMPTIONS;
export type ServiceHourPresumptions = Record<PresumptionRuleId, number>;

export interface PresumptionHistoryEntry {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  category: string;
  task: string;
  role: string;
  ruleId: PresumptionRuleId;
  previousValue: number;
  newValue: number;
  unit: string;
  action: "update" | "reset";
}

const PRESUMPTIONS_STORAGE_KEY = "prism_fee_calc_presumptions_v1";
const HISTORY_STORAGE_KEY = "prism_fee_calc_version_history_v1";
export const PRESUMPTIONS_UPDATED_EVENT = "fee-calc-presumptions-updated";

export function getStoredPresumptionOverrides(): Partial<ServiceHourPresumptions> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PRESUMPTIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function getActivePresumptions(): ServiceHourPresumptions {
  return {
    ...DEFAULT_SERVICE_HOUR_PRESUMPTIONS,
    ...getStoredPresumptionOverrides(),
  };
}

export function getStoredPresumptionHistory(): PresumptionHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function syncPresumptionsFromDatabase(): Promise<{
  overrides: Partial<ServiceHourPresumptions>;
  history: PresumptionHistoryEntry[];
}> {
  try {
    const { data, error } = await supabase
      .from("pharaoh_data")
      .select("payload")
      .eq("id", "fee_calc_presumptions")
      .maybeSingle();

    if (!error && data?.payload) {
      const payload = data.payload as any;
      const overrides = payload.overrides || {};
      const history = Array.isArray(payload.history) ? payload.history : [];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PRESUMPTIONS_STORAGE_KEY, JSON.stringify(overrides));
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        window.dispatchEvent(new CustomEvent(PRESUMPTIONS_UPDATED_EVENT));
      }
      return { overrides, history };
    }
  } catch (e) {
    console.error("Failed to load fee calc presumptions from database", e);
  }
  return {
    overrides: getStoredPresumptionOverrides(),
    history: getStoredPresumptionHistory(),
  };
}

export async function savePresumptionChange(
  overrides: Partial<ServiceHourPresumptions>,
  history: PresumptionHistoryEntry[]
): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRESUMPTIONS_STORAGE_KEY, JSON.stringify(overrides));
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent(PRESUMPTIONS_UPDATED_EVENT));
  }
  const { error } = await supabase.from("pharaoh_data").upsert({
    id: "fee_calc_presumptions",
    payload: {
      overrides,
      history,
      updatedAt: new Date().toISOString(),
    },
  });
  if (error) throw error;
}

/* ─── Section → Phase mapping ─── */

const SECTION_PHASE_MAP: Record<string, string | null> = {
  "Management": null,
  "Set Up & Planning": "RTB",
  "Creative & Strategy Development": "RTB",
  "Talent Brief Development": "Creators & Contracting",
  "Influencer Search & Recommendations": "Creators & Contracting",
  "Influencer Engagement & Fee Negotiation": "Creators & Contracting",
  "Influencer Contract Set Up & Negotiation": "Creators & Contracting",
  "Campaign Management: Instagram": "Content Creation & Go Live",
  "Campaign Management: TikTok": "Content Creation & Go Live",
  "Campaign Management: YouTube": "Content Creation & Go Live",
  "Campaign Management: Gifting": "Content Creation & Go Live",
  "Campaign Management: Procurement": "Content Creation & Go Live",
  "Production: Content House": "Content Creation & Go Live",
  "Production: AR Filter": "Content Creation & Go Live",
  "Production: Gifting": "Content Creation & Go Live",
  "Production: Research": "Content Creation & Go Live",
  "Production: Events": "Content Creation & Go Live",
  "Paid Media: Strategy & Setup": "Content Creation & Go Live",
  "Paid Media: Campaign Management": "Content Creation & Go Live",
  "Agility - Campaign Setup": "Content Creation & Go Live",
  "Agility - Campaign Management": "Content Creation & Go Live",
  "Reporting: Dashboard & Setup": "Reporting & Wrap Up",
  "Reporting: Snapshot": "Reporting & Wrap Up",
  "Reporting: Standard": "Reporting & Wrap Up",
  "Reporting: Advanced": "Reporting & Wrap Up",
  "Status Meetings": null,
  "Admin": null,
  "Miscellaneous BDB Services": null,
};

export interface ServiceHoursResult {
  lines: TaskLine[];
  bySection: Record<string, { hours: number; fee: number }>;
  totalHours: number;
  totalFee: number;
}

/* ─── Inputs ─── */

export interface EngineInput {
  durationMonths: number;

  // Project Management
  pmEnabled: boolean;
  pmInvolvement: string; // "Set up / Light" | "Set up / Execution Oversight" | "Full - End to End"

  // Creative
  creativeEnabled: boolean;
  creativeJobs: number;      // derived: total creative days / 4 (from RTB formula)
  proposalRevisions: number;
  roundsOfFeedback: number;

  // Talent & Content Management
  talentEnabled: boolean;
  totalInfluencers: number;
  crossPlatformInfluencers: number;
  influencerBriefRevisions: number;
  longListRevisions: number;
  contentIdeation: boolean;
  ideationRevisions: number;
  creativeTeamInvolved: boolean;
  contentProduction: boolean;
  contentRevisions: number;
  contentReviews: "None" | "Few" | "Many" | "All" | boolean;

  // Platform deliverables (from talent groups)
  instagramInfluencers: number;
  instagramImages: number;    // single + multi images
  instagramStories: number;
  instagramVideos: number;    // short videos
  tiktokInfluencers: number;
  tiktokVideos: number;
  youtubeInfluencers: number;
  youtubeVideos: number;
  giftingInfluencers: number; // from gifting tiers

  // Procurement
  procurementEnabled: boolean;
  totalShipments: number;

  // Production
  productionEnabled: boolean;
  contentHouseAssets: number;

  // Other Services
  arFilters: number;
  gifs: number;
  eventCount: number;
  giftingBoxes: number;
  giftingDesigns: number;
  researchReports: number;

  // Paid Media
  paidMediaEnabled: boolean;
  paidMediaPlatforms: number;   // count of active paid channels
  paidMediaLiveMonths: number;
  paidMediaComplexity: string;  // "" | "Standard" | "Complex"
  paidMediaSpend: number;
  totalPaidStaticAssets: number;
  totalPaidDynamicAssets: number;
  consultancyInvolvement: string; // "Light" | "Heavy"

  // Reporting
  reportingEnabled: boolean;
  reportingInvolvement: string;  // "Reporting only" | "Light" | "Heavy"
  dashboards: number;
  snapshotReports: number;
  standardReports: number;
  advancedReports: number;
}

/* ─── Helpers ─── */

const r = (n: number) => Math.round(n * 10) / 10;

function paidSpendBonus(spend: number): number {
  if (spend >= 500000) return 1.5;
  if (spend >= 100000) return 1.25;
  return 1;
}

function paidComplexityMult(c: string): number {
  return c === "Complex" ? 1.5 : 1;
}

/* ─── Main calculation ─── */

export function calculateServiceHours(
  input: EngineInput,
  customPresumptions?: Partial<ServiceHourPresumptions>
): TaskLine[] {
  const p: ServiceHourPresumptions = {
    ...getActivePresumptions(),
    ...(customPresumptions || {}),
  };

  const lines: TaskLine[] = [];
  const months = Math.max(input.durationMonths, 1);
  const totalInfluencers = input.totalInfluencers;
  const talentActive = input.talentEnabled && totalInfluencers > 0 ? 1 : 0;
  const creativeActive = input.creativeEnabled ? 1 : 0;
  const creativeJobs = Math.max(input.creativeJobs, 0);

  const push = (section: string, task: string, role: string, hours: number) => {
    const h = r(hours);
    if (h > 0) lines.push({ section, task, role, hours: h, phase: SECTION_PHASE_MAP[section] ?? null });
  };

  // ═══════════════════════════════════════════
  // SET UP & PLANNING
  // ═══════════════════════════════════════════
  push("Set Up & Planning", "Planning", "Account Director", p.setup_ad_planning);
  push("Set Up & Planning", "Planning", "Account Manager", p.setup_am_planning);
  push("Set Up & Planning", "Planning", "Creative Director", p.setup_cd_planning * creativeActive);
  push("Set Up & Planning", "Planning", "Content Strategy Director", p.setup_csd_planning);
  push("Set Up & Planning", "Budgeting", "Project Manager", p.setup_pm_budgeting);
  push("Set Up & Planning", "Review", "Senior Account Director", p.setup_sad_review);
  push("Set Up & Planning", "Client Term Sheet", "Global Senior Business Affairs Manager", p.setup_sba_terms);
  push("Set Up & Planning", "Client Deal Review", "Global Director of Business Affairs", p.setup_dba_review);

  // ═══════════════════════════════════════════
  // CREATIVE & STRATEGY DEVELOPMENT
  // ═══════════════════════════════════════════
  if (input.creativeEnabled && creativeJobs > 0) {
    const stratDevHrs = p.creative_strat_dev;
    push("Creative & Strategy Development", "Strategy development", "Senior Content Strategist", stratDevHrs);

    const creativeDevHrs = (p.creative_ideation_base + creativeJobs * p.creative_ideation_per_job) * creativeActive;
    push("Creative & Strategy Development", "Creative development", "Creative", creativeDevHrs);

    const designerDevHrs = (creativeJobs * p.creative_designer_per_job) * creativeActive;
    push("Creative & Strategy Development", "Creative development", "Senior Designer", designerDevHrs);

    // Presentation development
    const presStratHrs = p.creative_pres_strat !== DEFAULT_SERVICE_HOUR_PRESUMPTIONS.creative_pres_strat
      ? p.creative_pres_strat
      : Math.min(stratDevHrs / 4, 4);
    push("Creative & Strategy Development", "Presentation Development", "Senior Content Strategist", presStratHrs);

    const presCreativeHrs = Math.min(creativeDevHrs / 4, p.creative_pres_creative_cap) * creativeActive;
    push("Creative & Strategy Development", "Presentation Development", "Senior Creative", presCreativeHrs);

    // Senior Designer for presentation: % of creative+pres hours
    const presDesignerHrs = (creativeDevHrs + presStratHrs + presCreativeHrs) * (p.creative_pres_design_pct / 100);
    push("Creative & Strategy Development", "Presentation Development", "Senior Designer", presDesignerHrs);

    // Senior Producer: % of (designer dev + strat dev)
    const producerHrs = (designerDevHrs + stratDevHrs) * (p.creative_producer_pct / 100);
    push("Creative & Strategy Development", "Feasibility, Planning and Prod Costs", "Senior Producer", producerHrs);

    // Creative Director: % of creative execution hours
    const cdHrs = (creativeDevHrs + designerDevHrs + presCreativeHrs + presDesignerHrs) * (p.creative_cd_pct / 100);
    push("Creative & Strategy Development", "Direction", "Creative Director", cdHrs);

    // Content Strategy Director: % of strategy hours
    const csdHrs = (stratDevHrs + presStratHrs) * (p.creative_csd_pct / 100);
    push("Creative & Strategy Development", "Direction", "Content Strategy Director", csdHrs);
  }

  // ═══════════════════════════════════════════
  // TALENT BRIEF DEVELOPMENT
  // ═══════════════════════════════════════════
  if (talentActive) {
    push("Talent Brief Development", "Influencer Brief Draft", "Account Manager", p.talent_brief_am * talentActive);
    push("Talent Brief Development", "Influencer Brief Draft", "Senior Creative", p.talent_brief_sc * talentActive);

    const briefRevs = input.influencerBriefRevisions || 0;
    push("Talent Brief Development", "Influencer Brief Revisions", "Account Manager", briefRevs * p.talent_brief_rev_am);
    push("Talent Brief Development", "Influencer Brief Revisions", "Senior Creative", briefRevs * p.talent_brief_rev_sc);
  }

  // ═══════════════════════════════════════════
  // INFLUENCER SEARCH & RECOMMENDATIONS
  // ═══════════════════════════════════════════
  if (talentActive) {
    const searchInfluencers = totalInfluencers;
    const revFactor = p.talent_longlist_rev_pct / 100;
    const aeSearchHrs = searchInfluencers * p.talent_search_ae;
    push("Influencer Search & Recommendations", "Search", "Account Executive", aeSearchHrs);

    const longListRevs = input.longListRevisions || 0;
    push("Influencer Search & Recommendations", "Longlist Revisions", "Account Executive", longListRevs * (aeSearchHrs * revFactor));

    const amSearchHrs = searchInfluencers * p.talent_search_am;
    push("Influencer Search & Recommendations", "Search", "Account Manager", amSearchHrs);
    push("Influencer Search & Recommendations", "Longlist Revisions", "Account Manager", longListRevs * (amSearchHrs * revFactor));
  }

  // ═══════════════════════════════════════════
  // INFLUENCER ENGAGEMENT & FEE NEGOTIATION
  // ═══════════════════════════════════════════
  if (talentActive) {
    push("Influencer Engagement & Fee Negotiation", "Engage", "Account Executive", totalInfluencers * p.talent_engage_ae);
    push("Influencer Engagement & Fee Negotiation", "Fee Negotiations", "Account Manager", totalInfluencers * p.talent_negotiate_am);
  }

  // ═══════════════════════════════════════════
  // INFLUENCER CONTRACT SET UP & NEGOTIATION
  // ═══════════════════════════════════════════
  if (talentActive) {
    push("Influencer Contract Set Up & Negotiation", "Contract Negotiations", "Account Manager", totalInfluencers * p.talent_contract_am);
    push("Influencer Contract Set Up & Negotiation", "Master Influencer Term Sheet", "Global Senior Business Affairs Manager", p.talent_terms_sba * talentActive);
    push("Influencer Contract Set Up & Negotiation", "Master Influencer Term Sheet", "Global Director of Business Affairs", p.talent_terms_dba * talentActive);
    push("Influencer Contract Set Up & Negotiation", "Contract Negotiations", "Global Business Affairs Executive", totalInfluencers * p.talent_contract_bae);
  }

  // ═══════════════════════════════════════════
  // CAMPAIGN MANAGEMENT: INSTAGRAM
  // ═══════════════════════════════════════════
  if (talentActive && input.instagramInfluencers > 0) {
    const igInfls = input.instagramInfluencers;
    const igImageStory = input.instagramImages + input.instagramStories;
    const igVideos = input.instagramVideos;

    const ideationMult = input.contentIdeation ? 1 : 0;
    const productionMult = input.contentProduction ? 1 : 0;
    const contentMult = ideationMult * productionMult;

    const imageStoryUnits = igImageStory * contentMult;
    const videoUnits = igVideos;
    const totalDeliverables = igImageStory + igVideos;

    push("Campaign Management: Instagram", "Influencer Briefing", "Account Executive", igInfls * p.camp_ig_brief_ae);
    push("Campaign Management: Instagram", "Influencer Briefing", "Account Manager", igInfls * p.camp_ig_brief_am);
    push("Campaign Management: Instagram", "Image/Story production management", "Account Executive", imageStoryUnits * p.camp_ig_img_ae);
    push("Campaign Management: Instagram", "Image/Story production management", "Account Manager", imageStoryUnits * p.camp_ig_img_am);
    push("Campaign Management: Instagram", "Video production management", "Account Executive", videoUnits * p.camp_ig_vid_ae);
    push("Campaign Management: Instagram", "Video production management", "Account Manager", videoUnits * p.camp_ig_vid_am);
    push("Campaign Management: Instagram", "Creative Content Reviews", "Creative", totalDeliverables * p.camp_creative_review);
  }

  // ═══════════════════════════════════════════
  // CAMPAIGN MANAGEMENT: TIKTOK
  // ═══════════════════════════════════════════
  if (talentActive && input.tiktokInfluencers > 0) {
    const ttInfls = input.tiktokInfluencers;
    const ttVideos = input.tiktokVideos;

    push("Campaign Management: TikTok", "Influencer Briefing", "Account Executive", ttInfls * p.camp_tt_brief_ae);
    push("Campaign Management: TikTok", "Influencer Briefing", "Account Manager", ttInfls * p.camp_tt_brief_am);
    push("Campaign Management: TikTok", "Video production management", "Account Executive", ttVideos * p.camp_tt_vid_ae);
    push("Campaign Management: TikTok", "Video production management", "Account Manager", ttVideos * p.camp_tt_vid_am);
    push("Campaign Management: TikTok", "Creative Content Reviews", "Creative", ttVideos * p.camp_creative_review);
  }

  // ═══════════════════════════════════════════
  // CAMPAIGN MANAGEMENT: YOUTUBE
  // ═══════════════════════════════════════════
  if (talentActive && input.youtubeInfluencers > 0) {
    const ytInfls = input.youtubeInfluencers;
    const ytVideos = input.youtubeVideos;

    push("Campaign Management: YouTube", "Influencer Briefing", "Account Executive", ytInfls * p.camp_yt_brief_ae);
    push("Campaign Management: YouTube", "Influencer Briefing", "Account Manager", ytInfls * p.camp_yt_brief_am);
    push("Campaign Management: YouTube", "Video production management", "Account Executive", ytVideos * p.camp_yt_vid_ae);
    push("Campaign Management: YouTube", "Video production management", "Account Manager", ytVideos * p.camp_yt_vid_am);
    push("Campaign Management: YouTube", "Creative Content Reviews", "Creative", ytVideos * p.camp_creative_review);
  }

  // ═══════════════════════════════════════════
  // CAMPAIGN MANAGEMENT: GIFTING
  // ═══════════════════════════════════════════
  if (talentActive && input.giftingInfluencers > 0) {
    const gi = input.giftingInfluencers;
    const giftBriefEach = p.camp_gift_brief_total / 2;
    const giftMgmtEach = p.camp_gift_mgmt_total / 2;
    push("Campaign Management: Gifting", "Influencer Briefing", "Account Executive", gi * giftBriefEach);
    push("Campaign Management: Gifting", "Influencer Briefing", "Account Manager", gi * giftBriefEach);
    push("Campaign Management: Gifting", "Gifting Content Management", "Account Executive", gi * giftMgmtEach);
    push("Campaign Management: Gifting", "Gifting Content Management", "Account Manager", gi * giftMgmtEach);
    push("Campaign Management: Gifting", "Creative Content Reviews", "Creative", gi * p.camp_creative_review);
  }

  // ═══════════════════════════════════════════
  // CAMPAIGN MANAGEMENT: PROCUREMENT
  // ═══════════════════════════════════════════
  if (input.procurementEnabled && input.totalShipments > 0) {
    const procEach = p.camp_proc_total / 2;
    push("Campaign Management: Procurement", "Product Procurement", "Account Executive", input.totalShipments * procEach);
    push("Campaign Management: Procurement", "Product Procurement", "Account Manager", input.totalShipments * procEach);
  }

  // ═══════════════════════════════════════════
  // PRODUCTION: CONTENT HOUSE
  // ═══════════════════════════════════════════
  if (input.contentHouseAssets > 0) {
    const assets = input.contentHouseAssets;
    const chScale = p.prod_ch_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.prod_ch_total;
    push("Production: Content House", "Influencer Briefing", "Account Executive", assets * 1 * chScale);
    push("Production: Content House", "Influencer Briefing", "Account Manager", assets * 1 * chScale);
    push("Production: Content House", "Production Management", "Account Executive", assets * 1 * chScale);
    push("Production: Content House", "Production Management", "Account Manager", assets * 1 * chScale);
    push("Production: Content House", "Creative Asset Review", "Creative", assets * 0.5 * chScale);
    push("Production: Content House", "Design", "Designer", assets * 1 * chScale);
    push("Production: Content House", "Product Selection", "Account Executive", assets * 0.75 * chScale);
  }

  // ═══════════════════════════════════════════
  // PRODUCTION: AR FILTER
  // ═══════════════════════════════════════════
  if (input.arFilters > 0) {
    const ar = input.arFilters;
    const arAmScale = p.prod_ar_am / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.prod_ar_am;
    push("Production: AR Filter", "Creative development", "Senior Creative", ar * p.prod_ar_creative);
    push("Production: AR Filter", "Design", "Designer", ar * p.prod_ar_design);
    push("Production: AR Filter", "Influencer Search", "Account Manager", ar * 3 * arAmScale);
    push("Production: AR Filter", "Engage", "Account Manager", ar * 2 * arAmScale);
    push("Production: AR Filter", "Negotiate & Contract", "Account Manager", ar * 4 * arAmScale);
  }

  if (input.gifs > 0) {
    push("Production: AR Filter", "GIFs", "Designer", input.gifs * p.prod_gifs_design);
  }

  // ═══════════════════════════════════════════
  // PRODUCTION: GIFTING
  // ═══════════════════════════════════════════
  if (input.giftingDesigns > 0 || input.giftingBoxes > 0) {
    const designs = input.giftingDesigns;
    const conceptScale = p.prod_gift_concept_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.prod_gift_concept_total;
    const routeProdScale = p.prod_gift_route_prod_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.prod_gift_route_prod_total;
    const prodScale = p.prod_gift_producer / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.prod_gift_producer;
    push("Production: Gifting", "Design Concepts", "Designer", designs * 16 * conceptScale);
    push("Production: Gifting", "Design Concepts", "Senior Designer", designs * 16 * 0.2 * conceptScale);
    push("Production: Gifting", "Route Development", "Designer", designs * 30 * routeProdScale);
    push("Production: Gifting", "Route Development", "Senior Designer", designs * 30 * 0.2 * routeProdScale);
    push("Production: Gifting", "Production", "Designer", designs * 24 * routeProdScale);
    push("Production: Gifting", "Production", "Senior Designer", designs * 24 * 0.2 * routeProdScale);
    push("Production: Gifting", "Supplier Management", "Producer", designs * 16 * prodScale);
    push("Production: Gifting", "Product Sourcing", "Producer", designs * 12 * prodScale);
    push("Production: Gifting", "Packing & Shipping", "Account Executive", input.giftingBoxes * p.prod_gift_pack_ae);
    push("Production: Gifting", "Supervision/Review", "Account Manager", designs * p.prod_gift_am);
  }

  // ═══════════════════════════════════════════
  // PRODUCTION: RESEARCH
  // ═══════════════════════════════════════════
  if (input.researchReports > 0) {
    push("Production: Research", "Research Sourcing & Review", "Senior Analytics & Insights Manager", input.researchReports * p.prod_research_mgr);
  }

  // ═══════════════════════════════════════════
  // PRODUCTION: EVENTS
  // ═══════════════════════════════════════════
  if (input.eventCount > 0) {
    const ev = input.eventCount;
    const evAmScale = p.prod_event_am / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.prod_event_am;
    push("Production: Events", "Concept & Ideation", "Senior Creative", p.prod_event_creative);
    push("Production: Events", "Bookings, Execution and Sourcing", "Account Manager", ev * 12 * evAmScale);
    push("Production: Events", "Management during event", "Account Manager", ev * 6 * evAmScale);
  }

  // ═══════════════════════════════════════════
  // PAID MEDIA: STRATEGY & SETUP
  // ═══════════════════════════════════════════
  if (input.paidMediaEnabled) {
    const platforms = Math.max(input.paidMediaPlatforms, 1);
    const liveMonths = Math.max(input.paidMediaLiveMonths, 1);
    const spendBonus = paidSpendBonus(input.paidMediaSpend);
    const complexity = paidComplexityMult(input.paidMediaComplexity);
    const totalAssets = input.totalPaidStaticAssets + input.totalPaidDynamicAssets;

    const stratScale = p.paid_strat_dir / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.paid_strat_dir;
    const buildScale = p.paid_build_exec / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.paid_build_exec;
    const optScale = p.paid_opt_base_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.paid_opt_base_total;
    const statusScale = p.paid_status_base_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.paid_status_base_total;
    const repScale = p.paid_rep_base_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.paid_rep_base_total;

    // Strategy & Setup
    push("Paid Media: Strategy & Setup", "Creative Development & Review", "Paid Media Director", liveMonths * 1 * stratScale);
    push("Paid Media: Strategy & Setup", "Paid Media Strategy", "Paid Media Director", liveMonths * 6 * stratScale);
    push("Paid Media: Strategy & Setup", "Setup - Account Setup", "Paid Media Manager", liveMonths * p.paid_setup_mgr);
    push("Paid Media: Strategy & Setup", "Setup - Connecting Influencers", "Senior Paid Media Executive", totalInfluencers * p.paid_whitelisting_exec);
    push("Paid Media: Strategy & Setup", "Setup - Audience Creation", "Senior Paid Media Executive", liveMonths * 1.5 * buildScale);
    push("Paid Media: Strategy & Setup", "Setup - Initial Campaign Build", "Senior Paid Media Executive", liveMonths * 3 * buildScale);

    // Campaign Management
    push("Paid Media: Campaign Management", "Asset adapt - image/carousel", "Designer", input.totalPaidStaticAssets * p.paid_adapt_static);
    push("Paid Media: Campaign Management", "Asset adapt - video", "Designer", input.totalPaidDynamicAssets * p.paid_adapt_video);
    push("Paid Media: Campaign Management", "Copywriting", "Senior Paid Media Executive", totalAssets * p.paid_copy_exec);
    push("Paid Media: Campaign Management", "Ongoing Management & Optimisation", "Senior Paid Media Executive",
      liveMonths * (9 * optScale + 5 * platforms) * spendBonus);
    push("Paid Media: Campaign Management", "Ongoing Management & Optimisation", "Paid Media Manager",
      liveMonths * (3 * optScale + 2 * platforms) * spendBonus);
    push("Paid Media: Campaign Management", "Ongoing Management & Optimisation", "Paid Media Director",
      liveMonths * (1 * optScale + 1 * platforms) * spendBonus);
    push("Paid Media: Campaign Management", "Weekly Update Emails", "Senior Paid Media Executive",
      liveMonths * (4 * statusScale + 1.5 * platforms));
    push("Paid Media: Campaign Management", "Weekly Update Emails", "Paid Media Director",
      liveMonths * (1.5 * statusScale + 0.25 * platforms));
    push("Paid Media: Campaign Management", "Status Meetings", "Senior Paid Media Executive", liveMonths * 3 * statusScale);
    push("Paid Media: Campaign Management", "Status Meetings", "Paid Media Director", liveMonths * 1.5 * statusScale);
    push("Paid Media: Campaign Management", "Reporting", "Senior Paid Media Executive",
      liveMonths * (4 * repScale + 3 * platforms) * complexity);
    push("Paid Media: Campaign Management", "Reporting", "Paid Media Director",
      liveMonths * (2 * repScale + 1 * platforms) * complexity);
    push("Paid Media: Campaign Management", "Reporting", "Paid Media Manager",
      liveMonths * (1 * repScale + 0.5 * platforms) * complexity);

    // Consultancy (from involvement dropdown)
    const consultHrs = input.consultancyInvolvement === "Heavy" ? p.paid_consult_heavy : p.paid_consult_light;
    push("Paid Media: Campaign Management", "Consultancy", "Paid Media Director", liveMonths * consultHrs);
  }

  // ═══════════════════════════════════════════
  // REPORTING: DASHBOARD & SETUP
  // ═══════════════════════════════════════════
  if (input.reportingEnabled) {
    const reportMonths = months;

    if (input.dashboards > 0) {
      const dashSetupScale = p.rep_dash_setup / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.rep_dash_setup;
      push("Reporting: Dashboard & Setup", "Dashboard setup", "Analytics & Insights Manager", input.dashboards * 6 * dashSetupScale);
      push("Reporting: Dashboard & Setup", "Dashboard maintenance", "Analytics & Insights Manager", input.dashboards * reportMonths * p.rep_dash_maint);
      push("Reporting: Dashboard & Setup", "Post analytics sheet & tagging setup", "Analytics & Insights Manager", input.dashboards * 4 * dashSetupScale);
    }

    // Ongoing involvement
    const involvementHrs = input.reportingInvolvement === "Heavy" ? p.rep_ongoing_heavy :
      input.reportingInvolvement === "Light" ? p.rep_ongoing_light : 0;
    if (involvementHrs > 0) {
      push("Reporting: Dashboard & Setup", "Ongoing involvement", "Analytics & Insights Manager", reportMonths * involvementHrs);
    }
  }

  // ═══════════════════════════════════════════
  // REPORTING: SNAPSHOT
  // ═══════════════════════════════════════════
  if (input.reportingEnabled && input.snapshotReports > 0) {
    const n = input.snapshotReports;
    const snapScale = p.rep_snapshot_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.rep_snapshot_total;
    push("Reporting: Snapshot", "Data collection & processing", "Analytics & Insights Manager", n * 4 * snapScale);
    push("Reporting: Snapshot", "Data analysis and visualisation", "Analytics & Insights Manager", n * 14 * snapScale);
    push("Reporting: Snapshot", "Data & report input", "Account Executive", n * 7 * snapScale);
    push("Reporting: Snapshot", "Report structure/writing/review", "Account Manager", n * 3 * snapScale);
    push("Reporting: Snapshot", "Report structure/writing/review", "Account Director", n * 0.5 * snapScale);
    push("Reporting: Snapshot", "Review", "Senior Analytics & Insights Manager", n * 2 * snapScale);
    push("Reporting: Snapshot", "Presentation design", "Designer", n * 2 * snapScale);
  }

  // ═══════════════════════════════════════════
  // REPORTING: STANDARD
  // ═══════════════════════════════════════════
  if (input.reportingEnabled && input.standardReports > 0) {
    const n = input.standardReports;
    const stdScale = p.rep_standard_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.rep_standard_total;
    push("Reporting: Standard", "Data collection & processing", "Analytics & Insights Manager", n * 6 * stdScale);
    push("Reporting: Standard", "Content tagging", "Account Executive", n * 3 * stdScale);
    push("Reporting: Standard", "Data analysis and visualisation", "Analytics & Insights Manager", n * 21 * stdScale);
    push("Reporting: Standard", "Data & report input", "Account Executive", n * 8 * stdScale);
    push("Reporting: Standard", "Report structure/writing/review", "Account Manager", n * 8 * stdScale);
    push("Reporting: Standard", "Report structure/writing/review", "Account Director", n * 3 * stdScale);
    push("Reporting: Standard", "Story/insight/learning review", "Senior Analytics & Insights Manager", n * 3 * stdScale);
    push("Reporting: Standard", "Story/insight/learning input", "Senior Social Strategist", n * 3 * stdScale);
    push("Reporting: Standard", "Presentation design", "Designer", n * 4 * stdScale);
  }

  // ═══════════════════════════════════════════
  // REPORTING: ADVANCED
  // ═══════════════════════════════════════════
  if (input.reportingEnabled && input.advancedReports > 0) {
    const n = input.advancedReports;
    const advScale = p.rep_advanced_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.rep_advanced_total;
    push("Reporting: Advanced", "Data collection & processing", "Senior Analytics & Insights Manager", n * 7 * advScale);
    push("Reporting: Advanced", "Content tagging", "Account Executive", n * 5 * advScale);
    push("Reporting: Advanced", "Data analysis and visualisation", "Senior Analytics & Insights Manager", n * 28 * advScale);
    push("Reporting: Advanced", "Data & report input", "Account Executive", n * 12 * advScale);
    push("Reporting: Advanced", "Report structure/writing/review", "Account Manager", n * 16 * advScale);
    push("Reporting: Advanced", "Report structure/writing/review", "Account Director", n * 16 * advScale);
    push("Reporting: Advanced", "Story/insight/learning review", "Senior Analytics & Insights Manager", n * 4 * advScale);
    push("Reporting: Advanced", "Story/insight/learning input", "Senior Social Strategist", n * 4 * advScale);
    push("Reporting: Advanced", "Quality Control", "Global Head of Insight & Analytics", n * 2 * advScale);
    push("Reporting: Advanced", "Presentation design", "Designer", n * 6 * advScale);
  }

  // ═══════════════════════════════════════════
  // STATUS MEETINGS
  // ═══════════════════════════════════════════
  const statusScale = p.gov_status_total / DEFAULT_SERVICE_HOUR_PRESUMPTIONS.gov_status_total;
  push("Status Meetings", "Status Meetings", "Account Executive", months * 4 * statusScale);
  push("Status Meetings", "Status Meetings", "Account Manager", months * 2 * statusScale);

  // ═══════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════
  push("Admin", "Adhoc Requests", "Global Business Affairs Executive", p.gov_admin_bae);

  // ═══════════════════════════════════════════
  // MANAGEMENT (calculated LAST — % of all other hours)
  // ═══════════════════════════════════════════
  const nonMgmtHours = lines.reduce((s, l) => s + l.hours, 0);

  if (input.pmEnabled) {
    const pmMonthlyHrs =
      input.pmInvolvement === "Set up / Light" ? p.gov_pm_light :
      input.pmInvolvement === "Set up / Execution Oversight" ? p.gov_pm_oversight :
      input.pmInvolvement === "Full - End to End" ? p.gov_pm_full : p.gov_pm_oversight;

    const sadTotalPct = p.gov_mgmt_sad_pct / 100;
    const sadPart1 = sadTotalPct * (5 / 9);
    const sadPart2 = sadTotalPct * (4 / 9);

    push("Management", "Management", "Account Director", nonMgmtHours * (p.gov_mgmt_ad_pct / 100));
    push("Management", "Management", "Senior Account Director", nonMgmtHours * sadPart1);
    push("Management", "Management", "Senior Account Director", nonMgmtHours * sadPart2);
    push("Management", "Management", "Senior Project Manager", pmMonthlyHrs * months);
  }

  return lines;
}

/* ─── Rate matching & fee computation ─── */

export function computeAgencyFee(
  lines: TaskLine[],
  rateCardRoles: { roleName: string; hourlyRate: number }[],
): ServiceHoursResult {
  const bySection: Record<string, { hours: number; fee: number }> = {};
  let totalHours = 0;
  let totalFee = 0;

  // Build a name→rate lookup (case-insensitive exact match)
  const rateLookup = new Map<string, number>();
  for (const rc of rateCardRoles) {
    rateLookup.set(rc.roleName.toLowerCase(), rc.hourlyRate);
  }

  for (const line of lines) {
    const rate = rateLookup.get(line.role.toLowerCase()) || 0;
    const fee = line.hours * rate;

    if (!bySection[line.section]) {
      bySection[line.section] = { hours: 0, fee: 0 };
    }
    bySection[line.section].hours += line.hours;
    bySection[line.section].fee += fee;
    totalHours += line.hours;
    totalFee += fee;
  }

  return { lines, bySection, totalHours, totalFee };
}
