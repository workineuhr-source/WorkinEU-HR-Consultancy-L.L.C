import * as fs from 'fs';

const path = 'src/pages/HomePage.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace excessive paddings and margins
content = content.replace(/py-32/g, 'py-16 md:py-24');
content = content.replace(/mb-16 md:mb-20/g, 'mb-8 md:mb-12');
content = content.replace(/mt-20/g, 'mt-12');
content = content.replace(/mt-24/g, 'mt-12');
content = content.replace(/gap-16/g, 'gap-8');
content = content.replace(/min-h-screen/g, 'min-h-[80vh]');
content = content.replace(/gap-24/g, 'gap-12');
content = content.replace(/gap-32/g, 'gap-12');
content = content.replace(/mb-20 pb-20/g, 'mb-12 pb-12');
content = content.replace(/mb-24/g, 'mb-12');
content = content.replace(/py-24 md:py-40/g, 'py-16 md:py-24');

fs.writeFileSync(path, content, 'utf-8');
console.log('Spacings updated successfully!');
