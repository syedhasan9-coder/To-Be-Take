async function verifyCredentialsAndEndpoints() {
  console.log('=== VERIFYING RUNNING SERVICES & CREDENTIALS ===\n');

  const baseApi = 'http://localhost:4000/api';
  const baseWeb = 'http://localhost:3000';

  // 1. Check API Health
  const healthRes = await fetch(`${baseApi}/health`);
  const healthData = await healthRes.json();
  console.log(`[API Health] Status: ${healthRes.status}, Body:`, healthData);

  // 2. Check Web Home
  const webRes = await fetch(baseWeb);
  console.log(`[Web Home] Status: ${webRes.status}, OK: ${webRes.ok}`);

  // 3. Test Super Admin Login
  console.log('\n--- Testing Super Admin Login ---');
  const saRes = await fetch(`${baseApi}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin', password: 'SuperAdmin@2026!', portal: 'admin', requiredRole: 'ADMIN' })
  });
  const saData = await saRes.json();
  console.log(`Super Admin Login: ${saRes.status}`, saData.success ? `SUCCESS (User: ${saData.data?.username}, Role: ${saData.data?.role})` : `FAILED: ${JSON.stringify(saData)}`);

  // 4. Test Operational Admin Login
  console.log('\n--- Testing Admin Login ---');
  const adminRes = await fetch(`${baseApi}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin_sarah', password: 'DevDemo@2026!', portal: 'admin', requiredRole: 'ADMIN' })
  });
  const adminData = await adminRes.json();
  console.log(`Admin Login: ${adminRes.status}`, adminData.success ? `SUCCESS (User: ${adminData.data?.username}, Role: ${adminData.data?.role})` : `FAILED: ${JSON.stringify(adminData)}`);

  // 5. Test Seller Login
  console.log('\n--- Testing Seller Login ---');
  const sellerRes = await fetch(`${baseApi}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'vendor_apex', password: 'DevDemo@2026!', portal: 'seller', requiredRole: 'VENDOR' })
  });
  const sellerData = await sellerRes.json();
  console.log(`Seller Login: ${sellerRes.status}`, sellerData.success ? `SUCCESS (User: ${sellerData.data?.username}, Store: ${sellerData.data?.storeName})` : `FAILED: ${JSON.stringify(sellerData)}`);

  // 6. Test Customer Login
  console.log('\n--- Testing Customer Login ---');
  const buyerRes = await fetch(`${baseApi}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'buyer_bilal', password: 'DevDemo@2026!', portal: 'user', requiredRole: 'CUST' })
  });
  const buyerData = await buyerRes.json();
  console.log(`Customer Login: ${buyerRes.status}`, buyerData.success ? `SUCCESS (User: ${buyerData.data?.username}, Name: ${buyerData.data?.firstName} ${buyerData.data?.lastName})` : `FAILED: ${JSON.stringify(buyerData)}`);

  // 7. Test Customer Storefront Products (PKR & Pakistani catalog)
  console.log('\n--- Testing Storefront Products in PKR ---');
  const sfRes = await fetch(`${baseApi}/customer/storefront`);
  const sfData = await sfRes.json();
  console.log(`Storefront Status: ${sfRes.status}`);
  console.log(`Total Categories: ${sfData.data?.categories?.length || 0}`);
  console.log(`Featured Products Count: ${sfData.data?.featuredProducts?.length || 0}`);
  if (sfData.data?.featuredProducts?.length > 0) {
    sfData.data.featuredProducts.slice(0, 3).forEach((p, idx) => {
      console.log(`  [Product ${idx + 1}] ${p.name} — Rs. ${p.price.toLocaleString()} (Stock: ${p.stockQuantity}, In Stock: ${p.inStock})`);
    });
  }

  // 8. Test Web Portals (Seller, Admin, Customer)
  console.log('\n--- Testing Web Portal Routes ---');
  const routes = [
    '/',
    '/login/user',
    '/login/seller',
    '/login/admin',
    '/products',
    '/cart',
    '/seller/dashboard',
    '/admin/dashboard'
  ];

  for (const r of routes) {
    const res = await fetch(`${baseWeb}${r}`);
    console.log(`Route "${r}" -> Status: ${res.status}`);
  }
}

verifyCredentialsAndEndpoints().catch(console.error);
