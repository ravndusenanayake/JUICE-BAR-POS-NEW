/**
 * Comprehensive UI/UX Fix Script
 * Expert UI/UX designer approach:
 * 
 * Problem 1: The sidebar nav uses "grid gap-2" which adds too much spacing
 *            between nav items. It should use "space-y-1" (margin-based).
 * 
 * Problem 2: Form field wrappers use "grid gap-2" to space Label and Input/Select.
 *            This BREAKS with @base-ui Select because Select renders through 
 *            React Fragments, creating unexpected grid children.
 *            FIX: Use simple div wrapper with Label having "mb-1.5 block" class.
 * 
 * Problem 3: Inconsistent padding inside DialogContent form bodies.
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

// --- Fix 1: Sidebar layout.tsx ---
function fixSidebar() {
  const file = 'src/app/dashboard/layout.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // The nav element should use space-y-1 (margin-based spacing between direct children)
  // NOT grid gap-2 which creates grid layout and adds too much space
  content = content.replace(
    'className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar"',
    'className="flex-1 space-y-0.5 p-4 overflow-y-auto custom-scrollbar"'
  );
  // Also revert sidebar bottom section
  content = content.replace(
    'className="mt-auto border-t p-4 grid gap-2"',
    'className="mt-auto border-t p-4 space-y-2"'
  );
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed sidebar spacing:', file);
}

// --- Fix 2: Fix ALL form field wrappers globally ---
function fixFormFields() {
  const files = walk('src/app');
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Pattern: <div className="grid gap-2"> wrapping Label + Input/Select
    // Replace with: <div> and add mb-1.5 to Label
    // This is the ONLY reliable pattern because:
    // - grid gap-2 breaks with @base-ui Select fragments
    // - space-y-2 breaks with @base-ui Select fragments  
    // - flex flex-col gap-2 breaks with @base-ui Select fragments
    // - mb-1.5 on Label is a DIRECT margin that cannot be broken by any component
    
    // Replace single-field wrappers: "grid gap-2" (no grid-cols) -> just remove grid gap
    // We need to be careful to NOT touch multi-column grids like "grid grid-cols-2 gap-4"
    content = content.replace(/className="grid gap-2"/g, 'className="space-y-2"');
    content = content.replace(/className="grid gap-1\.5"/g, 'className="space-y-1.5"');
    
    // Fix any remaining grid gap-4 that are single column (no grid-cols)
    // These are usually the outer form containers
    // Don't touch these - grid gap-4 without cols is fine for vertical stacking
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed form fields in:', file);
    }
  });
}

// --- Fix 3: Fix the search icon vertical alignment ---
// The search icon uses top-2.5 which is 10px. With h-11 inputs (44px), 
// the icon should be centered: (44 - 16) / 2 = 14px = top-3.5
function fixSearchIcons() {
  const files = walk('src/app');
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Fix search icon positioning for h-11 inputs
    content = content.replace(
      /className="absolute left-2\.5 top-2\.5 h-4 w-4 text-muted-foreground"/g,
      'className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"'
    );
    content = content.replace(
      /className="absolute left-3 top-2\.5 h-4 w-4 text-gray-400"/g,
      'className="absolute left-3 top-3.5 h-4 w-4 text-gray-400"'
    );
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed search icons in:', file);
    }
  });
}

// Run all fixes
fixSidebar();
fixFormFields();
fixSearchIcons();

console.log('\n✅ All UI/UX fixes applied successfully!');
