import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function verifyAll() {
  const HOST = '192.168.2.5';
  const PORT = 4000;
  console.log(`\n============================================================`);
  console.log(`VERIFYING LOCAL API ENDPOINTS (http://${HOST}:${PORT}/api)`);
  console.log(`============================================================\n`);

  // 1. GET /api/customer/products
  const prods = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/customer/products',
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  console.log(`1. GET /api/customer/products`);
  console.log(`   Status: HTTP ${prods.status} | Success: ${prods.data?.success} | Total items: ${prods.data?.data?.products?.length || prods.data?.data?.items?.length}`);
  if (prods.status !== 200) throw new Error('Products endpoint failed');

  // 2. GET /api/customer/storefront
  const storefront = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/customer/storefront',
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  console.log(`2. GET /api/customer/storefront`);
  console.log(`   Status: HTTP ${storefront.status} | Success: ${storefront.data?.success} | Featured: ${storefront.data?.data?.featuredProducts?.length || 0} | Categories: ${storefront.data?.data?.categories?.length || 0}`);
  if (storefront.status !== 200) throw new Error('Storefront endpoint failed');

  // 3. POST /api/auth/register/user
  const unique = Date.now();
  const testUser = {
    firstName: 'Mobile',
    lastName: 'Tester',
    username: `tester_${unique}`,
    email: `tester_${unique}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };
  const reg = await makeRequest(
    {
      hostname: HOST,
      port: PORT,
      path: '/api/auth/register/user',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    testUser
  );
  console.log(`3. POST /api/auth/register/user`);
  console.log(`   Status: HTTP ${reg.status} | Success: ${reg.data?.success} | User: ${reg.data?.data?.email} | Token received: ${Boolean(reg.data?.data?.token)}`);
  if (reg.status !== 201 && reg.status !== 200) throw new Error('Registration failed');

  // 4. POST /api/auth/login
  const login = await makeRequest(
    {
      hostname: HOST,
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      identifier: testUser.email,
      password: testUser.password,
    }
  );
  console.log(`4. POST /api/auth/login`);
  console.log(`   Status: HTTP ${login.status} | Success: ${login.data?.success} | Role: ${login.data?.data?.role} (${login.data?.data?.roleCode}) | Token received: ${Boolean(login.data?.data?.token)}`);
  if (login.status !== 200) throw new Error('Login failed');

  console.log(`\n============================================================`);
  console.log(`✅ ALL 4 ENDPOINTS PASSED VERIFICATION AGAINST 192.168.2.5:4000`);
  console.log(`============================================================\n`);
}

verifyAll().catch((err) => {
  console.error('❌ Verification error:', err);
  process.exit(1);
});
