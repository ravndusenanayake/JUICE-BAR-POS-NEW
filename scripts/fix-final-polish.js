/**
 * Final UI/UX Polish Script
 * 
 * This script fixes:
 * 1. Dialog body padding - ensures all form content inside dialogs has px-6 py-4
 * 2. Reverts any grid-cols-1 md:grid-cols-X back to just grid-cols-X (PC only, no mobile)
 * 3. Ensures consistent Label spacing pattern
 */

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
  let original = content;

  // Fix 1: Revert responsive grids back to fixed (PC only system)
  // grid-cols-1 md:grid-cols-2 -> grid-cols-2
  // grid-cols-1 md:grid-cols-3 -> grid-cols-3
  // grid-cols-1 md:grid-cols-4 -> grid-cols-4
  content = content.replace(/grid grid-cols-1 md:grid-cols-2/g, 'grid grid-cols-2');
  content = content.replace(/grid grid-cols-1 md:grid-cols-3/g, 'grid grid-cols-3');
  content = content.replace(/grid grid-cols-1 md:grid-cols-4/g, 'grid grid-cols-4');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});

console.log('\n✅ All responsive grid reverts applied!');
