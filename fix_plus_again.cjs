const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes('Sun,')) {
    app = app.replace('import {', 'import { Sun, Moon, CheckCircle2,');
    fs.writeFileSync('src/App.tsx', app);
}
