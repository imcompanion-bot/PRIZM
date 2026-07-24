import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  TrendingUp, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Loader2, 
  Users, 
  DollarSign, 
  ArrowUpRight,
  ArrowRight
} from "lucide-react";
import { formatCurrency, calculateInternalCostPerHour } from "@/lib/calculations";
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
  people
}: MarginSentryWidgetProps) => {
  const [sentryStatus, setSentryStatus] = useState<"live" | "stopped" | "failed">("live");
  const [loading, setLoading] = useState(true);

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

  // Calculations for Margin Sentry
  const metrics = useMemo(() => {
    const today = new Date();
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);

    // Timeline calculation
    const totalDays = differenceInDays(end, start);
    const elapsedDays = Math.max(0, differenceInDays(today < start ? start : today > end ? end : today, start));
    const timelineElapsedPct = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

    // Cost Burn calculations
    const costBurnPct = budgetedInternalCost > 0 ? (totalActualCost / budgetedInternalCost) * 100 : 0;

    // Seniority Mix calculations
    const budgetedAvgRate = totalScopedHours > 0 ? budgetedInternalCost / totalScopedHours : 0;
    const actualAvgRate = totalActualHours > 0 ? totalActualCost / totalActualHours : 0;
    const rateIncreasePct = budgetedAvgRate > 0 ? ((actualAvgRate - budgetedAvgRate) / budgetedAvgRate) * 100 : 0;

    // Velocity Anomaly Trigger: Cost Burn substantially outpaces Timeline Elapsed
    const velocityCreepGap = costBurnPct - timelineElapsedPct;
    const hasVelocityAnomaly = velocityCreepGap > 25 && costBurnPct > 50;

    // Seniority Imbalance Trigger: Actual rate is higher than scoped by 10%+
    const hasSeniorityImbalance = rateIncreasePct >= 10 && totalActualHours > 10;

    return {
      timelineElapsedPct: Math.round(timelineElapsedPct),
      costBurnPct: Math.round(costBurnPct),
      budgetedAvgRate,
      actualAvgRate,
      rateIncreasePct: Math.round(rateIncreasePct),
      velocityCreepGap: Math.round(velocityCreepGap),
      hasVelocityAnomaly,
      hasSeniorityImbalance
    };
  }, [totalScopedHours, totalActualHours, totalActualCost, budgetedInternalCost, projectStartDate, projectEndDate]);

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
                Margin Sentry CoPilot
              </CardTitle>
              <CardDescription className="text-xs">
                Active gross margin and scoping integrity guardian
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            LIVE GUARD
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Alerts Section */}
        {metrics.hasVelocityAnomaly || metrics.hasSeniorityImbalance ? (
          <div className="space-y-3">
            {metrics.hasVelocityAnomaly && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-700">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">Velocity Burn Anomaly</h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Delivery cost burn is currently running at <strong>{metrics.costBurnPct}%</strong>, outpacing elapsed project schedule (<strong>{metrics.timelineElapsedPct}%</strong>) by <strong>{metrics.velocityCreepGap}%</strong>.
                  </p>
                  <p className="text-[10px] text-red-600 font-medium pt-1">
                    👉 CFO RECOMMENDATION: Immediately re-verify active deliverable priorities or scale down high-cost task scoping.
                  </p>
                </div>
              </div>
            )}

            {metrics.hasSeniorityImbalance && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-700">
                <Users className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Seniority Mix Inflation</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    The average actual delivery cost rate is <strong>{formatCurrency(metrics.actualAvgRate, activeCurrency)}/hr</strong>, which is <strong>{metrics.rateIncreasePct}% higher</strong> than the budgeted average of <strong>{formatCurrency(metrics.budgetedAvgRate, activeCurrency)}/hr</strong>.
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium pt-1">
                    👉 CFO RECOMMENDATION: Rebalance the active staffing mix; delegate execution tasks to junior/mid resource allocations.
                  </p>
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
              className={`h-1.5 bg-gray-100 [&>div]:bg-[${metrics.hasVelocityAnomaly ? "#ef4444" : "#4b70d8"}]`} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
