const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const index = code.indexOf('import { \n  Plus,');
if (index !== -1) {
  code = code.slice(0, index + 8) + '\n  Sun,\n  Moon,\n  CheckCircle2,' + code.slice(index + 8);
}
fs.writeFileSync('src/App.tsx', code);
