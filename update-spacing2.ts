import * as fs from 'fs';

const path = 'src/pages/HomePage.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Fix the typo
content = content.replace(/py-24 md:py-16 md:py-24/g, 'py-16 md:py-20');
content = content.replace(/py-16 md:py-24/g, 'py-12 md:py-16');

fs.writeFileSync(path, content, 'utf-8');
console.log('Spacings updated successfully!');
