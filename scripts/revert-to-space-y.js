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

  // Replace flex flex-col gap with space-y because space-y applies margin directly to DOM elements
  // and works flawlessly in older Tailwind or buggy flexbox scenarios.
  const flexGap15Regex = /className="([^"]*)flex flex-col gap-1\.5([^"]*)"/g;
  if (flexGap15Regex.test(content)) {
    content = content.replace(flexGap15Regex, 'className="$1space-y-1.5$2"');
    changed = true;
  }

  const flexGap2Regex = /className="([^"]*)flex flex-col gap-2([^"]*)"/g;
  if (flexGap2Regex.test(content)) {
    content = content.replace(flexGap2Regex, 'className="$1space-y-2$2"');
    changed = true;
  }

  // Also replace any lingering grid gap-2 that wraps a single Label+Input
  // This is slightly dangerous if it's a real grid, but usually it's just a wrapper.
  const gridGap15Regex = /className="([^"]*)grid gap-1\.5([^"]*)"/g;
  if (gridGap15Regex.test(content)) {
    content = content.replace(gridGap15Regex, (match, p1, p2) => {
      if (match.includes('grid-cols')) return match; // don't break actual multi-col grids
      return `className="${p1}space-y-1.5${p2}"`;
    });
    changed = true;
  }

  const gridGap2Regex = /className="([^"]*)grid gap-2([^"]*)"/g;
  if (gridGap2Regex.test(content)) {
    content = content.replace(gridGap2Regex, (match, p1, p2) => {
      if (match.includes('grid-cols')) return match;
      return `className="${p1}space-y-2${p2}"`;
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Reverted to space-y in:', file);
  }
});
