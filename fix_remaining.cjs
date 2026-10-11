const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove showToast completely
content = content.replace(/const showToast = \([\s\S]*?\}, 4500\);\n  \};\n/, '');

// 2. Remove the helper calculations block
const startStr = "// --- Today's List & Notification System Helper Calculations ---";
const endStr = "return (";
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  console.log("Helper calculations block removed.");
} else {
  console.log("Could not find helper calculations markers.");
}

// 3. Remove activeAgendaTab
content = content.replace(/const \[activeAgendaTab[\s\S]*?\]\("today"\);\n/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done fixing remaining items.");
