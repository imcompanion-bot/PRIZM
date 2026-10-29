import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove ProjectNoteInput definition completely
code = code.replace(/const ProjectNoteInput = \(\{.*?\}\);\n\n/s, '');

// Update dismissDialog state and add dialogNote state
code = code.replace(
  'const [dismissDialog, setDismissDialog] = useState<{ project: any } | null>(null);\n  const [dismissReason, setDismissReason] = useState("");',
  'const [dismissDialog, setDismissDialog] = useState<{ project: any } | null>(null);\n  const [dismissReason, setDismissReason] = useState("");\n  const [dialogNote, setDialogNote] = useState("");'
);

// Update Dialog useEffect to populate dialogNote
code = code.replace(
  `  React.useEffect(() => {
    if (dismissDialog) {
      const flags = dismissDialog.project.flags || [];
      setSelectedFlags(flags.length === 1 ? [...flags] : []);
      setDismissReason("");
      setActionType("dismiss");
    }
  }, [dismissDialog]);`,
  `  React.useEffect(() => {
    if (dismissDialog) {
      const flags = dismissDialog.project.flags || [];
      setSelectedFlags(flags.length === 1 ? [...flags] : []);
      setDismissReason("");
      setActionType("dismiss");
      
      const review = dismissDialog.project.review;
      if (review && review.dismissal_reason) {
        try {
          const parsed = JSON.parse(review.dismissal_reason);
          setDialogNote(parsed.notes || "");
        } catch(e) {
          setDialogNote("");
        }
      } else {
        setDialogNote("");
      }
    }
  }, [dismissDialog]);`
);

// Update dismissMutation to handle notes
code = code.replace(
  `  const dismissMutation = useMutation({
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
      }`,
  `  const dismissMutation = useMutation({
    mutationFn: async ({ projectId, reason, flags, type, existingReview, note }: { projectId: string, reason: string, flags: string[], type: "snooze" | "dismiss", existingReview: any, note: string }) => {
      let payload: any = { type: "note", flags: [] };
      if (existingReview && existingReview.dismissal_reason) {
        try {
          payload = JSON.parse(existingReview.dismissal_reason);
        } catch (e) {
          // legacy
        }
      }
      
      payload.notes = note;

      if (flags.length > 0) {
        payload.type = type;
        payload.flags = Array.from(new Set([...(payload.flags || []), ...flags]));
        if (type === "snooze") {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          payload.until = nextWeek.toISOString();
        } else {
          payload.reason = reason;
        }
      }`
);


// Replace the Action cell in the main table to remove ProjectNoteInput
code = code.replace(
  `                            <ProjectNoteInput project={p} review={reviews.find((r: any) => r.project_id === p.id)} appUser={appUser} />
                          </div>
                        </TableCell>
                      </TableRow>`,
  `                          </div>
                        </TableCell>
                      </TableRow>`
);

// Fix width of Action column in main table header
code = code.replace(
  '<TableHead className="w-[280px]">Actions</TableHead>',
  '<TableHead className="w-[200px] text-right">Actions</TableHead>'
);


// Make the flex layout space out properly in main table Action cell
code = code.replace(
  `                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              {p.opportunity_number ? (
                                <a href={\`https://billiondollarboy.lightning.force.com/lightning/cmp/forceSearch%3AsearchPage?forceSearch%3AsearchPage.searchTerm=\${p.opportunity_number}\`} target="_blank" rel="noreferrer" className="block w-1/2">
                                  <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Salesforce
                                  </Button>
                                </a>
                              ) : (
                                <Button variant="outline" size="sm" className="h-8 w-1/2 justify-start opacity-50 cursor-not-allowed" title="No Opportunity Number available">
                                  <ExternalLink className="w-4 h-4 mr-2" /> Salesforce
                                </Button>
                              )}
                              <Button variant="secondary" size="sm" className="h-8 w-1/2 justify-start" onClick={() => setDismissDialog({ project: p })}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Action
                              </Button>
                            </div>`,
  `                        <TableCell className="text-right">
                          <div className="flex flex-col gap-2 items-end w-[130px] ml-auto">
                            {p.opportunity_number ? (
                              <a href={\`https://billiondollarboy.lightning.force.com/lightning/cmp/forceSearch%3AsearchPage?forceSearch%3AsearchPage.searchTerm=\${p.opportunity_number}\`} target="_blank" rel="noreferrer" className="block w-full">
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
                          </div>`
);


// Replace the Dismissed Table Actions cell to also have Edit Note / Restore
code = code.replace(
  `                      <TableHead className="w-[280px]">Actions</TableHead>
                    </TableRow>`,
  `                      <TableHead className="w-[140px] text-right">Actions</TableHead>
                    </TableRow>`
);

code = code.replace(
  `                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900 justify-start w-1/2" onClick={() => restoreMutation.mutate(p.id)}>
                            <X className="w-4 h-4 mr-2" /> Restore
                          </Button>
                          <ProjectNoteInput project={p} review={p.review} appUser={appUser} />
                        </div>
                      </TableCell>`,
  `                      <TableCell className="text-right">
                        <div className="flex flex-col gap-2 items-end w-[130px] ml-auto">
                          <Button variant="secondary" size="sm" className="h-8 w-full justify-start" onClick={() => setDismissDialog({ project: p })}>
                            <MessageSquare className="w-4 h-4 mr-2 text-blue-600" /> Edit Note
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-full justify-start text-slate-500 hover:text-slate-900" onClick={() => restoreMutation.mutate(p.id)}>
                            <X className="w-4 h-4 mr-2" /> Restore Flags
                          </Button>
                        </div>
                      </TableCell>`
);

fs.writeFileSync(file, code);
