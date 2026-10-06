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
  console.log('========================================================================');
  console.log('COMPLETE END-TO-END SELLER ENDPOINTS VERIFICATION FOR SELLER A & B');
  console.log('========================================================================\n');

  const sellers = [
    { email: 'contact@apextech.com', name: 'Apex Tech (Seller A)' },
    { email: 'hello@artisanhome.com', name: 'Artisan Living (Seller B)' },
  ];

  for (const seller of sellers) {
    console.log(`>>> TESTING SELLER: ${seller.name} (${seller.email})`);
    
    // 1. Dashboard
    const dash = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Dashboard] HTTP ${dash.status} | Gross: Rs ${dash.data?.data?.kpis?.totalSales} | Orders: ${dash.data?.data?.kpis?.totalOrders} | Active Prods: ${dash.data?.data?.kpis?.activeProducts}`);

    // 2. Products
    const prods = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/products',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Products]  HTTP ${prods.status} | Total Items: ${prods.data?.data?.total}`);

    // 3. Inventory
    const inv = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/inventory',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Inventory] HTTP ${inv.status} | Total Tracked: ${inv.data?.data?.total}`);

    // 4. Orders
    const ords = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/orders',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Orders]    HTTP ${ords.status} | Total Orders: ${ords.data?.data?.total}`);

    // 5. Shipping
    const ship = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/shipping',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Shipping]  HTTP ${ship.status} | Total Shipments: ${ship.data?.data?.total}`);

    // 6. Earnings
    const earn = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/finance/earnings',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Earnings]  HTTP ${earn.status} | Gross: Rs ${earn.data?.data?.grossSales} | Net: Rs ${earn.data?.data?.netEarnings} | Tx Count: ${earn.data?.data?.transactions?.length}`);

    // 7. Commissions
    const comm = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/finance/commissions',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Commission]HTTP ${comm.status} | Total Records: ${comm.data?.data?.total}`);

    // 8. Payouts
    const pay = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/finance/payouts',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Payouts]   HTTP ${pay.status} | Total Records: ${pay.data?.data?.total}`);

    // 9. Returns
    const ret = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/returns',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Returns]   HTTP ${ret.status} | Total Returns: ${ret.data?.data?.total}`);

    // 10. Reviews
    const rev = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/reviews',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Reviews]   HTTP ${rev.status} | Total Reviews: ${rev.data?.data?.total}`);

    // 11. Notifications
    const notif = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Notifs]    HTTP ${notif.status} | Total Notifs: ${notif.data?.data?.total}`);

    // 12. Profile
    const prof = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/seller/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${seller.email}` },
    });
    console.log(`   [Profile]   HTTP ${prof.status} | Store Name: ${prof.data?.data?.storeName} | Business Category: ${prof.data?.data?.businessCategory}\n`);
  }
}

run().catch(console.error);
