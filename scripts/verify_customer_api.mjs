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

    req.on('error', (err) => {
      resolve({ error: err.message, status: 0 });
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function verifyEndpoint(name, url, options = {}, body = null) {
  process.stdout.write(`Testing [${name}] -> ${url} ... `);
  const res = await makeRequest(url, options, body);
  if (res.error) {
    console.log(`FAILED: ${res.error}`);
    return false;
  }
  console.log(`HTTP ${res.status} | success: ${res.data?.success} | message: ${res.data?.message || 'OK'}`);
  return res.status >= 200 && res.status < 400;
}

async function main() {
  const host = process.argv[2] || 'localhost:4000';
  const baseUrl = `http://${host}/api`;

  console.log(`\n======================================================`);
  console.log(`VERIFYING TOBETAKE CUSTOMER & AUTH ENDPOINTS ON: ${baseUrl}`);
  console.log(`======================================================\n`);

  // 1. Health check
  await verifyEndpoint('Health Check', `${baseUrl}/health`);

  // 2. Customer Storefront
  await verifyEndpoint('Storefront', `${baseUrl}/customer/storefront`);

  // 3. Customer Categories
  await verifyEndpoint('Categories (customer/categories)', `${baseUrl}/customer/categories`);
  await verifyEndpoint('Categories (storefront/categories)', `${baseUrl}/customer/storefront/categories`);

  // 4. Customer Products
  await verifyEndpoint('Products (customer/products)', `${baseUrl}/customer/products`);

  // 5. Auth Login (reachable check)
  await verifyEndpoint('Auth Login Check', `${baseUrl}/auth/login`, { method: 'POST' }, {
    identifier: 'nonexistent_test_user@example.com',
    password: 'WrongPassword123!',
  });

  // 6. Auth Register (reachable check with validation error response)
  await verifyEndpoint('Auth Register Check', `${baseUrl}/auth/register/user`, { method: 'POST' }, {
    firstName: '',
  });

  console.log(`\nVerification run complete.\n`);
}

main().catch(console.error);
