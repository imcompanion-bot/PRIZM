import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Calculator,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  Globe,
  Layers,
  Search,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Percent,
  Video,
  FileText,
  BarChart3,
  Cpu,
  Tv
} from "lucide-react";

export function FeeCalcPresumptionsTab() {
  const [searchQuery, setSearchQuery] = useState("");

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

  const serviceCategories = [
    {
      category: "Set Up & Planning",
      icon: Clock,
      phase: "RTB (Round the Table)",
      description: "Baseline kickoff, commercial terms, and governance allocations applied to every project scope.",
      tasks: [
        { task: "Kickoff & Strategic Planning", role: "Account Director", hours: "5.0 hrs", formula: "Fixed minimum kickoff allocation per project" },
        { task: "Execution Setup & Account Planning", role: "Account Manager", hours: "5.0 hrs", formula: "Fixed baseline onboarding and client alignment" },
        { task: "Creative Strategy Oversight", role: "Creative Director", hours: "1.5 hrs", formula: "1.5 hrs if Creative service is enabled" },
        { task: "Content Strategy Framing", role: "Content Strategy Director", hours: "1.5 hrs", formula: "Fixed baseline strategy framework" },
        { task: "Financial Scope & Budgeting", role: "Project Manager", hours: "1.5 hrs", formula: "Commercial scope modeling" },
        { task: "Executive Review", role: "Senior Account Director", hours: "1.0 hr", formula: "Senior executive gate review" },
        { task: "Client Term Sheet Preparation", role: "Global Senior Business Affairs Manager", hours: "1.0 hr", formula: "Legal & compliance governance check" },
        { task: "Client Deal Governance", role: "Global Director of Business Affairs", hours: "5.0 hrs", formula: "Commercial contract review" },
      ]
    },
    {
      category: "Creative & Strategy Development",
      icon: Sparkles,
      phase: "RTB (Round the Table)",
      description: "Generates creative concepting, route design, pitch decks, and feasibility hours dynamically scaled by RTB rounds.",
      tasks: [
        { task: "Strategy Development", role: "Senior Content Strategist", hours: "15.0 hrs", formula: "Fixed per creative campaign track" },
        { task: "Creative Ideation & Execution", role: "Creative", hours: "8.0h + (Jobs × 6.5h)", formula: "Jobs = Total Creative Days / 4 (derived from RTB formula)" },
        { task: "Visual Route & Art Direction", role: "Senior Designer", hours: "Jobs × 2.0h", formula: "Scaled by creative job volume" },
        { task: "Deck Presentation Strategy", role: "Senior Content Strategist", hours: "Min(15h / 4, 4h) = 3.75h", formula: "Quarter of strategy time, capped at 4h" },
        { task: "Deck Presentation Creative", role: "Senior Creative", hours: "Min(Creative Hrs / 4, 8h)", formula: "Quarter of creative time, capped at 8h" },
        { task: "Deck Presentation Design", role: "Senior Designer", hours: "5% of Creative & Deck hrs", formula: "0.05 × (Creative Dev + Strat Deck + Creative Deck)" },
        { task: "Production Feasibility & Costs", role: "Senior Producer", hours: "22.5% of Design & Strat", formula: "0.225 × (Designer Dev + Strat Dev)" },
        { task: "Creative Direction Oversight", role: "Creative Director", hours: "12.5% of Execution hrs", formula: "0.125 × (Creative + Designer + Deck hrs)" },
        { task: "Strategy Direction Oversight", role: "Content Strategy Director", hours: "22.5% of Strategy hrs", formula: "0.225 × (Strat Dev + Strat Deck)" },
      ]
    },
    {
      category: "Talent Brief & Creator Contracting",
      icon: Users,
      phase: "Creators & Contracting",
      description: "Calculates casting, longlist curation, creator fee negotiations, and BA contract drafting scaled by creator count.",
      tasks: [
        { task: "Influencer Brief Draft", role: "Account Manager", hours: "6.0 hrs", formula: "6 hrs fixed per active talent campaign" },
        { task: "Influencer Brief Creative Input", role: "Senior Creative", hours: "1.5 hrs", formula: "1.5 hrs fixed per talent brief" },
        { task: "Influencer Brief Revisions", role: "Account Manager / Senior Creative", hours: "3.0h / 0.5h per rev", formula: "Multiplied by number of client brief revisions" },
        { task: "Creator Search & Longlist", role: "Account Executive", hours: "2.0h × Creators", formula: "2.0 hrs scouting and vet per confirmed creator" },
        { task: "Creator Search Oversight", role: "Account Manager", hours: "1.0h × Creators", formula: "1.0 hr curation and profile audit per creator" },
        { task: "Longlist Client Revisions", role: "AE & AM", hours: "Revisions × (Search / 4)", formula: "25% of baseline search time per revision round" },
        { task: "Outreach & Fee Negotiations", role: "AE & AM", hours: "1.5h AE + 1.5h AM per creator", formula: "Total 3.0 hrs negotiation and rate benchmarking per creator" },
        { task: "Contract Drafting & Execution", role: "Account Manager", hours: "1.0h × Creators", formula: "1.0 hr statement of work alignment per creator" },
        { task: "Master Term Sheet Negotiation", role: "Global Senior Business Affairs Manager", hours: "8.0 hrs fixed", formula: "8.0 hrs legal governance per campaign" },
        { task: "Deal Risk Review", role: "Global Director of Business Affairs", hours: "1.0 hr fixed", formula: "1.0 hr high-level liability check" },
        { task: "Contract Execution & Compliance", role: "Global Business Affairs Executive", hours: "1.5h × Creators", formula: "1.5 hrs redlining and countersignatures per creator" },
      ]
    },
    {
      category: "Live Campaign Management",
      icon: Video,
      phase: "Content Creation & Go Live",
      description: "Operational management for creator briefing, product deliveries, draft review stages, and go-live coordination.",
      tasks: [
        { task: "Instagram Briefing", role: "AE & AM", hours: "0.8h AE + 0.5h AM per creator", formula: "1.3 hrs combined creator briefing and kick-off" },
        { task: "Instagram Image/Story Management", role: "AE & AM", hours: "0.6h AE + 0.8h AM per asset", formula: "1.4 hrs per live photo/story asset batch" },
        { task: "Instagram Video / Reel Management", role: "AE & AM", hours: "0.6h AE + 0.8h AM per video", formula: "1.4 hrs per published Reel" },
        { task: "TikTok Briefing & Video Management", role: "AE & AM", hours: "0.5h brief + 1.0h video per creator", formula: "1.0h AE + 1.0h AM per video asset" },
        { task: "YouTube Briefing & Video Management", role: "AE & AM", hours: "0.5h brief + 1.0h video per creator", formula: "1.0h AE + 1.0h AM per video asset" },
        { task: "Creative Content Reviews", role: "Creative", hours: "0.2h per deliverable", formula: "12 mins creative QA review per draft submitted" },
        { task: "Gifting Creator Briefing & Logistics", role: "AE & AM", hours: "0.25h brief + 0.125h mgmt per creator", formula: "Tailored streamlined workflow for organic gifting" },
        { task: "Product Procurement Shipments", role: "AE & AM", hours: "0.2h AE + 0.2h AM per shipment", formula: "0.4 hrs parcel tracking and dispatch management" },
      ]
    },
    {
      category: "Specialist Production Services",
      icon: Layers,
      phase: "Content Creation & Go Live",
      description: "Calculations for bespoke production tracks including Content House shoots, AR Filters, Gifting Boxes, and Events.",
      tasks: [
        { task: "Content House Shoot Units", role: "AE, AM, Designer, Creative", hours: "6.25 hrs total per asset", formula: "1h AE + 1h AM + 1h Design + 0.5h Creative + 0.75h Product per unit" },
        { task: "AR Filters Development", role: "Designer & Senior Creative", hours: "56h Designer + 10h Creative per filter", formula: "Comprehensive 3D asset, Spark AR/Lens Studio build" },
        { task: "AR Filter Influencer Promotion", role: "Account Manager", hours: "9.0 hrs per filter", formula: "3h search + 2h outreach + 4h negotiation per filter track" },
        { task: "Custom GIFs / Stickers", role: "Designer", hours: "8.0 hrs per GIF", formula: "8 hrs illustration, animation, and Giphy upload" },
        { task: "Gifting Box Concept & Design", role: "Designer & Senior Designer", hours: "16h Design + 3.2h Snr Design per design", formula: "Packaging structural & aesthetic concepting" },
        { task: "Gifting Box Route & Production", role: "Designer & Senior Designer", hours: "54h Design + 10.8h Snr Design per design", formula: "Print-ready artwork, die-lines, and manufacturing checks" },
        { task: "Gifting Box Sourcing & Suppliers", role: "Producer", hours: "28.0 hrs per design", formula: "16h supplier management + 12h product sourcing" },
        { task: "Gifting Box Packing & Dispatch", role: "Account Executive", hours: "0.3 hrs per mailed box", formula: "18 mins fulfillment time per gift package" },
        { task: "Brand Events Management", role: "Snr Creative & Account Manager", hours: "16h Creative + 18h AM per event", formula: "16h concept + 12h vendor booking + 6h live attendance" },
      ]
    },
    {
      category: "Paid Media Strategy & Management",
      icon: TrendingUp,
      phase: "Content Creation & Go Live",
      description: "Calculations for paid social amplify, whitelisting/spark ads, asset adaptations, and media campaign pacing.",
      tasks: [
        { task: "Paid Social Strategy & Creative", role: "Paid Media Director", hours: "7.0 hrs × Live Months", formula: "1h creative review + 6h strategic optimization per month" },
        { task: "Ad Account Setup & Governance", role: "Paid Media Manager", hours: "1.0 hr × Live Months", formula: "1.0 hr monthly infrastructure check" },
        { task: "Creator Access / Whitelisting Setup", role: "Senior Paid Media Executive", hours: "0.5 hrs × Creators", formula: "30 mins token authentication & BC asset link per creator" },
        { task: "Audience & Campaign Architecture", role: "Senior Paid Media Executive", hours: "4.5 hrs × Live Months", formula: "1.5h audience building + 3h campaign structure" },
        { task: "Static & Dynamic Asset Adaptations", role: "Designer", hours: "0.25h / static, 1.0h / video", formula: "Cropping, copy overlays, 9:16 / 4:5 / 1:1 resizes" },
        { task: "Ongoing Optimization & Bid Pacing", role: "Paid Media Team (Exec, Mgr, Dir)", hours: "Months × (13 + 8 × Platforms) × SpendMult", formula: "Spend bonus: 1.0x (<$100k), 1.25x ($100k-$500k), 1.5x (>$500k)" },
        { task: "Weekly Performance Reporting", role: "Paid Media Exec & Director", hours: "Months × (5.5 + 1.75 × Platforms)", formula: "Weekly client pacing and metric digest" },
        { task: "Paid Media Strategic Consultancy", role: "Paid Media Director", hours: "4h (Light) or 16h (Heavy) × Months", formula: "High-level CMO/Brand Director media advisory" },
      ]
    },
    {
      category: "Reporting & Analytics Insights",
      icon: BarChart3,
      phase: "Reporting & Wrap Up",
      description: "Generates data collection, deduplication, dashboard setups, and comprehensive executive reports.",
      tasks: [
        { task: "BI Dashboard Setup & Tagging", role: "Analytics & Insights Manager", hours: "10h setup + 1h/mo maintenance per dashboard", formula: "Looker Studio / Tableau automated live dashboards" },
        { task: "Ongoing Insights Advisory", role: "Analytics & Insights Manager", hours: "4h (Light) or 8h (Heavy) × Months", formula: "Monthly performance deep-dives & mid-flight recommendations" },
        { task: "Snapshot Report (Lite Wrap-Up)", role: "Analytics (16h), AE (7h), AM (3h), AD (0.5h), Snr Analytics (2h), Design (2h)", hours: "30.5 hrs total per report", formula: "Fast 15-20 slide quantitative campaign wrap-up" },
        { task: "Standard Campaign Report", role: "Analytics (27h), AE (11h), AM (8h), AD (3h), Snr Analytics (3h), Strategist (3h), Design (4h)", hours: "59.0 hrs total per report", formula: "Full 35-50 slide analysis including qualitative content learnings" },
        { task: "Advanced / Multi-Market Report", role: "Snr Analytics (39h), AE (17h), AM (16h), AD (16h), Head of Analytics (2h), Strategist (4h), Design (6h)", hours: "100.0 hrs total per report", formula: "Enterprise wrap-up with cross-channel econometric analysis" },
      ]
    },
    {
      category: "Account Governance & Project Management",
      icon: ShieldAlert,
      phase: "Overhead & Governance",
      description: "End-to-end account direction, weekly client syncs, risk management, and overall project governance.",
      tasks: [
        { task: "Weekly Client Status Meetings", role: "AE (4h/mo) + AM (2h/mo)", hours: "6.0 hrs × Project Months", formula: "Weekly 1hr client status preparation, minutes, and actions" },
        { task: "Commercial & Business Affairs Admin", role: "Global Business Affairs Executive", hours: "4.0 hrs fixed", formula: "Ongoing compliance, invoices, and talent paperwork" },
        { task: "Account Director Supervision", role: "Account Director", hours: "10% of all non-management hours", formula: "0.10 × SUM(All other project hours)" },
        { task: "Senior Account Director Governance", role: "Senior Account Director", hours: "9% of all non-management hours", formula: "0.09 × SUM(All other project hours) [5% + 4% tier]" },
        { task: "Dedicated Project Management (SPM)", role: "Senior Project Manager", hours: "Involvement Level × Months", formula: "Light (5h/mo), Execution Oversight (20h/mo), Full End-to-End (40h/mo)" },
      ]
    }
  ];

  const filteredCategories = serviceCategories.filter(cat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cat.category.toLowerCase().includes(query) ||
      cat.description.toLowerCase().includes(query) ||
      cat.phase.toLowerCase().includes(query) ||
      cat.tasks.some(t => t.task.toLowerCase().includes(query) || t.role.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Fee Calculator Presumptions & Calculation Engine Rules
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Official mathematical models, algorithmic CPM curves, rate multipliers, and service hours logic powering the Fee Calculator.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-3 py-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Version V6-3 Active
            </Badge>
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
                    Agency hours are computed deterministically per service module, scaled by creator counts, deliverable formats, live months, and feedback rounds.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks, roles, or rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No calculation rules matching "{searchQuery}".
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
                            <TableHead className="text-xs font-semibold w-1/4">Task / Activity</TableHead>
                            <TableHead className="text-xs font-semibold w-1/4">Assigned Role</TableHead>
                            <TableHead className="text-xs font-semibold w-1/6">Allocated Hours</TableHead>
                            <TableHead className="text-xs font-semibold">Underlying Formula / Multiplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cat.tasks.map((task, tIdx) => (
                            <TableRow key={tIdx} className="hover:bg-muted/15">
                              <TableCell className="text-xs font-semibold text-foreground py-2.5">
                                {task.task}
                              </TableCell>
                              <TableCell className="text-xs py-2.5">
                                <Badge variant="secondary" className="font-medium text-[11px]">
                                  {task.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-bold font-mono text-primary py-2.5">
                                {task.hours}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground py-2.5">
                                <code className="bg-muted/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground">
                                  {task.formula}
                                </code>
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
