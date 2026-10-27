import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const projectNoteInput = `
const ProjectNoteInput = ({ project, review, appUser }: { project: any; review: any; appUser: any }) => {
  const queryClient = useQueryClient();
  const existingNotes = useMemo(() => {
    if (!review) return "";
    try {
      const parsed = JSON.parse(review.dismissal_reason || "{}");
      return parsed.notes || "";
    } catch {
      return "";
    }
  }, [review]);

  const [notes, setNotes] = React.useState(existingNotes);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setNotes(existingNotes);
    }
  }, [existingNotes, isFocused]);

  const saveMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      let payload: any = { type: "note", flags: [] };
      if (review) {
        try {
          payload = JSON.parse(review.dismissal_reason || "{}");
        } catch {}
      }
      payload.notes = newNotes;

      const { error } = await supabase.from("project_wip_reviews").upsert({
        project_id: project.id,
        dismissed_by: appUser?.name || appUser?.email || "Unknown User",
        dismissed_at: new Date().toISOString(),
        dismissal_reason: JSON.stringify(payload)
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wip_reviews"] });
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
      toast.error("Failed to save notes");
    }
  });

  const handleBlur = () => {
    setIsFocused(false);
    if (notes !== existingNotes) {
      setIsSaving(true);
      saveMutation.mutate(notes);
    }
  };

  return (
    <div className="relative">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder="Add note..."
        className="text-xs min-h-[60px] w-full resize-y bg-white"
      />
      {isSaving && <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground flex items-center gap-1 bg-white/80 px-1 rounded"><Save className="w-3 h-3"/> Saving...</div>}
    </div>
  );
};

`;

code = code.replace("export function WipTrackerPage() {", projectNoteInput + "export function WipTrackerPage() {");

code = code.replace('<TableHead className="w-[400px]">Flags</TableHead>', '<TableHead className="w-[200px]">Flags</TableHead>');
code = code.replace('<TableHead className="text-right">Actions</TableHead>', '<TableHead className="text-right w-[140px]">Actions</TableHead>\n                  <TableHead className="w-[250px]">Notes</TableHead>');

code = code.replace(/<Badge key=\{idx\} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 justify-start h-auto py-1">/g, '<Badge key={idx} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 justify-start h-auto py-1 whitespace-normal text-left">');

code = code.replace(
  '                          </div>\n                        </TableCell>\n                      </TableRow>',
  '                          </div>\n                        </TableCell>\n                        <TableCell>\n                          <ProjectNoteInput project={p} review={reviews.find((r: any) => r.project_id === p.id)} appUser={appUser} />\n                        </TableCell>\n                      </TableRow>'
);

fs.writeFileSync(file, code);
