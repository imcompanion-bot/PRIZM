import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const newDialog = `      <Dialog open={!!dismissDialog} onOpenChange={(open) => !open && setDismissDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Project</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <div className="text-sm font-medium mb-1">Project</div>
              <div className="text-sm text-muted-foreground">{dismissDialog?.project.title}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">1. Add a note to this opportunity</div>
              <Textarea 
                placeholder="Write your note here... (Visible to everyone)"
                value={dialogNote}
                onChange={(e) => setDialogNote(e.target.value)}
                className="h-24 bg-yellow-50/50"
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="text-sm font-medium">2. Action Flags (Optional)</div>
              {dismissDialog?.project.flags?.length > 0 ? (
                <div className="flex flex-col gap-2 mb-4">
                  {dismissDialog?.project.flags.map((f: string, i: number) => (
                    <label key={i} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded border border-transparent hover:border-slate-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedFlags.includes(f)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedFlags([...selectedFlags, f]);
                          else setSelectedFlags(selectedFlags.filter(x => x !== f));
                        }}
                        className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500 mt-[2px]"
                      />
                      <span className="font-medium text-slate-800 leading-tight">{f}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic mb-4">No active flags to action.</div>
              )}

              {selectedFlags.length > 0 && (
                <div className="space-y-4 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div>
                    <div className="text-sm font-medium mb-2">Action Type</div>
                    <Select value={actionType} onValueChange={(v: "snooze" | "dismiss") => setActionType(v)}>
                      <SelectTrigger className="bg-white">
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
                        className="h-20 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissDialog(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (selectedFlags.length > 0 && actionType === "dismiss" && !dismissReason.trim()) {
                  toast.error("Please provide a reason for dismissal");
                  return;
                }
                dismissMutation.mutate({ 
                  projectId: dismissDialog!.project.id, 
                  reason: dismissReason, 
                  flags: selectedFlags, 
                  type: actionType, 
                  existingReview: dismissDialog!.project.review,
                  note: dialogNote
                });
              }}
              disabled={dismissMutation.isPending}
            >
              {dismissMutation.isPending ? "Saving..." : "Save Updates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>`;

// Find and replace the old dialog
const dialogRegex = /<Dialog open=\{!!dismissDialog\}.*?<\/Dialog>/s;
code = code.replace(dialogRegex, newDialog);

fs.writeFileSync(file, code);
