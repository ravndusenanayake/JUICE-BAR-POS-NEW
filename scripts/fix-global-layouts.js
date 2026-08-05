const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Fix space-y styling in forms
  const spaceY15Regex = /className="([^"]*)space-y-1\.5([^"]*)"/g;
  if (spaceY15Regex.test(content)) {
    content = content.replace(spaceY15Regex, (match, p1, p2) => {
      // Don't replace if it's already flex
      if (match.includes('flex flex-col')) return match;
      return `className="${p1}flex flex-col gap-1.5${p2}"`;
    });
    changed = true;
  }

  const spaceY2Regex = /className="([^"]*)space-y-2([^"]*)"/g;
  if (spaceY2Regex.test(content)) {
    content = content.replace(spaceY2Regex, (match, p1, p2) => {
      // Don't replace if it's already flex
      if (match.includes('flex flex-col')) return match;
      return `className="${p1}flex flex-col gap-2${p2}"`;
    });
    changed = true;
  }

  // Fix responsive grids
  const grid2Regex = /className="([^"]*)grid grid-cols-2([^"]*)"/g;
  if (grid2Regex.test(content)) {
    content = content.replace(grid2Regex, (match, p1, p2) => {
      if (match.includes('md:grid-cols-2') || match.includes('sm:grid-cols-2')) return match;
      return `className="${p1}grid grid-cols-1 md:grid-cols-2${p2}"`;
    });
    changed = true;
  }

  const grid3Regex = /className="([^"]*)grid grid-cols-3([^"]*)"/g;
  if (grid3Regex.test(content)) {
    content = content.replace(grid3Regex, (match, p1, p2) => {
      if (match.includes('md:grid-cols-3') || match.includes('sm:grid-cols-3')) return match;
      return `className="${p1}grid grid-cols-1 md:grid-cols-3${p2}"`;
    });
    changed = true;
  }

  const grid4Regex = /className="([^"]*)grid grid-cols-4([^"]*)"/g;
  if (grid4Regex.test(content)) {
    content = content.replace(grid4Regex, (match, p1, p2) => {
      if (match.includes('md:grid-cols-4') || match.includes('sm:grid-cols-4')) return match;
      return `className="${p1}grid grid-cols-1 md:grid-cols-4${p2}"`;
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed alignments in:', file);
  }
});
