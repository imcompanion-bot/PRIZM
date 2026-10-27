import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<TableHead className="text-right">Actions</TableHead>',
  '<TableHead className="text-right w-[140px]">Actions</TableHead>\n                      <TableHead className="w-[250px]">Notes</TableHead>'
);

code = code.replace(
  '<Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900" onClick={() => restoreMutation.mutate(p.id)}>\n                          <X className="w-4 h-4 mr-2" /> Restore\n                        </Button>\n                      </TableCell>\n                    </TableRow>',
  '<Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900" onClick={() => restoreMutation.mutate(p.id)}>\n                          <X className="w-4 h-4 mr-2" /> Restore\n                        </Button>\n                      </TableCell>\n                      <TableCell>\n                        <ProjectNoteInput project={p} review={p.review} appUser={appUser} />\n                      </TableCell>\n                    </TableRow>'
);

fs.writeFileSync(file, code);
