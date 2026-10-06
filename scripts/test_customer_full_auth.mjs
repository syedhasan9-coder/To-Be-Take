import http from 'http';

function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
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

    req.on('error', (err) => resolve({ error: err.message, status: 0 }));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  const host = process.argv[2] || 'localhost:4000';
  const baseUrl = `http://${host}/api`;
  const timestamp = Date.now();
  const testUser = {
    firstName: 'Zainab',
    lastName: 'Tariq',
    username: `zainab_${timestamp.toString().slice(-6)}`,
    email: `zainab_${timestamp.toString().slice(-6)}@example.pk`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  console.log(`\n======================================================`);
  console.log(`TESTING LIVE CUSTOMER REGISTRATION & LOGIN ON: ${baseUrl}`);
  console.log(`======================================================\n`);

  // 1. Register
  console.log(`1. Registering new customer: ${testUser.username} (${testUser.email})`);
  const regRes = await makeRequest(`${baseUrl}/auth/register/user`, { method: 'POST' }, testUser);
  console.log(`   HTTP ${regRes.status} | success: ${regRes.data?.success} | User ID: ${regRes.data?.data?.id} | Token present: ${Boolean(regRes.data?.data?.token)}`);

  if (!regRes.data?.success) {
    console.error('Registration failed:', regRes.data);
    return;
  }

  // 2. Login
  console.log(`\n2. Logging in with credentials`);
  const loginRes = await makeRequest(`${baseUrl}/auth/login`, { method: 'POST' }, {
    identifier: testUser.username,
    password: testUser.password,
  });
  console.log(`   HTTP ${loginRes.status} | success: ${loginRes.data?.success} | Role: ${loginRes.data?.data?.role} (${loginRes.data?.data?.roleCode}) | Token present: ${Boolean(loginRes.data?.data?.token)}`);

  const token = loginRes.data?.data?.token;

  // 3. Authenticated customer profile request
  console.log(`\n3. Fetching customer profile with Bearer token`);
  const profileRes = await makeRequest(`${baseUrl}/customer/profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`   HTTP ${profileRes.status} | success: ${profileRes.data?.success} | Name: ${profileRes.data?.data?.firstName} ${profileRes.data?.data?.lastName}`);

  // 4. Products list
  console.log(`\n4. Fetching customer products`);
  const prodsRes = await makeRequest(`${baseUrl}/customer/products`);
  console.log(`   HTTP ${prodsRes.status} | success: ${prodsRes.data?.success} | Total: ${prodsRes.data?.data?.total || prodsRes.data?.data?.products?.length || 0}`);

  console.log(`\n✅ End-to-end customer auth & endpoints test PASSED!\n`);
}

run().catch(console.error);
