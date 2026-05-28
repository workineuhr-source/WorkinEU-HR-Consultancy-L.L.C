const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('max-w-[1920px]')) {
        content = content.replace(/max-w-\[1920px\]/g, 'max-w-7xl');
        // also increase margin for smaller screens: px-4 -> px-6
        // actually let's just make it max-w-7xl.
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
