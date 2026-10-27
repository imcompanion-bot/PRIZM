import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Also update the dismissed table
code = code.replace(
  '<TableHead className="w-[400px]">Original Flags</TableHead>\n                      <TableHead>Dismissal Reason</TableHead>\n                      <TableHead className="text-right w-[140px]">Actions</TableHead>\n                      <TableHead className="w-[250px]">Notes</TableHead>',
  '<TableHead className="w-[300px]">Original Flags</TableHead>\n                      <TableHead>Dismissal Reason</TableHead>\n                      <TableHead className="w-[280px]">Actions</TableHead>'
);

code = code.replace(
  `                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900" onClick={() => restoreMutation.mutate(p.id)}>
                          <X className="w-4 h-4 mr-2" /> Restore
                        </Button>
                      </TableCell>
                      <TableCell>
                        <ProjectNoteInput project={p} review={p.review} appUser={appUser} />
                      </TableCell>`,
  `                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900 justify-start w-1/2" onClick={() => restoreMutation.mutate(p.id)}>
                            <X className="w-4 h-4 mr-2" /> Restore
                          </Button>
                          <ProjectNoteInput project={p} review={p.review} appUser={appUser} />
                        </div>
                      </TableCell>`
);

fs.writeFileSync(file, code);
