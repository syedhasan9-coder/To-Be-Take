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

async function run() {
  const HOST = '192.168.2.5';
  const PORT = 4000;
  console.log(`\nTesting API on http://${HOST}:${PORT}/api ...\n`);

  // 1. Customer products
  console.log('1. Testing GET /api/customer/products ...');
  const prods = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/customer/products',
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  console.log(`   Status: HTTP ${prods.status}`);
  console.log(`   Success: ${prods.data?.success}`);
  console.log(`   Items returned: ${prods.data?.data?.products?.length || prods.data?.data?.items?.length || 0}`);
  if (prods.status !== 200) {
    throw new Error(`Products endpoint failed with status ${prods.status}: ${JSON.stringify(prods.data)}`);
  }

  // 2. Customer categories
  console.log('\n2. Testing GET /api/customer/categories ...');
  const cats = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/customer/categories',
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  console.log(`   Status: HTTP ${cats.status}`);
  console.log(`   Success: ${cats.data?.success}`);
  console.log(`   Categories returned: ${cats.data?.data?.categories?.length || cats.data?.data?.length || 0}`);
  if (cats.status !== 200) {
    throw new Error(`Categories endpoint failed with status ${cats.status}: ${JSON.stringify(cats.data)}`);
  }

  // 3. User Registration
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const testUsername = `cust_${Date.now()}`;
  const testPassword = 'Password123!';
  console.log(`\n3. Testing POST /api/auth/register/user (${testEmail}) ...`);
  const reg = await makeRequest(
    {
      hostname: HOST,
      port: PORT,
      path: '/api/auth/register/user',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      firstName: 'Test',
      lastName: 'Customer',
      username: testUsername,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }
  );
  console.log(`   Status: HTTP ${reg.status}`);
  console.log(`   Success: ${reg.data?.success}`);
  console.log(`   User ID: ${reg.data?.data?.id}`);
  console.log(`   Token received: ${Boolean(reg.data?.data?.token)} (length: ${reg.data?.data?.token?.length || 0})`);
  if (reg.status !== 201 && reg.status !== 200) {
    throw new Error(`Register failed with status ${reg.status}: ${JSON.stringify(reg.data)}`);
  }

  // 4. User Login
  console.log(`\n4. Testing POST /api/auth/login ...`);
  const login = await makeRequest(
    {
      hostname: HOST,
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      identifier: testEmail,
      password: testPassword,
    }
  );
  console.log(`   Status: HTTP ${login.status}`);
  console.log(`   Success: ${login.data?.success}`);
  console.log(`   User Role: ${login.data?.data?.role} (${login.data?.data?.roleCode})`);
  const authToken = login.data?.data?.token;
  console.log(`   Auth Token received: ${Boolean(authToken)} (length: ${authToken?.length || 0})`);
  if (login.status !== 200 || !authToken) {
    throw new Error(`Login failed with status ${login.status}: ${JSON.stringify(login.data)}`);
  }

  // 5. Authenticated Request
  console.log(`\n5. Testing Authenticated GET /api/customer/profile with token ...`);
  const profile = await makeRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/customer/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json',
    },
  });
  console.log(`   Status: HTTP ${profile.status}`);
  console.log(`   Success: ${profile.data?.success}`);
  console.log(`   Profile Email: ${profile.data?.data?.user?.email || profile.data?.data?.email}`);
  if (profile.status !== 200) {
    throw new Error(`Profile request failed with status ${profile.status}: ${JSON.stringify(profile.data)}`);
  }

  console.log('\n============================================================');
  console.log('✅ ALL API & AUTHENTICATION ENDPOINTS WORKING ON 192.168.2.5:4000');
  console.log('============================================================\n');
}

run().catch((e) => {
  console.error('\n❌ Verification Failed:', e);
  process.exit(1);
});
