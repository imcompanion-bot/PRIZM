import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, BarChart, Target, Globe } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { TimesheetsWidget } from "@/components/pharaoh/TimesheetsWidget";
import { PrioritiesWidget } from "@/components/pharaoh/PrioritiesWidget";
import { KpiExplorerWidget } from "@/components/pharaoh/KpiExplorerWidget";
import { initLegacyModule } from "@/lib/pharaoh/legacyPharaoh";

// Formatting helpers
const fL = (v: number) => {
  if (isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1000000) return '£' + (v / 1000000).toFixed(2).replace(/\.00$/, '') + 'm';
  if (a >= 1000) return '£' + Math.round(v / 1000) + 'k';
  return '£' + Math.round(v);
};

const f$ = (v: number) => {
  if (isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1000000) return '$' + (v / 1000000).toFixed(2).replace(/\.00$/, '') + 'm';
  if (a >= 1000) return '$' + Math.round(v / 1000) + 'k';
  return '$' + Math.round(v);
};

const pct = (a: number, b: number) => {
  if (!b) return 0;
  return Math.round((a / b) * 100);
};

const monthName = (YYYYMM: string) => {
  const m = parseInt(YYYYMM.slice(5, 7), 10);
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
};

export default function HomePage() {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [legacy, setLegacy] = useState<any>(null);
  
  const [viewMode, setViewMode] = useState("group"); 
  const [marketTab, setMarketTab] = useState("group"); 
  const [clientTab, setClientTab] = useState("all");

  useEffect(() => {
    async function loadData() {
      const { data: pData, error } = await supabase.from("pharaoh_data").select("*");
      if (error || !pData) {
        console.error("Error fetching pharaoh_data:", error);
        setLoading(false);
        return;
      }
      const metrics = pData.find(r => r.id === "metrics")?.payload || {};
      const us = pData.find(r => r.id === "us")?.payload || {};
      const uk = pData.find(r => r.id === "uk")?.payload || {};
      
      const combined = { ...metrics, us, uk };
      setData({ metrics, us, uk });
      
      const legacyApi = initLegacyModule(combined);
      legacyApi.buildSidebar = () => {};
      (window as any).mkt = 'grp';
      setLegacy(legacyApi);
      
      setLoading(false);
    }
    loadData();
  }, []);

  const m = useMemo(() => {
    if (!data) return null;
    const { metrics: mx, us, uk } = data;
    const NEAR = mx.NEAR_MO || []; 
    
    const mnth = new Date().getMonth() + 1;
    let qMonths = NEAR.slice(0, 3);
    let qLabel = "Q1";
    if (mnth >= 8 && mnth <= 10) { qMonths = NEAR.slice(3, 6); qLabel = "Q2"; }
    else if (mnth >= 11 || mnth === 1) { qMonths = NEAR.slice(6, 9); qLabel = "Q3"; }
    else if (mnth >= 2 && mnth <= 4) { qMonths = NEAR.slice(9, 12); qLabel = "Q4"; }

    const isMyClients = viewMode === "my_clients";
    const allocatedClients = appUser?.allocatedClients || [];
    let targetClients = isMyClients ? allocatedClients : [];
    if (isMyClients && clientTab !== "all") {
      targetClients = [clientTab];
    }

    const AS_OF = mx.AS_OF;

    const getMarketMetrics = (market: "us" | "uk") => {
      const md = market === "us" ? us : uk;
      const isUS = market === "us";
      const fx = isUS ? mx.FX : 1;
      
      let h1Target = 0, h1Pipe = 0, h1Pred = 0;
      let qTarget = 0, qPipe = 0, qPred = 0, lyQ = 0;
      
      const lyQMonths = qMonths.map(mo => `${parseInt(mo.slice(0, 4)) - 1}-${mo.slice(5, 7)}`);
      
      const monthlyData: Record<string, any> = {};
      NEAR.forEach((mo: string) => { monthlyData[mo] = { t: 0, p: 0, pr: 0 }; });
      
      const hubData: Record<string, { t: number, p: number }> = {};
      const hubs = Object.keys(md.owner_clients || {});
      hubs.forEach(hub => { hubData[hub] = { t: 0, p: 0 }; });

      if (!isMyClients) {
        NEAR.forEach((mo: string) => {
          const r = md.pred_rows?.[mo] || {};
          h1Target += (r.tv || 0); h1Pipe += (r.pv || 0); h1Pred += (r.pred || 0);
          monthlyData[mo].t += (r.tv || 0); monthlyData[mo].p += (r.pv || 0); monthlyData[mo].pr += (r.pred || 0);
          if (qMonths.includes(mo)) {
            qTarget += (r.tv || 0); qPipe += (r.pv || 0); qPred += (r.pred || 0);
          }
        });
        lyQMonths.forEach(mo => { lyQ += (md.monthly?.[mo]?.w || 0) * 1000; });
        
        hubs.forEach(hub => {
          const clients = md.owner_clients[hub] || [];
          clients.forEach((cl: string) => {
            NEAR.forEach((mo: string) => {
              const t = ((md.targets_full?.[hub]?.[cl]?.[mo]?.t || 0) * 1000);
              const p = ((md.targets_full?.[hub]?.[cl]?.[mo]?.p || 0) * 1000);
              hubData[hub].t += t; hubData[hub].p += p;
            });
          });
        });
      } else {
        hubs.forEach(hub => {
          const clients = md.owner_clients[hub] || [];
          clients.forEach((cl: string) => {
            if (targetClients.includes(cl)) {
              NEAR.forEach((mo: string) => {
                const t = ((md.targets_full?.[hub]?.[cl]?.[mo]?.t || 0) * 1000);
                const p = ((md.targets_full?.[hub]?.[cl]?.[mo]?.p || 0) * 1000);
                const pr = (md.client_pred?.[cl]?.[mo] || 0);
                h1Target += t; h1Pipe += p; h1Pred += pr;
                monthlyData[mo].t += t; monthlyData[mo].p += p; monthlyData[mo].pr += pr;
                hubData[hub].t += t; hubData[hub].p += p;
                if (qMonths.includes(mo)) { qTarget += t; qPipe += p; qPred += pr; }
              });
            }
          });
        });
      }
      
      return { 
        h1Target, h1Pipe, h1Pred, qTarget, qPipe, qPred, fx,
        h1TargetGBP: h1Target / fx, h1PipeGBP: h1Pipe / fx, h1PredGBP: h1Pred / fx,
        qTargetGBP: qTarget / fx, qPipeGBP: qPipe / fx, qPredGBP: qPred / fx,
        lyQ, lyQGBP: lyQ / fx,
        monthlyData, hubData,
        lyH1: (md.ly_h1 || 0) * 1000,
        lyH1GBP: ((md.ly_h1 || 0) * 1000) / fx,
        stats: md.stats || {}
      };
    };

    const usM = getMarketMetrics("us");
    const ukM = getMarketMetrics("uk");

    const groupHubData: Record<string, { t: number, p: number }> = {};
    Object.entries(usM.hubData).forEach(([h, v]: any) => { groupHubData[h] = { t: v.t / usM.fx, p: v.p / usM.fx }; });
    Object.entries(ukM.hubData).forEach(([h, v]: any) => { groupHubData[h] = { t: v.t, p: v.p }; });

    const group = {
      h1Target: usM.h1TargetGBP + ukM.h1TargetGBP,
      h1Pipe: usM.h1PipeGBP + ukM.h1PipeGBP,
      h1Pred: usM.h1PredGBP + ukM.h1PredGBP,
      qTarget: usM.qTargetGBP + ukM.qTargetGBP,
      qPipe: usM.qPipeGBP + ukM.qPipeGBP,
      qPred: usM.qPredGBP + ukM.qPredGBP,
      lyH1: usM.lyH1GBP + ukM.lyH1GBP,
      lyQ: usM.lyQGBP + ukM.lyQGBP,
      hubData: groupHubData
    };
    
    // Monthly tracking rows
    const groupMonthly = NEAR.map((mo: string) => {
      const usMth = usM.monthlyData[mo];
      const ukMth = ukM.monthlyData[mo];
      return {
        mo, name: monthName(mo), isActual: AS_OF ? mo < AS_OF : false,
        target: (usMth.t / usM.fx) + ukMth.t,
        usPipeGBP: usMth.p / usM.fx,
        ukPipe: ukMth.p,
        total: (usMth.p / usM.fx) + ukMth.p,
        pred: (usMth.pr / usM.fx) + ukMth.pr,
      };
    });

    const getMarketMonthly = (md: any) => NEAR.map((mo: string) => ({
      mo, name: monthName(mo), isActual: AS_OF ? mo < AS_OF : false,
      target: md.monthlyData[mo].t, pipe: md.monthlyData[mo].p, pred: md.monthlyData[mo].pr,
    }));
    usM.monthly = getMarketMonthly(usM);
    ukM.monthly = getMarketMonthly(ukM);

    let myClientsMetrics: any = null;
    if (isMyClients) {
       // Combine usM and ukM into a single GBP-based metric object
       const h1Target = usM.h1TargetGBP + ukM.h1TargetGBP;
       const h1Pipe = usM.h1PipeGBP + ukM.h1PipeGBP;
       const h1Pred = usM.h1PredGBP + ukM.h1PredGBP;
       const qTarget = usM.qTargetGBP + ukM.qTargetGBP;
       const qPipe = usM.qPipeGBP + ukM.qPipeGBP;
       const qPred = usM.qPredGBP + ukM.qPredGBP;
       const lyH1 = usM.lyH1GBP + ukM.lyH1GBP;
       const lyQ = usM.lyQGBP + ukM.lyQGBP;
       
       const hubData: Record<string, { t: number, p: number }> = {};
       Object.entries(usM.hubData).forEach(([h, v]: any) => { hubData[h] = { t: v.t / mx.FX, p: v.p / mx.FX }; });
       Object.entries(ukM.hubData).forEach(([h, v]: any) => { hubData[h] = { t: v.t, p: v.p }; });
       
       const monthly = NEAR.map((mo: string) => {
          const uM = usM.monthlyData[mo];
          const kM = ukM.monthlyData[mo];
          return {
            mo, name: monthName(mo), isActual: AS_OF ? mo < AS_OF : false,
            target: (uM.t / mx.FX) + kM.t, pipe: (uM.p / mx.FX) + kM.p, pred: (uM.pr / mx.FX) + kM.pr
          };
       });
       
       let open_n = 0, open_gp = 0, total_won = 0, total_pitched = 0;
       targetClients.forEach(c => {
         const md = Object.values(us.owner_clients || {}).flat().includes(c) ? us : uk;
         const isUS = md === us;
         const fx = isUS ? mx.FX : 1;
         const hist = md.client_hist?.[c] || {};
         total_won += (hist.won || 0);
         total_pitched += ((hist.won || 0) + (hist.lost || 0));
         
         const opps = md.opps?.[c] || [];
         opps.forEach((o: any) => {
           if (!o.stage.includes('Closed') && !o.stage.includes('Lost')) {
             open_n++;
             open_gp += (o.gp || 0) / fx;
           }
         });
       });
       
       myClientsMetrics = {
         h1Target, h1Pipe, h1Pred, qTarget, qPipe, qPred, lyH1, lyQ,
         hubData, monthly,
         stats: {
           win_rate: total_pitched > 0 ? Math.round((total_won / total_pitched) * 100) : 0,
           total_won, total_pitched,
           open_n, open_gp: open_gp / 1000,
           total_clients: targetClients.length
         }
       };
    }

    return { us: usM, uk: ukM, group, qLabel, qMonths, NEAR, groupMonthly, AS_OF, myClientsMetrics, targetClients };
  }, [data, viewMode, clientTab, appUser]);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!m) return null;

  const isMyClients = viewMode === "my_clients";
  let disp: any = {};
  if (isMyClients) {
    disp = { ...m.myClientsMetrics, fmt: fL, isGroup: false };
  } else if (marketTab === "group") {
    disp = { ...m.group, fmt: fL, isGroup: true };
  } else if (marketTab === "us") {
    disp = { ...m.us, qTarget: m.us.qTarget, qPipe: m.us.qPipe, qPred: m.us.qPred, h1Target: m.us.h1Target, h1Pipe: m.us.h1Pipe, h1Pred: m.us.h1Pred, fmt: f$, isGroup: false };
  } else {
    disp = { ...m.uk, qTarget: m.uk.qTarget, qPipe: m.uk.qPipe, qPred: m.uk.qPred, h1Target: m.uk.h1Target, h1Pipe: m.uk.h1Pipe, h1Pred: m.uk.h1Pred, fmt: fL, isGroup: false };
  }

  const usPct = m.group.h1Pipe > 0 ? (m.us.h1PipeGBP / m.group.h1Pipe) * 100 : 0;
  const ukPct = m.group.h1Pipe > 0 ? (m.uk.h1PipeGBP / m.group.h1Pipe) * 100 : 0;
  const chartData = [
    { name: "Target", US: Math.round(m.us.h1TargetGBP), UK: Math.round(m.uk.h1TargetGBP) },
    { name: "Pipeline", US: Math.round(m.us.h1PipeGBP), UK: Math.round(m.uk.h1PipeGBP) }
  ];

  return (
    <div className="p-8 h-screen flex flex-col overflow-auto bg-[#faf8f5]">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1a1a1a] tracking-tight">Revenue Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Live metrics and expected landings.</p>
        </div>
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => { if(v){ setViewMode(v); if(v==='group') setMarketTab("group"); else setClientTab("all"); } }} className="bg-white border rounded-md p-1 shadow-sm">
          <ToggleGroupItem value="group" className="text-sm px-4 h-8 text-stone-600 data-[state=on]:bg-primary data-[state=on]:text-black">Group</ToggleGroupItem>
          <ToggleGroupItem value="my_clients" className="text-sm px-4 h-8 text-stone-600 data-[state=on]:bg-primary data-[state=on]:text-black">My Clients</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Tabs value={isMyClients ? clientTab : marketTab} onValueChange={isMyClients ? setClientTab : setMarketTab} className="space-y-6">
        <TabsList className="shadow-sm shrink-0 flex flex-wrap h-auto justify-start w-full">
          {isMyClients ? (
            <>
              <TabsTrigger value="all">All</TabsTrigger>
              {(appUser?.allocatedClients || []).map((c: string) => (
                <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
              ))}
            </>
          ) : (
            <>
              <TabsTrigger value="group">Group Overview</TabsTrigger>
              <TabsTrigger value="us">United States</TabsTrigger>
              <TabsTrigger value="uk">United Kingdom</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={isMyClients ? clientTab : marketTab} className="space-y-8 mt-0 focus-visible:outline-none focus-visible:ring-0 pb-16">
          
            <>
              <div className={cn("grid gap-8", isMyClients ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
                <div className="flex flex-col gap-8">
                  <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-pink" /> Current Quarter ({m.qLabel})
              </h2>
              <div className={cn("grid gap-4", !isMyClients ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 xl:grid-cols-3")}>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider">Target</CardDescription>
                    <CardTitle className="text-2xl font-display">{disp.fmt(disp.qTarget)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider">Pipeline</CardDescription>
                    <CardTitle className="text-2xl font-display">{disp.fmt(disp.qPipe)}</CardTitle>
                    <div className={cn("absolute bottom-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", pct(disp.qPipe, disp.qTarget) >= 100 ? "bg-green-100 text-green-700" : pct(disp.qPipe, disp.qTarget) >= 75 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {pct(disp.qPipe, disp.qTarget)}% cov
                    </div>
                  </CardHeader>
                </Card>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider text-black">Landing</CardDescription>
                    <CardTitle className="text-2xl font-display text-black">{disp.fmt(disp.qPred)}</CardTitle>
                    <div className={cn("absolute bottom-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide", disp.qPred - disp.qTarget >= 0 ? "bg-green-100 text-green-700" : (disp.qPred - disp.qTarget) / (disp.qTarget || 1) >= -0.1 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {disp.qPred - disp.qTarget > 0 ? "+" : ""}{disp.fmt(disp.qPred - disp.qTarget)}
                    </div>
                  </CardHeader>
                </Card>
                {!isMyClients && (
                  <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white opacity-80">
                    <CardHeader className="pb-2 p-4">
                      <CardDescription className="font-medium text-xs uppercase tracking-wider">LY {m.qLabel} Actuals</CardDescription>
                      <CardTitle className="text-2xl font-display">{disp.fmt(disp.lyQ)}</CardTitle>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BarChart className="w-4 h-4 text-brand-pink" /> Current Half (H1)
              </h2>
              <div className={cn("grid gap-4", !isMyClients ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 xl:grid-cols-3")}>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider">Target</CardDescription>
                    <CardTitle className="text-2xl font-display">{disp.fmt(disp.h1Target)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider">Pipeline</CardDescription>
                    <CardTitle className="text-2xl font-display">{disp.fmt(disp.h1Pipe)}</CardTitle>
                    <div className={cn("absolute bottom-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", pct(disp.h1Pipe, disp.h1Target) >= 100 ? "bg-green-100 text-green-700" : pct(disp.h1Pipe, disp.h1Target) >= 75 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {pct(disp.h1Pipe, disp.h1Target)}% cov
                    </div>
                  </CardHeader>
                </Card>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider text-black">Landing</CardDescription>
                    <CardTitle className="text-2xl font-display text-black">{disp.fmt(disp.h1Pred)}</CardTitle>
                    <div className={cn("absolute bottom-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide", disp.h1Pred - disp.h1Target >= 0 ? "bg-green-100 text-green-700" : (disp.h1Pred - disp.h1Target) / (disp.h1Target || 1) >= -0.1 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {disp.h1Pred - disp.h1Target > 0 ? "+" : ""}{disp.fmt(disp.h1Pred - disp.h1Target)}
                    </div>
                  </CardHeader>
                </Card>
                {!isMyClients && (
                  <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white opacity-80">
                    <CardHeader className="pb-2 p-4">
                      <CardDescription className="font-medium text-xs uppercase tracking-wider">LY H1 Actuals</CardDescription>
                      <CardTitle className="text-2xl font-display">{disp.fmt(disp.lyH1)}</CardTitle>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </section>
            
            {!disp.isGroup && disp.stats && (
              <section className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider">Win Rate</CardDescription>
                    <CardTitle className="text-2xl font-display">{disp.stats.win_rate || 0}%</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {disp.stats.total_won || 0}W / {disp.stats.total_pitched || 0} pitched
                    </div>
                  </CardHeader>
                </Card>
                {disp.stats.median_gp !== null && disp.stats.median_gp !== undefined && (
                  <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
                    <CardHeader className="pb-2 p-4">
                      <CardDescription className="font-medium text-xs uppercase tracking-wider">Median Deal GP</CardDescription>
                      <CardTitle className="text-2xl font-display">{disp.fmt(disp.stats.median_gp || 0)}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">all-time</div>
                    </CardHeader>
                  </Card>
                )}
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
                  <CardHeader className="pb-2 p-4">
                    <CardDescription className="font-medium text-xs uppercase tracking-wider">Open Pipeline</CardDescription>
                    <CardTitle className="text-2xl font-display">{disp.fmt((disp.stats.open_gp || 0) * 1000)}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">de-risked · {disp.stats.open_n || 0} opps</div>
                  </CardHeader>
                </Card>
              </section>
            )}
          </div>
          
          {isMyClients && (
            <div className="flex flex-col">
              <PrioritiesWidget />
            </div>
          )}
        </div>

          {disp.isGroup ? (
            <>
              <section className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                      <div>
                        <CardDescription className="font-medium text-xs uppercase tracking-wider text-black">United States</CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <div><div className="text-[10px] text-muted-foreground uppercase">Target</div><div className="font-display text-lg">{f$(m.us.h1Target)}</div></div>
                          <div><div className="text-[10px] text-muted-foreground uppercase">Pipeline</div><div className="font-display text-lg">{f$(m.us.h1Pipe)}</div></div>
                          <div><div className="text-[10px] text-muted-foreground uppercase">Predicted</div><div className="font-display text-lg">{f$(m.us.h1Pred)}</div></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-display" style={{ color: '#2563eb' }}>{pct(m.us.h1Pipe, m.us.h1Target)}%</div>
                        <div className="text-xs text-muted-foreground">coverage</div>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                      <div>
                        <CardDescription className="font-medium text-xs uppercase tracking-wider text-black">United Kingdom (Converted)</CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <div><div className="text-[10px] text-muted-foreground uppercase">Target</div><div className="font-display text-lg">{fL(m.uk.h1Target)}</div></div>
                          <div><div className="text-[10px] text-muted-foreground uppercase">Pipeline</div><div className="font-display text-lg">{fL(m.uk.h1Pipe)}</div></div>
                          <div><div className="text-[10px] text-muted-foreground uppercase">Predicted</div><div className="font-display text-lg">{fL(m.uk.h1Pred)}</div></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-display" style={{ color: '#16a34a' }}>{pct(m.uk.h1Pipe, m.uk.h1Target)}%</div>
                        <div className="text-xs text-muted-foreground">coverage</div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
                
                <div className="bg-white p-3 rounded-lg shadow-sm ring-1 ring-black/5 text-xs text-muted-foreground flex flex-col gap-2">
                  <div className="flex justify-between w-full"><span>H1 Pipeline Split</span><span>{Math.round(usPct)}% US · {Math.round(ukPct)}% UK</span></div>
                  <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
                    <div style={{ width: `${usPct}%`, backgroundColor: '#2563eb' }} />
                    <div style={{ width: `${ukPct}%`, backgroundColor: '#16a34a' }} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly Tracking — Group Total</h2>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white overflow-hidden">
                  <Table className="text-sm">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[120px]">Month</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right text-blue-600">US Pipe (GBP)</TableHead>
                        <TableHead className="text-right text-green-600">UK Pipe</TableHead>
                        <TableHead className="text-right">Group Total</TableHead>
                        <TableHead className="text-right">Predicted</TableHead>
                        <TableHead className="text-right">vs Target</TableHead>
                        <TableHead className="text-right w-[100px]">Coverage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {m.groupMonthly.map((r, i) => {
                        const vs = (r.isActual ? r.total : r.pred) - r.target;
                        const c = pct(r.total, r.target);
                        return (
                          <TableRow key={r.mo} className={r.isActual ? "opacity-70 bg-muted/10" : ""}>
                            <TableCell className="font-medium">{r.name} {r.isActual && <span className="text-xs font-normal text-muted-foreground ml-1">actual</span>}</TableCell>
                            <TableCell className="text-right">{fL(r.target)}</TableCell>
                            <TableCell className="text-right text-blue-600">{fL(r.usPipeGBP)}</TableCell>
                            <TableCell className="text-right text-green-600">{fL(r.ukPipe)}</TableCell>
                            <TableCell className="text-right font-medium">{fL(r.total)}</TableCell>
                            <TableCell className="text-right">{r.isActual ? '—' : fL(r.pred)}</TableCell>
                            <TableCell className="text-right" style={{ color: vs >= 0 ? 'var(--grn)' : 'var(--red)' }}>{vs >= 0 ? '+' : ''}{fL(vs)}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: c >= 100 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: c >= 100 ? '#16a34a' : '#dc2626' }}>{c}%</span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/30 font-semibold border-t-2">
                        <TableCell>H1 Total</TableCell>
                        <TableCell className="text-right">{fL(m.group.h1Target)}</TableCell>
                        <TableCell className="text-right text-blue-600">{fL(m.us.h1PipeGBP)}</TableCell>
                        <TableCell className="text-right text-green-600">{fL(m.uk.h1PipeGBP)}</TableCell>
                        <TableCell className="text-right">{fL(m.group.h1Pipe)}</TableCell>
                        <TableCell className="text-right">{fL(m.group.h1Pred)}</TableCell>
                        <TableCell className="text-right" style={{ color: (m.group.h1Pred - m.group.h1Target) >= 0 ? 'var(--grn)' : 'var(--red)' }}>{fL(m.group.h1Pred - m.group.h1Target)}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: pct(m.group.h1Pipe, m.group.h1Target) >= 100 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: pct(m.group.h1Pipe, m.group.h1Target) >= 100 ? '#16a34a' : '#dc2626' }}>
                            {pct(m.group.h1Pipe, m.group.h1Target)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly Tracking</h2>
                <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white overflow-hidden">
                  <Table className="text-sm">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[120px]">Month</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actuals / Pipeline</TableHead>
                        <TableHead className="text-right">Predicted</TableHead>
                        <TableHead className="text-right">Vs Budget</TableHead>
                        <TableHead className="text-right w-[100px]">Coverage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disp.monthly.map((r: any) => {
                        const vs = (r.isActual ? r.pipe : r.pred) - r.target;
                        const c = pct(r.pipe, r.target);
                        return (
                          <TableRow key={r.mo} className={r.isActual ? "opacity-70 bg-muted/10" : ""}>
                            <TableCell className="font-medium">{r.name} {r.isActual && <span className="text-xs font-normal text-muted-foreground ml-1">actual</span>}</TableCell>
                            <TableCell className="text-right">{disp.fmt(r.target)}</TableCell>
                            <TableCell className="text-right font-medium text-muted-foreground">{disp.fmt(r.pipe)}</TableCell>
                            <TableCell className="text-right">{r.isActual ? '—' : disp.fmt(r.pred)}</TableCell>
                            <TableCell className="text-right" style={{ color: vs >= 0 ? 'var(--grn)' : 'var(--red)' }}>{vs >= 0 ? '+' : ''}{disp.fmt(vs)}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: c >= 100 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: c >= 100 ? '#16a34a' : '#dc2626' }}>{c}%</span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/30 font-semibold border-t-2">
                        <TableCell>H1 Total</TableCell>
                        <TableCell className="text-right">{disp.fmt(disp.h1Target)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{disp.fmt(disp.h1Pipe)}</TableCell>
                        <TableCell className="text-right">{disp.fmt(disp.h1Pred)}</TableCell>
                        <TableCell className="text-right" style={{ color: (disp.h1Pred - disp.h1Target) >= 0 ? 'var(--grn)' : 'var(--red)' }}>{disp.fmt(disp.h1Pred - disp.h1Target)}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: pct(disp.h1Pipe, disp.h1Target) >= 100 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: pct(disp.h1Pipe, disp.h1Target) >= 100 ? '#16a34a' : '#dc2626' }}>
                            {pct(disp.h1Pipe, disp.h1Target)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
              </section>
            </>
          )}
          {isMyClients && clientTab !== "all" && (
            <KpiExplorerWidget legacy={legacy} clientName={clientTab} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hub Breakdown</h2>
              <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white overflow-hidden">
                <Table className="text-sm">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Hub</TableHead>
                      <TableHead className="text-right">H1 Target</TableHead>
                      <TableHead className="text-right">H1 Pipeline</TableHead>
                      <TableHead className="text-right">Coverage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(disp.hubData).sort((a: any, b: any) => b[1].p - a[1].p).map(([hub, vals]: [string, any]) => {
                      if (vals.t === 0 && vals.p === 0) return null;
                      const c = pct(vals.p, vals.t);
                      return (
                        <TableRow key={hub}>
                          <TableCell className="font-medium"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-2"></span>{hub}</TableCell>
                          <TableCell className="text-right">{disp.fmt(vals.t)}</TableCell>
                          <TableCell className="text-right">{disp.fmt(vals.p)}</TableCell>
                          <TableCell className="text-right">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: c >= 100 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: c >= 100 ? '#16a34a' : '#dc2626' }}>{c}%</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BarChart className="w-4 h-4 text-brand-pink" /> Pipeline By Hub
              </h2>
              <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white p-6 pt-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={Object.entries(disp.hubData).filter(([,v]:any) => v.t > 0 || v.p > 0).map(([k,v]:any) => ({ name: k.replace(' US', '').replace(' Europe', ''), Pipeline: Math.round(v.p) }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                    <YAxis tickFormatter={(v) => `${marketTab === "us" ? "$" : "£"}${v/1000}k`} stroke="#9ca3af" fontSize={12} width={60} />
                    <Tooltip formatter={(value: number) => [`${marketTab === "us" ? "$" : "£"}${value.toLocaleString()}`, 'Pipeline']} />
                    <Bar dataKey="Pipeline" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Card>
            </section>
          </div>

          {isMyClients && <TimesheetsWidget targetClients={m.targetClients} />}
            </>
        </TabsContent>
      </Tabs>
    </div>
  );
}
