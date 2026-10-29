import fs from 'fs';
const file = 'src/pages/WipTracker/WipTrackerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '                          </div>\n                          </div>\n                        </TableCell>',
  '                          </div>\n                        </TableCell>'
);

fs.writeFileSync(file, code);
