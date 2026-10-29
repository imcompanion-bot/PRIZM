import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const brokenCode = `  const handleBlur = () => {
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
};`;

code = code.replace(brokenCode, '');

fs.writeFileSync(file, code);
