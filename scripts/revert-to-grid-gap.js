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

  // Revert flex flex-col gap to grid gap which proved to work correctly with Shadcn
  const flexGap15Regex = /className="([^"]*)flex flex-col gap-1\.5([^"]*)"/g;
  if (flexGap15Regex.test(content)) {
    content = content.replace(flexGap15Regex, 'className="$1grid gap-1.5$2"');
    changed = true;
  }

  const flexGap2Regex = /className="([^"]*)flex flex-col gap-2([^"]*)"/g;
  if (flexGap2Regex.test(content)) {
    content = content.replace(flexGap2Regex, 'className="$1grid gap-2$2"');
    changed = true;
  }

  const spaceY15Regex = /className="([^"]*)space-y-1\.5([^"]*)"/g;
  if (spaceY15Regex.test(content)) {
    content = content.replace(spaceY15Regex, 'className="$1grid gap-1.5$2"');
    changed = true;
  }

  const spaceY2Regex = /className="([^"]*)space-y-2([^"]*)"/g;
  if (spaceY2Regex.test(content)) {
    content = content.replace(spaceY2Regex, 'className="$1grid gap-2$2"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Reverted to grid gap in:', file);
  }
});
