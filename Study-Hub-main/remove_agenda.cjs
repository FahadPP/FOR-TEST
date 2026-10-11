const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove JSX Block
const startMarker = '{/* Smart Agenda & Programmatic Notifications Center */}';
const endMarker = '{/* Tasks & Discussions List Card */}';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  console.log("JSX block removed.");
} else {
  console.log("Could not find JSX markers.");
}

// 2. Remove states and effects (using regex or finding the function signatures)
content = content.replace(/const \[notificationsLog[\s\S]*?\]\);/, '');
content = content.replace(/const \[daysBeforeAssignment[\s\S]*?2\);/, '');
content = content.replace(/useEffect\(\(\) => \{\s*localStorage\.setItem\("academic_notifications_log"[\s\S]*?\}, \[notificationsLog\]\);/, '');
content = content.replace(/const runProgrammaticReminders = \(\) => \{[\s\S]*?setNotificationsLog[\s\S]*?\}\n  \};/, '');
content = content.replace(/const clearNotificationLogs = \(\) => \{[\s\S]*?\}\n  \};/, '');

// Also remove `agendaTab` state if it exists
content = content.replace(/const \[agendaTab[\s\S]*?useState.*?;\n/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done updating Dashboard.tsx");
