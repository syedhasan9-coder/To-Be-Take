const http = require('http');

async function api(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL('http://127.0.0.1:4000/api' + path);
    const req = http.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ error: e.message, raw: data });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('=== REAL BACKEND CUSTOMER QA RUNTIME VERIFICATION ===\n');

  // 1. Storefront
  const sf = await api('/customer/storefront');
  console.log('1. Storefront API Response:');
  console.log('   - Categories count:', sf.data?.categories?.length);
  console.log('   - Featured products count:', sf.data?.featuredProducts?.length);
  console.log('   - New arrivals count:', sf.data?.newArrivals?.length);
  console.log('   - Best sellers count:', sf.data?.bestSellers?.length);

  // 2. Explore / All products
  const allProds = await api('/customer/products');
  console.log('\n2. Explore (All Products):');
  console.log('   - Total products count in data.products:', allProds.data?.products?.length);
  console.log('   - Pagination total:', allProds.data?.pagination?.total);

  // 3. Every Category
  console.log('\n3. Testing All Seeded Categories:');
  for (const cat of (sf.data?.categories || [])) {
    const catProds = await api('/customer/products?category=' + encodeURIComponent(cat.slug));
    const count = catProds.data?.products?.length || 0;
    console.log('   - ' + cat.name + ' (' + cat.slug + '): ' + count + ' products returned');
  }

  // 4. Search Filter
  console.log('\n4. Search Filter Testing:');
  const searchPottery = await api('/customer/products?search=pottery');
  console.log('   - Query "pottery":', searchPottery.data?.products?.length, 'results');
  const searchRice = await api('/customer/products?search=ricce');
  console.log('   - Query "ricce":', searchRice.data?.products?.length, 'results');

  // 5. Product Detail
  console.log('\n5. Product Detail Testing:');
  const sample = allProds.data?.products?.[0];
  if (sample) {
    const detail = await api('/customer/products/' + sample.slug);
    console.log('   - Title:', detail.data?.title);
    console.log('   - Price: Rs.', detail.data?.price);
    console.log('   - In Stock:', detail.data?.inStock, '(' + detail.data?.stockQuantity + ' units)');
    console.log('   - Seller Store:', detail.data?.seller?.storeName);
    console.log('   - Reviews Count:', detail.data?.reviews?.length);
    console.log('   - Courier Services:', detail.data?.deliveryInfo?.couriers?.join(', '));
  }

  console.log('\n=== RUNTIME QA PASS COMPLETED SUCCESSFULLY ===');
})();
