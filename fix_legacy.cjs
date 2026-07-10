const fs = require('fs');
const jsPath = 'src/lib/pharaoh/legacyPharaoh.js';
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/import \{ ai \} from '\.\.\/firebase';\n/, '');
js = js.replace(/import \{ getGenerativeModel \} from 'firebase\/ai';\n/, '');
fs.writeFileSync(jsPath, js);

const cssPath = 'src/lib/pharaoh/legacyPharaoh.css';
let css = fs.readFileSync(cssPath, 'utf8');
// Basic naive scoping: we replace line starts that look like CSS selectors with .legacy-pharaoh
// Instead of complex parsing, let's just wrap it using standard CSS nesting!
// Modern browsers support standard CSS nesting. We can just wrap the whole thing in .legacy-pharaoh { ... }
// Wait, CSS nesting supports @media inside it!
fs.writeFileSync(cssPath, '.legacy-pharaoh {\n' + css + '\n}');
console.log('Fixed JS and wrapped CSS in .legacy-pharaoh');
