const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/import \{ Sun, Moon, CheckCircle2,/g, 'import {');

const index = code.indexOf('import {\n  Plus,');
if (index !== -1) {
  code = code.slice(0, index + 8) + ' Sun, Moon, CheckCircle2,\n  Plus,' + code.slice(index + 16);
}

fs.writeFileSync('src/App.tsx', code);
