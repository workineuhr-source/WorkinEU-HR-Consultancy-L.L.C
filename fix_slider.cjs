const fs = require('fs');

const file = 'src/pages/HomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// The replacement logic to make images object-contain on top of blurred object-cover
const search1 = `<Link to={heroItems[currentHeroIndex].link!} className="absolute inset-0 block group/link flex items-center justify-center p-4">
                          <img
                            src={heroItems[currentHeroIndex].url?.includes("unsplash.com") ? \`\${heroItems[currentHeroIndex].url.split('?')[0]}?auto=format&fit=crop&w=3840&q=100\` : getDirectImageUrl(heroItems[currentHeroIndex].url)}
                            alt={heroItems[currentHeroIndex].title || "Professional recruitment"}
                            className="w-full h-full object-contain transition-transform duration-1000 group-hover/slider:scale-110"
                            referrerPolicy="no-referrer"
                            loading="eager"
                          />`;

const replace1 = `<Link to={heroItems[currentHeroIndex].link!} className="absolute inset-0 block group/link bg-black/40">
                          <img
                            src={heroItems[currentHeroIndex].url?.includes("unsplash.com") ? \`\${heroItems[currentHeroIndex].url.split('?')[0]}?auto=format&fit=crop&w=3840&q=100\` : getDirectImageUrl(heroItems[currentHeroIndex].url)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-3xl transition-transform duration-1000 group-hover/slider:scale-110 -z-10"
                            referrerPolicy="no-referrer"
                            loading="eager"
                            aria-hidden="true"
                          />
                          <img
                            src={heroItems[currentHeroIndex].url?.includes("unsplash.com") ? \`\${heroItems[currentHeroIndex].url.split('?')[0]}?auto=format&fit=crop&w=3840&q=100\` : getDirectImageUrl(heroItems[currentHeroIndex].url)}
                            alt={heroItems[currentHeroIndex].title || "Professional recruitment"}
                            className="relative z-0 w-full h-full object-contain transition-transform duration-1000 group-hover/slider:scale-110"
                            referrerPolicy="no-referrer"
                            loading="eager"
                          />`;

const search2 = `<div className="absolute inset-0 flex items-center justify-center p-4">
                           <img
                             src={heroItems[currentHeroIndex].url?.includes("unsplash.com") ? \`\${heroItems[currentHeroIndex].url.split('?')[0]}?auto=format&fit=crop&w=3840&q=100\` : getDirectImageUrl(heroItems[currentHeroIndex].url)}
                             alt="Professional recruitment"
                             className="w-full h-full object-contain transition-transform duration-1000 group-hover/slider:scale-110"
                             referrerPolicy="no-referrer"
                             loading="eager"
                           />`;

const replace2 = `<div className="absolute inset-0 bg-black/40">
                           <img
                             src={heroItems[currentHeroIndex].url?.includes("unsplash.com") ? \`\${heroItems[currentHeroIndex].url.split('?')[0]}?auto=format&fit=crop&w=3840&q=100\` : getDirectImageUrl(heroItems[currentHeroIndex].url)}
                             alt=""
                             className="absolute inset-0 w-full h-full object-cover opacity-50 blur-3xl transition-transform duration-1000 group-hover/slider:scale-110 -z-10"
                             referrerPolicy="no-referrer"
                             loading="eager"
                             aria-hidden="true"
                           />
                           <img
                             src={heroItems[currentHeroIndex].url?.includes("unsplash.com") ? \`\${heroItems[currentHeroIndex].url.split('?')[0]}?auto=format&fit=crop&w=3840&q=100\` : getDirectImageUrl(heroItems[currentHeroIndex].url)}
                             alt="Professional recruitment"
                             className="relative z-0 w-full h-full object-contain transition-transform duration-1000 group-hover/slider:scale-110"
                             referrerPolicy="no-referrer"
                             loading="eager"
                           />`;

let updated = content.replace(search1, replace1).replace(search2, replace2);
fs.writeFileSync(file, updated, 'utf8');
console.log('Fixed slider image fit');
