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

  if (content.includes('className="grid gap-2"')) {
    content = content.replace(/className="grid gap-2"/g, 'className="flex flex-col gap-2"');
    changed = true;
  }
  
  if (content.includes('className="col-span-2 grid gap-1.5"')) {
    content = content.replace(/className="col-span-2 grid gap-1.5"/g, 'className="col-span-2 flex flex-col gap-1.5"');
    changed = true;
  }
  
  if (content.includes('className="col-span-4 grid gap-1.5"')) {
    content = content.replace(/className="col-span-4 grid gap-1.5"/g, 'className="col-span-4 flex flex-col gap-1.5"');
    changed = true;
  }

  if (content.includes('className="col-span-3 grid gap-1.5"')) {
    content = content.replace(/className="col-span-3 grid gap-1.5"/g, 'className="col-span-3 flex flex-col gap-1.5"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed flex spacing in:', file);
  }
});
