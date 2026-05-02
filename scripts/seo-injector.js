import fs from 'fs';
import path from 'path';

const pagesDir = 'src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const fullPath = path.join(pagesDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if SEO is already imported
  if (!content.includes('import SEO')) {
    // Determine title
    let title = file.replace('.tsx', '').replace(/([A-Z])/g, ' $1').trim() + ' | WorkInEU HR Portal';
    
    // Attempt to inject import and component
    if (content.includes('return (')) {
      // Find where 'return (' is
      const importRegex = /^import\s/m;
      // prepend import SEO
      content = content.replace(importRegex, 'import SEO from "../components/SEO";\nimport ');
      
      // Inject <SEO title="..." /> after first outermost div or similar inside return(
      // This is a bit risky but we can try just under return (\n or return (\n <div...
      content = content.replace(/return\s*\(\s*(<[A-Za-z]+[^>]*>)/, `return (\n    <>\n      <SEO title="${title}" />\n      $1`);
      // We need to close the fragment at the very end... which implies parsing JSX.
      // A safer way is to just do a simple replace inside the outermost wrapper if we know it.
      // Actually this is too risky automatically. Let's do it manually for important ones!
    }
  }
}
