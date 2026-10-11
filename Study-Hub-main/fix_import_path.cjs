const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace('import { Sun, Moon, CheckCircle2, useState, useEffect } from "react";', 'import { useState, useEffect } from "react";');

if (!app.includes('Sun,')) {
    const index = app.indexOf('import { \n  Plus,');
    if (index !== -1) {
       app = app.slice(0, index + 10) + '\n  Sun,\n  Moon,\n  CheckCircle2,' + app.slice(index + 10);
    }
}
fs.writeFileSync('src/App.tsx', app);
