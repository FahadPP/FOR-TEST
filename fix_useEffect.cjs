const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the clearNotificationLogs if it wasn't fully removed
content = content.replace(/const clearNotificationLogs = \(\) => \{[\s\S]*?\}\n  \};/, '');

// Remove the auto-reminder useEffect
const useEffectStr = /\/\/ Run auto-reminder script on mount if enabled[\s\S]*?\}, \[courses, lectures, assignments\]\);/g;
content = content.replace(useEffectStr, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed useEffect.");
