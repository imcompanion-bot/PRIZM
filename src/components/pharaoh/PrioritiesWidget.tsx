import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, ChevronRight, Database, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Priority {
  id: string;
  title: string;
  summary: string;
  reason: string;
  source: string;
  solution: string;
  status: 'open' | 'done';
}

const mockPriorities: Priority[] = [
  {
    id: "p1",
    title: "Review Client X's Q2 Pipeline",
    summary: "Q2 Pipeline coverage is currently below the required 3x threshold to meet landing targets.",
    reason: "Historical data indicates that at this stage in the quarter, pipeline should be significantly higher. Recent opportunity closures have not been backfilled.",
    source: "Salesforce CRM",
    solution: "Schedule a pipeline review with the account team. Focus on accelerating early-stage opportunities and identifying cross-sell potential.",
    status: 'open'
  },
  {
    id: "p2",
    title: "High Non-Billable Time: Team Member Y",
    summary: "Team member Y has logged >40% non-billable hours this month on billable projects.",
    reason: "Timesheet analysis shows a spike in 'internal admin' and 'training' codes during peak delivery weeks, impacting project margin.",
    source: "Timesheets Database",
    solution: "Review task allocation for Team Member Y. Ensure they are assigned to active, billable client deliverables and limit internal initiatives this month.",
    status: 'open'
  },
  {
    id: "p3",
    title: "Campaign Z Margin Alert",
    summary: "Campaign Z is tracking at 15% margin against a target of 25%.",
    reason: "Third-party production costs have exceeded initial estimates by 20%, while resource burn rate remains steady.",
    source: "Finance / NetSuite",
    solution: "Conduct a rapid margin review. Identify scope creep or renegotiate third-party deliverables to recover margin before campaign end.",
    status: 'open'
  }
];

export function PrioritiesWidget() {
  const [priorities, setPriorities] = useState<Priority[]>(mockPriorities);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [justification, setJustification] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleOpen = (p: Priority) => {
    setSelectedPriority(p);
    setJustification('');
    setIsOpen(true);
  };

  const handleResolve = () => {
    if (!selectedPriority) return;
    
    if (justification.trim().length < 10) {
      toast({
        title: "Justification Required",
        description: "Please provide a brief reason or justification (at least 10 characters) for marking this as resolved.",
        variant: "destructive",
      });
      return;
    }

    setPriorities(prev => prev.map(p => p.id === selectedPriority.id ? { ...p, status: 'done' } : p));
    setIsOpen(false);
    
    toast({
      title: "Priority Resolved",
      description: "Admin team has been notified via email with your justification.",
    });
  };

  const openPriorities = priorities.filter(p => p.status === 'open');
  const donePriorities = priorities.filter(p => p.status === 'done');

  return (
    <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-brand-pink" /> 
          Commercial Priorities
        </CardTitle>
        <CardDescription>
          Actionable insights and alerts across your client portfolio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6">
        
        <div className="space-y-3">
          {openPriorities.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No pending priorities. Great job!
            </div>
          ) : (
            openPriorities.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleOpen(p)}
                className="group p-4 rounded-lg border border-slate-200 hover:border-brand-pink/50 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-brand-pink transition-colors">{p.title}</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-pink transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.summary}</p>
              </div>
            ))
          )}
        </div>

        {donePriorities.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recently Resolved</h4>
            {donePriorities.map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 opacity-60">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-sm text-slate-700 line-through decoration-slate-400">{p.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedPriority && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedPriority.title}</DialogTitle>
                <DialogDescription>
                  Review the insight and proposed solution below.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Reason / Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedPriority.reason}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Suggested Solution</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedPriority.solution}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Data Source</h4>
                    <p className="text-sm text-slate-600">{selectedPriority.source}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold mb-2">Resolve Priority</h4>
                  <p className="text-xs text-muted-foreground mb-3">Provide a reason or justification for closing this priority. This context will be emailed to the administrative team.</p>
                  <Textarea 
                    placeholder="Enter justification (e.g., 'Met with team member, reallocated 10 hours to project X')..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="h-24 resize-none"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleResolve} className="bg-brand-pink hover:bg-brand-pink/90 text-white">Mark as Resolved</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
