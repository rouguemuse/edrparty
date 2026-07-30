const fs = require('fs');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace \` with `
    content = content.replace(/\\`/g, '`');
    // In app/admin/page.tsx, "Unexpected token div" at line 63. Let's see if there is an unmatched brace or parenthesis.
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  } catch (e) {
    console.error('Error', filePath, e);
  }
}

fixFile('lib/routing.ts');
fixFile('lib/inventory.ts');
fixFile('lib/translations.ts');
fixFile('app/api/admin/reservations/route.ts');
fixFile('app/api/inquiries/route.ts');
fixFile('app/admin/page.tsx');
