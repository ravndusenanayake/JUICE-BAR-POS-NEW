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

  // Fix Dialog containers
  if (content.includes('className="grid gap-6 py-4"')) {
    content = content.replace(/className="grid gap-6 py-4"/g, 'className="space-y-5 py-4"');
    changed = true;
  }
  if (content.includes('className="grid gap-4 py-4"')) {
    content = content.replace(/className="grid gap-4 py-4"/g, 'className="space-y-5 py-4"');
    changed = true;
  }
  if (content.includes('className="grid gap-2"')) {
    content = content.replace(/className="grid gap-2"/g, 'className="space-y-2"');
    changed = true;
  }
  if (content.includes('className="grid gap-3"')) {
    content = content.replace(/className="grid gap-3"/g, 'className="space-y-2"');
    changed = true;
  }
  
  if (content.includes('mt-4 flex gap-3 sm:justify-end')) {
    content = content.replace(/mt-4 flex gap-3 sm:justify-end/g, 'mt-2 flex gap-3 sm:justify-end');
    changed = true;
  }

  if (content.includes('className="border-gray-300"')) {
    // If the input already has shadow-sm or something, we could just replace the border class. But let's just strip it and let our global UI handle it or provide a clean base.
    content = content.replace(/className="border-gray-300"/g, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated UI in:', file);
  }
});
