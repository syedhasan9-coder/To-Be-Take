import http from 'http';

function get(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', err => resolve({ status: 500, error: err }));
  });
}

async function verify() {
  const routes = ['/', '/wishlist', '/login/user', '/products', '/cart', '/checkout'];

  for (const r of routes) {
    const pageRes = await get('http://localhost:3000' + r);
    console.log(`\n=== Testing route: ${r} ===`);
    console.log(`HTML Status: ${pageRes.status}`);

    const cssMatches = [...pageRes.body.matchAll(/href="(\/_next\/static\/css\/[^"]+\.css[^"]*)"/g)];
    console.log(`Found ${cssMatches.length} stylesheet link(s)`);

    for (const match of cssMatches) {
      const cssUrl = 'http://localhost:3000' + match[1];
      const cssRes = await get(cssUrl);
      console.log(`  CSS URL: ${match[1]}`);
      console.log(`  CSS Status: ${cssRes.status}`);
      console.log(`  Content-Type: ${cssRes.headers['content-type']}`);
      console.log(`  Content-Length: ${cssRes.headers['content-length']} bytes`);
      console.log(`  Has --header-bg: ${cssRes.body.includes('--header-bg')}`);
      console.log(`  Has .action-svg: ${cssRes.body.includes('.action-svg')}`);
      console.log(`  Has .heart-icon: ${cssRes.body.includes('.heart-icon')}`);
      console.log(`  Has .customer-main-header: ${cssRes.body.includes('.customer-main-header')}`);
    }
  }
}

verify();
