import fs from 'fs';
const data = JSON.parse(fs.readFileSync('sheet_debug4.json', 'utf8'));

console.log('h230:', data.h230);
console.log('h253:', data.h253);
console.log('Headers:');
console.log(data.h1, data.h2, data.h3, data.h4, data.h5);
