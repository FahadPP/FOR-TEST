const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'components', 'AICompanion.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\)\)[\s]+\)\)/g;
content = content.replace(regex, '))');
fs.writeFileSync(filePath, content, 'utf8');
