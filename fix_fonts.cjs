const fs = require('fs');

const replacements = [
  { file: 'src/pages/HomePage.tsx', search: 'text-5xl sm:text-7xl lg:text-8xl', replace: 'text-5xl md:text-6xl lg:text-7xl' },
  { file: 'src/pages/AboutPage.tsx', search: 'text-6xl md:text-8xl lg:text-9xl', replace: 'text-4xl md:text-5xl lg:text-6xl' },
  { file: 'src/pages/AboutPage.tsx', search: 'text-5xl md:text-8xl font-bold', replace: 'text-4xl md:text-5xl lg:text-6xl font-bold' },
  { file: 'src/pages/OfficePage.tsx', search: 'text-6xl md:text-8xl lg:text-9xl', replace: 'text-4xl md:text-5xl lg:text-6xl' },
  { file: 'src/pages/JobsPage.tsx', search: 'text-5xl md:text-7xl lg:text-8xl', replace: 'text-4xl md:text-5xl lg:text-6xl' }
];

replacements.forEach(({ file, search, replace }) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
