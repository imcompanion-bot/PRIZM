import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Action required table header
code = code.replace(
  '<TableHead className="w-[300px]">Project</TableHead>\n                  <TableHead>Key Info</TableHead>\n                  <TableHead className="w-[200px]">Flags</TableHead>\n                  <TableHead className="text-right w-[140px]">Actions</TableHead>\n                  <TableHead className="w-[250px]">Notes</TableHead>',
  '<TableHead className="w-[300px]">Project</TableHead>\n                  <TableHead className="w-[280px]">Key Info</TableHead>\n                  <TableHead className="w-[220px]">Flags</TableHead>\n                  <TableHead className="w-[280px]">Actions</TableHead>'
);

// Action required table body
code = code.replace(
  `                        <TableCell className="text-right">
                          <div className="flex flex-col gap-2 items-end w-[120px] ml-auto">
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <ProjectNoteInput project={p} review={reviews.find((r: any) => r.project_id === p.id)} appUser={appUser} />
                        </TableCell>`,
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
                            </div>
                            <ProjectNoteInput project={p} review={reviews.find((r: any) => r.project_id === p.id)} appUser={appUser} />
                          </div>
                        </TableCell>`
);

// Update colSpan for loading/empty state
code = code.replace(
  '<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading projects...</TableCell>',
  '<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading projects...</TableCell>'
);

fs.writeFileSync(file, code);
