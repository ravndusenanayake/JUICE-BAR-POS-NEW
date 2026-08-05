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

const files = walk('src/app/dashboard');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Revert Dialog containers to standard grid layout which is more robust for shadcn
  if (content.includes('className="space-y-5 py-4"')) {
    // If it was originally gap-6 or gap-4, we just use gap-6 for consistent spacing
    content = content.replace(/className="space-y-5 py-4"/g, 'className="grid gap-6 py-4"');
    changed = true;
  }

  // Revert label + input containers to grid gap-2 (which guarantees 8px spacing even with fragments)
  if (content.includes('className="space-y-2"')) {
    content = content.replace(/className="space-y-2"/g, 'className="grid gap-2"');
    changed = true;
  }

  if (content.includes('className="col-span-2 space-y-1"')) {
    content = content.replace(/className="col-span-2 space-y-1"/g, 'className="col-span-2 grid gap-1.5"');
    changed = true;
  }
  if (content.includes('className="col-span-4 space-y-1"')) {
    content = content.replace(/className="col-span-4 space-y-1"/g, 'className="col-span-4 grid gap-1.5"');
    changed = true;
  }
  if (content.includes('className="col-span-3 space-y-1"')) {
    content = content.replace(/className="col-span-3 space-y-1"/g, 'className="col-span-3 grid gap-1.5"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Reverted structure in:', file);
  }
});
