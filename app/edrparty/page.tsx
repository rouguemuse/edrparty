import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'EDR Party Rentals — Free Local Delivery on Orders $349+',
  description: 'Bounce houses, tables, chairs and party gear delivered, sanitized and ready before your guests arrive.',
};

export default function EdrPartyPage() {
  const filePath = path.join(process.cwd(), 'public', 'edrparty', 'index.html');
  let htmlContent = fs.readFileSync(filePath, 'utf8');

  // Fix relative asset paths for /edrparty subfolder
  htmlContent = htmlContent.replace(/href="styles\.css"/g, 'href="/edrparty/styles.css"');
  htmlContent = htmlContent.replace(/src="app\.js"/g, 'src="/edrparty/app.js"');
  htmlContent = htmlContent.replace(/src="images\//g, 'src="/edrparty/images/');

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
