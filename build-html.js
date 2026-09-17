const fs = require('fs');

async function main() {
  try {
    const res = await fetch('http://localhost:3000/');
    let html = await res.text();

    // Find all css links
    const cssMatches = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g) || [];
    let allCss = '';

    for (const match of cssMatches) {
      const hrefMatch = match.match(/href="([^"]+)"/);
      if (hrefMatch && hrefMatch[1]) {
        const href = hrefMatch[1];
        console.log('Fetching CSS:', href);
        try {
          const cssRes = await fetch(`http://localhost:3000${href}`);
          const cssText = await cssRes.text();
          allCss += '\n' + cssText;
        } catch (e) {
          console.error('Failed to fetch CSS', href, e);
        }
      }
    }

    // Remove Next.js dev scripts and links
    html = html.replace(/<link[^>]+rel="stylesheet"[^>]+>/g, '');
    html = html.replace(/<script[^>]+turbopack[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<link[^>]+as="script"[^>]*>/gi, '');

    // Add font links if needed
    const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    `;

    // Inject inline CSS into head
    const styleTag = `
    ${fontLinks}
    <style>
      body {
        font-family: 'Hind Siliguri', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      ${allCss}
    </style>
    `;

    html = html.replace('</head>', `${styleTag}\n</head>`);

    // Clean up nextjs hydration error artifacts if any
    fs.writeFileSync('index.html', html, 'utf8');
    console.log('Successfully wrote index.html, size:', html.length);
  } catch (err) {
    console.error('Error in build-html:', err);
    process.exit(1);
  }
}

main();
