import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, CheckCircle2, MessageSquare, Save, X, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function WipTrackerPage() {
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOffice, setSelectedOffice] = useState<string>("All Offices");
  const [selectedClient, setSelectedClient] = useState<string>("All Clients");
  const [dismissDialog, setDismissDialog] = useState<{ project: any } | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [actionType, setActionType] = useState<"snooze" | "dismiss">("dismiss");
  const [isDismissedOpen, setIsDismissedOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);

  React.useEffect(() => {
    if (dismissDialog) {
      const flags = dismissDialog.project.flags || [];
      setSelectedFlags(flags.length === 1 ? [...flags] : []);
      setDismissReason("");
      setActionType("dismiss");
    }
  }, [dismissDialog]);


  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["wip_tracker_projects"],
    queryFn: async () => {
      const allData: any[] = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, stage, office, start_date, end_date, revenue, budget_cost, media_cost, gp_full_value, opportunity_number, last_fee_calc_url, ultimate_parent, extra_data, opportunity_record_type")
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

  const { data: reviews = [] } = useQuery({
    queryKey: ["wip_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_wip_reviews").select("*");
      if (error) throw error;
      return data || [];
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ projectId, reason, flags, type, existingReview }: { projectId: string, reason: string, flags: string[], type: "snooze" | "dismiss", existingReview: any }) => {
      let existingFlags: string[] = [];
      if (existingReview && existingReview.dismissal_reason) {
        try {
          const parsed = JSON.parse(existingReview.dismissal_reason);
          if (parsed.flags) existingFlags = parsed.flags;
        } catch (e) {
          // legacy
        }
      }
      
      const mergedFlags = Array.from(new Set([...existingFlags, ...flags]));
      
      const payload: any = { type, flags: mergedFlags };
      if (type === "snooze") {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        payload.until = nextWeek.toISOString();
      } else {
        payload.reason = reason;
      }

      const { error } = await supabase.from("project_wip_reviews").upsert({
        project_id: projectId,
        dismissed_by: appUser?.name || appUser?.email || "Unknown User",
        dismissed_at: new Date().toISOString(),
        dismissal_reason: JSON.stringify(payload)
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wip_reviews"] });
      toast.success("Flag dismissed successfully");
      setDismissDialog(null);
      setDismissReason("");
    },
    onError: (err) => {
      toast.error(`Failed to dismiss: ${err.message}`);
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("project_wip_reviews").delete().eq("project_id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wip_reviews"] });
      toast.success("Project flags restored");
    }
  });

  const formatCurrency = (amount: number | null | undefined, currency: string) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(amount);
  };

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return "-";
    const s = start ? format(parseISO(start), 'd MMM yyyy') : "?";
    const e = end ? format(parseISO(end), 'd MMM yyyy') : "?";
    return `${s} - ${e}`;
  };

  const flaggedProjects = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const result = projects.map(p => {
      const flags: string[] = [];
      const recType = (p.opportunity_record_type || "").trim();
      const isTalentSavings = recType === 'Agency - Talent Savings';
      const isPassthrough = recType === 'Agency - Passthrough Costs';
      const isRTB = recType === 'Agency - RTB';
      const isHoldingPot = recType === 'Agency - Holding Pot';
      
      if (isHoldingPot) {
        if (p.start_date || p.end_date) {
          flags.push("Holding Pots should not have project dates");
        }
      } else {
        // Intelligence: Record Type Check
        const titleLower = (p.title || "").toLowerCase();
        let suggestsPassthrough = false;
        
        const margin = p.revenue && p.revenue > 0 ? (p.gp_full_value || 0) / p.revenue : null;
        
        if (titleLower.includes("creator cost") || titleLower.includes("influencer cost") || titleLower.includes("talent cost") || titleLower.includes("passthrough") || (margin !== null && margin <= 0.05)) {
          suggestsPassthrough = true;
          if (!isPassthrough) flags.push(`Title/Margin suggests Passthrough Cost but record type is '${recType}'`);
        } else if (titleLower.includes("rfi") || titleLower.includes("rfp")) {
          if (recType !== 'Agency - RFI / RFP' && recType !== 'Agency - RFP / RFI') flags.push(`Title suggests RFI/RFP but record type is '${recType}'`);
        } else if (titleLower.includes("saving") || titleLower.includes("efficienc")) {
          if (!isTalentSavings) flags.push(`Title suggests Talent Savings but record type is '${recType}'`);
        }

        // 1. Start Date in past (> 2 weeks ago) but not committed/won
        const twoWeeksAgoStr = format(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        if (p.start_date && p.start_date < twoWeeksAgoStr && p.stage !== 'Committed' && p.stage !== 'Closed Won') {
          flags.push("Start date passed > 2 weeks but not Committed/Won");
        }

        // 2. Margin out of bounds based on record type
        if (margin !== null && !suggestsPassthrough) {
          if (isTalentSavings || isRTB) {
            if (margin < 1.0) {
              flags.push(`Margin out of bounds (${(margin * 100).toFixed(1)}% < 100%)`);
            }
          } else if (isPassthrough) {
            if (margin > 0.0) {
              flags.push(`Passthrough Costs should have 0% margin (currently ${(margin * 100).toFixed(1)}%). Consider changing record type to Production or Execution.`);
            }
          } else {
            // Standard bounds
            if (margin > 0.60 || margin < 0.20) {
              flags.push(`Margin out of bounds (${(margin * 100).toFixed(1)}%)`);
            }
          }
        }

        // 3. Missing data
        const missing = [];
        if (!p.start_date) missing.push("Project Start Date");
        if (!p.end_date) missing.push("Project End Date");
        if (!isTalentSavings && !isPassthrough) {
          if (!p.extra_data?.rtb_start_date) missing.push("RTB Start Date");
          if (!p.extra_data?.rtb_end_date) missing.push("RTB End Date");
        }
        if (p.revenue === null || p.revenue === undefined) missing.push("Total Price");
        if (p.extra_data?.project_currency_gross_budget === null || p.extra_data?.project_currency_gross_budget === undefined) missing.push("Cost - Gross Budget");
        if (p.budget_cost === null || p.budget_cost === undefined) missing.push("Cost - Net Budget");
        
        if (missing.length > 0) {
          flags.push(`Missing data: ${missing.join(", ")}`);
        }

        // 4. Missing link
        if (!isTalentSavings && !isPassthrough) {
          if ((p.stage === 'Committed' || p.stage === 'Closed Won') && !p.last_fee_calc_url) {
            flags.push("Missing Fee Calculator link");
          }
        }
      }

      const review = reviews.find((r: any) => r.project_id === p.id);
      let activeFlagsList = [...flags];

      if (review) {
        try {
          const parsed = JSON.parse(review.dismissal_reason || "{}");
          if (parsed.flags && Array.isArray(parsed.flags)) {
            if (parsed.type === "snooze" && parsed.until && new Date() < new Date(parsed.until)) {
              activeFlagsList = activeFlagsList.filter(f => !parsed.flags.includes(f));
            } else if (parsed.type === "dismiss") {
              activeFlagsList = activeFlagsList.filter(f => !parsed.flags.includes(f));
            }
          } else {
            activeFlagsList = [];
          }
        } catch (e) {
          activeFlagsList = [];
        }
      }

      return {
        ...p,
        flags: activeFlagsList,
        allFlags: flags,
        review
      };
    }).filter(p => p.flags.length > 0 || p.review);

    return result;
  }, [projects, reviews]);

  const offices = useMemo(() => {
    const set = new Set<string>();
    set.add("Creator Authority");
    projects.forEach(p => p.office && set.add(p.office));
    return ["All Offices", ...Array.from(set).sort()];
  }, [projects]);

  const clientCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const today = new Date();
    const cutoffStr = format(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    let totalCount = 0;

    flaggedProjects.forEach(p => {
      // Only include clients if they have a project ending within the last month or later
      if (p.end_date && p.end_date >= cutoffStr) {
        if (selectedOffice === "All Offices" || p.office === selectedOffice) {
          const client = p.ultimate_parent || p.title;
          if (client) {
            counts.set(client, (counts.get(client) || 0) + 1);
            totalCount++;
          }
        }
      }
    });

    const sortedClients = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    return [{ name: "All Clients", count: totalCount }, ...sortedClients];
  }, [flaggedProjects, selectedOffice]);

  const filteredProjects = useMemo(() => {
    const today = new Date();
    const cutoffStr = format(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    return flaggedProjects.filter(p => {
      // Don't show projects that ended more than a month ago in the main list
      if (!p.end_date || p.end_date < cutoffStr) return false;

      const pClient = p.ultimate_parent || p.title || "";
      if (selectedOffice !== "All Offices" && p.office !== selectedOffice) return false;
      if (selectedClient !== "All Clients" && pClient !== selectedClient) return false;
      return true;
    });
  }, [flaggedProjects, selectedOffice, selectedClient]);

  const activeFlags = useMemo(() => filteredProjects.filter(p => p.flags.length > 0), [filteredProjects]);
  const dismissedFlags = useMemo(() => filteredProjects.filter(p => p.review && p.allFlags?.length > p.flags.length), [filteredProjects]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WIP Tracker</h1>
          <p className="text-muted-foreground mt-2">Flagging projects that require financial review or missing data</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedOffice} onValueChange={setSelectedOffice}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Office" />
            </SelectTrigger>
            <SelectContent>
              {offices.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select Client" />
            </SelectTrigger>
            <SelectContent>
              {clientCounts.map(c => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name} {c.name !== "All Clients" && `(${c.count})`}
                  {c.name === "All Clients" && `(${c.count} total)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            Action Required ({activeFlags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Project</TableHead>
                  <TableHead>Key Info</TableHead>
                  <TableHead className="w-[400px]">Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading projects...</TableCell></TableRow>
                ) : activeFlags.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No projects require action.</TableCell></TableRow>
                ) : (
                  activeFlags.map((p) => {
                    const currency = p.extra_data?.project_currency || "GBP";
                    const isGBP = currency === "GBP";
                    
                    const projCurrencyRevenue = p.extra_data?.project_currency_revenue || p.revenue;
                    const exchangeRate = (!isGBP && p.extra_data?.project_currency_revenue && p.revenue) ? (p.extra_data.project_currency_revenue / p.revenue) : 1;
                    const grossProfit = (p.gp_full_value !== null && p.gp_full_value !== undefined)
                      ? p.gp_full_value * exchangeRate
                      : null;
                    const margin = p.revenue && p.revenue > 0 ? (p.gp_full_value || 0) / p.revenue : null;

                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-medium text-sm leading-tight text-slate-800">{p.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{p.ultimate_parent} • {p.office}</div>
                          <div className="text-xs text-muted-foreground">{p.stage}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div><span className="text-muted-foreground inline-block w-24">RTB Dates:</span> <span>{formatDateRange(p.extra_data?.rtb_start_date, p.extra_data?.rtb_end_date)}</span></div>
                            <div><span className="text-muted-foreground inline-block w-24">Project Dates:</span> <span>{formatDateRange(p.start_date, p.end_date)}</span></div>
                            <div><span className="text-muted-foreground inline-block w-24">Price:</span> <span className="font-medium">{formatCurrency(projCurrencyRevenue, currency)}</span></div>
                            <div><span className="text-muted-foreground inline-block w-24">Gross Profit:</span> <span>{formatCurrency(grossProfit, currency)}</span></div>
                            <div><span className="text-muted-foreground inline-block w-24">GP Margin:</span> <span>{margin !== null ? `${(margin * 100).toFixed(1)}%` : "-"}</span></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {p.flags.map((flag: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 justify-start h-auto py-1">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-2 items-end w-[120px] ml-auto">
                            {p.opportunity_number ? (
                              <a href={`https://billiondollarboy.lightning.force.com/lightning/cmp/forceSearch%3AsearchPage?forceSearch%3AsearchPage.searchTerm=${p.opportunity_number}`} target="_blank" rel="noreferrer" className="block w-full">
                                <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                                  <ExternalLink className="w-4 h-4 mr-2" /> Salesforce
                                </Button>
                              </a>
                            ) : (
                              <Button variant="outline" size="sm" className="h-8 w-full justify-start opacity-50 cursor-not-allowed" title="No Opportunity Number available">
                                <ExternalLink className="w-4 h-4 mr-2" /> Salesforce
                              </Button>
                            )}
                            <Button variant="secondary" size="sm" className="h-8 w-full justify-start" onClick={() => setDismissDialog({ project: p })}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Action
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {dismissedFlags.length > 0 && (
        <Card className="opacity-80">
          <CardHeader 
            className="cursor-pointer hover:bg-slate-50 transition-colors" 
            onClick={() => setIsDismissedOpen(!isDismissedOpen)}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Dismissed ({dismissedFlags.length})
              </div>
              {isDismissedOpen ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
            </CardTitle>
          </CardHeader>
          {isDismissedOpen && (
            <CardContent>
              <div className="rounded-md border bg-muted/20">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Project</TableHead>
                      <TableHead className="w-[400px]">Original Flags</TableHead>
                      <TableHead>Dismissal Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {dismissedFlags.map((p) => {
                    let displayReason = p.review.dismissal_reason;
                    try {
                      const parsed = JSON.parse(p.review.dismissal_reason);
                      if (parsed.type === "snooze" && parsed.until) {
                        displayReason = `Snoozed until ${format(parseISO(parsed.until), 'd MMM yyyy')}`;
                      } else if (parsed.reason) {
                        displayReason = parsed.reason;
                      }
                    } catch (e) {
                      // leave as raw if parsing fails
                    }
                    return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{p.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{p.office}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {p.flags.map((flag: string, idx: number) => (
                            <div key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-slate-400 mt-[2px]">•</span> <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm bg-white p-2 rounded border border-slate-200 shadow-sm italic text-slate-700">
                          "{displayReason}"
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Dismissed by {p.review.dismissed_by} on {format(parseISO(p.review.dismissed_at), 'd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900" onClick={() => restoreMutation.mutate(p.id)}>
                          <X className="w-4 h-4 mr-2" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          )}
        </Card>
      )}

      {/* Rules Section */}
      <div className="mt-8 border rounded-lg bg-slate-50 overflow-hidden">
        <button 
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between p-4 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            What gets flagged?
          </div>
          {showRules ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {showRules && (
          <div className="p-4 pt-0 text-sm text-slate-600 border-t bg-white">
            <div className="mt-4 mb-2 p-3 bg-blue-50 text-blue-800 rounded border border-blue-100">
              <strong>Note on Eligibility:</strong> Only active projects, projects with a future start date, and projects that ended <strong>within the last 30 days</strong> are subject to these rules and will appear in the WIP Tracker. Older completed projects are automatically excluded.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Financial & Margin Flags</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Standard Projects:</strong> Gross Profit Margin is outside the typical 20% - 60% range.</li>
                  <li><strong>Passthrough Costs:</strong> Margin should be exactly 0%.</li>
                  <li><strong>RTB & Talent Savings:</strong> Margin should be 100%.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Pipeline & Dates</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Stale Pipeline:</strong> Project start date is more than 2 weeks in the past, but the project is not marked as Committed or Closed Won.</li>
                  <li><strong>Holding Pots:</strong> Should not have any project dates assigned.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Missing Data & Links</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Missing Financials:</strong> Missing Price, Gross Budget, or Net Budget.</li>
                  <li><strong>Missing Dates:</strong> Missing Start Date, End Date, or RTB Dates (RTB Dates required for all standard projects).</li>
                  <li><strong>Missing Fee Calc:</strong> Committed or Closed Won projects missing a linked Fee Calculator.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Record Type Mismatches</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Passthrough Mismatch:</strong> Project title implies passthrough costs, or margin is &le; 5%, but record type is not set to Passthrough Costs.</li>
                  <li><strong>RFI / RFP Mismatch:</strong> Title contains RFI/RFP but record type is incorrect.</li>
                  <li><strong>Talent Savings Mismatch:</strong> Title contains savings/efficiencies but record type is incorrect.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!dismissDialog} onOpenChange={(open) => !open && setDismissDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action Required</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Project</div>
              <div className="text-sm text-muted-foreground">{dismissDialog?.project.title}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Select flags to action:</div>
              <div className="flex flex-col gap-2">
                {dismissDialog?.project.flags.map((f: string, i: number) => (
                  <label key={i} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded border border-transparent hover:border-slate-200 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedFlags.includes(f)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedFlags([...selectedFlags, f]);
                        else setSelectedFlags(selectedFlags.filter(x => x !== f));
                      }}
                      className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Action Type</div>
              <Select value={actionType} onValueChange={(v: "snooze" | "dismiss") => setActionType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dismiss">Dismiss & Justify</SelectItem>
                  <SelectItem value="snooze">Snooze (1 week)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType === "dismiss" && (
              <div>
                <div className="text-sm font-medium mb-2">Reason for dismissal</div>
                <Textarea 
                  placeholder="Why are you comfortable with this status?"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  className="h-24"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissDialog(null)}>Cancel</Button>
            <Button 
              onClick={() => dismissDialog && dismissMutation.mutate({ 
                projectId: dismissDialog.project.id, 
                reason: dismissReason,
                flags: selectedFlags,
                type: actionType,
                existingReview: dismissDialog.project.review
              })} 
              disabled={selectedFlags.length === 0 || (actionType === "dismiss" && !dismissReason.trim()) || dismissMutation.isPending}
            >
              {dismissMutation.isPending ? "Saving..." : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
