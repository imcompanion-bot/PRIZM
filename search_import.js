import fs from 'fs';
import path from 'path';

function findFiles(dir, match) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
       if (!full.includes('node_modules') && !full.includes('.git')) {
          findFiles(full, match);
       }
    } else {
       if (full.endsWith('.js') || full.endsWith('.ts')) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('talent_efficiencies')) {
             console.log(full);
          }
       }
    }
  }
}
findFiles('.', 'talent_efficiencies');
