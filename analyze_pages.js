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
    } else if (file.endsWith('page.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('C:\\JUICE-BAR-POS-NEW-master\\src\\app\\dashboard');

const report = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Quick checks
  const hasTable = content.includes('<Table');
  if (!hasTable) return;
  
  const hasSearch = content.includes('placeholder="Search') || content.includes('Search ') || content.includes('searchQuery');
  const hasSelectFilter = content.includes('<Select') && (content.includes('Filter') || content.includes('statusFilter') || content.includes('category') || content.includes('branch'));
  
  const hasEdit = content.includes('Edit') && content.includes('<Button');
  const hasDelete = content.includes('Delete') && content.includes('<Button');
  const hasView = content.includes('View') && content.includes('<Button');
  
  const relativeName = file.replace('C:\\JUICE-BAR-POS-NEW-master\\src\\app\\dashboard\\', '');
  
  report.push({
    file: relativeName,
    search: hasSearch,
    filter: hasSelectFilter,
    actions: { edit: hasEdit, delete: hasDelete, view: hasView }
  });
});

console.log(JSON.stringify(report, null, 2));
