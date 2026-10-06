import {
  PrismaClient,
  Prisma,
  UserStatus,
  ApprovalStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  PayoutStatus,
  ReturnStatus,
  ShippingStatus,
  ReviewStatus,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
const prisma = new PrismaClient();

const initialRoles = [
  {
    id: 1,
    name: 'Super Admin',
    code: 'SPADMIN',
    description: 'Super Administrator with full platform privileges',
  },
  {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    description: 'Platform Administrator',
  },
  {
    id: 3,
    name: 'Seller',
    code: 'VENDOR',
    description: 'Seller / Vendor account',
  },
  {
    id: 4,
    name: 'Buyer',
    code: 'CUST',
    description: 'Buyer / Customer account',
  },
];

const initialDepartments = [
  {
    id: 1,
    name: 'Administration',
    code: 'ADMN',
    description: 'Executive and Administrative Operations',
  },
  {
    id: 2,
    name: 'Operations',
    code: 'OPS',
    description: 'Platform and Marketplace Operations',
  },
  {
    id: 3,
    name: 'Finance & Accounting',
    code: 'FIN_ACC',
    description: 'Financial operations, billing, and settlements',
  },
  {
    id: 4,
    name: 'Sales',
    code: 'SALES',
    description: 'Sales and business development',
  },
  {
    id: 5,
    name: 'Marketing',
    code: 'MKTG',
    description: 'Brand marketing, campaigns, and user acquisition',
  },
  {
    id: 6,
    name: 'Customer Support',
    code: 'CS',
    description: 'Customer service and dispute resolution',
  },
  {
    id: 7,
    name: 'Human Resources',
    code: 'HR',
    description: 'Talent acquisition, employee relations, and organizational culture',
  },
  {
    id: 8,
    name: 'IT & Technology',
    code: 'IT_TECH',
    description: 'Infrastructure, cybersecurity, and engineering systems',
  },
  {
    id: 9,
    name: 'Product Management',
    code: 'PROD_MGMT',
    description: 'Product strategy, UX, and marketplace feature roadmaps',
  },
  {
    id: 10,
    name: 'Logistics & Fulfillment',
    code: 'LOG_FULFILL',
    description: 'Supply chain, warehousing, shipping, and order delivery logistics',
  },
  {
    id: 11,
    name: 'Risk & Compliance',
    code: 'RISK_COMP',
    description: 'Legal compliance, regulatory audit, and fraud prevention',
  },
];

const initialPermissions = [
  // Users
  {
    code: 'USERS_VIEW',
    name: 'View Users',
    description: 'View customer and user accounts',
    category: 'Users',
  },
  {
    code: 'USERS_MANAGE',
    name: 'Manage Users',
    description: 'Edit, activate, and deactivate users',
    category: 'Users',
  },
  {
    code: 'USERS_SUSPEND',
    name: 'Suspend Users',
    description: 'Suspend and reactivate user accounts',
    category: 'Users',
  },
  // Sellers
  {
    code: 'SELLERS_VIEW',
    name: 'View Sellers',
    description: 'View seller and vendor store details',
    category: 'Sellers',
  },
  {
    code: 'SELLERS_MANAGE',
    name: 'Manage Sellers',
    description: 'Update and manage seller information',
    category: 'Sellers',
  },
  {
    code: 'SELLERS_APPROVE',
    name: 'Approve Sellers',
    description: 'Approve, reject, or request changes for seller onboarding',
    category: 'Sellers',
  },
  // Admins
  {
    code: 'ADMINS_VIEW',
    name: 'View Admins',
    description: 'View administrator accounts and permissions',
    category: 'Admins',
  },
  {
    code: 'ADMINS_MANAGE',
    name: 'Manage Admins',
    description: 'Create and configure operational administrator accounts',
    category: 'Admins',
  },
  // Reports
  {
    code: 'REPORTS_VIEW',
    name: 'View Reports',
    description: 'Access marketplace performance and user reports',
    category: 'Reports',
  },
  {
    code: 'REPORTS_EXPORT',
    name: 'Export Reports',
    description: 'Export report data and platform summaries',
    category: 'Reports',
  },
  // Audit Logs
  {
    code: 'AUDIT_LOGS_VIEW',
    name: 'View Audit Logs',
    description: 'View platform security and operational audit logs',
    category: 'Audit Logs',
  },
  // Security
  {
    code: 'SECURITY_VIEW',
    name: 'View Security Center',
    description: 'Monitor login activity and active sessions',
    category: 'Security',
  },
  {
    code: 'SECURITY_MANAGE',
    name: 'Manage Security',
    description: 'Revoke sessions and manage authentication policies',
    category: 'Security',
  },
  // Settings
  {
    code: 'SETTINGS_VIEW',
    name: 'View Settings',
    description: 'View platform runtime configuration and toggles',
    category: 'Settings',
  },
  {
    code: 'SETTINGS_MANAGE',
    name: 'Manage Settings',
    description: 'Modify platform settings and operational modes',
    category: 'Settings',
  },
  // Dashboard
  {
    code: 'DASHBOARD_VIEW',
    name: 'View Dashboard',
    description: 'View platform KPI dashboards and analytics',
    category: 'Dashboard',
  },
  // Roles & Permissions
  {
    code: 'ROLES_VIEW',
    name: 'View Roles',
    description: 'View system roles and permission sets',
    category: 'Roles & Permissions',
  },
  {
    code: 'ROLES_MANAGE',
    name: 'Manage Roles',
    description: 'Configure and assign permissions to system roles',
    category: 'Roles & Permissions',
  },
  // Orders
  {
    code: 'ORDERS_VIEW',
    name: 'View Orders',
    description: 'View marketplace orders and tracking status',
    category: 'Orders',
  },
  {
    code: 'ORDERS_MANAGE',
    name: 'Manage Orders',
    description: 'Process, fulfill, and cancel customer orders',
    category: 'Orders',
  },
  // Products
  {
    code: 'PRODUCTS_VIEW',
    name: 'View Products',
    description: 'View catalog products and listings',
    category: 'Products',
  },
  {
    code: 'PRODUCTS_MANAGE',
    name: 'Manage Products',
    description: 'Create, edit, and deactivate catalog products',
    category: 'Products',
  },
  {
    code: 'PRODUCTS_MODERATE',
    name: 'Moderate Products',
    description: 'Approve, reject, and moderate product submissions',
    category: 'Products',
  },
  // Categories
  {
    code: 'CATEGORIES_VIEW',
    name: 'View Categories',
    description: 'View product category hierarchy',
    category: 'Categories',
  },
  {
    code: 'CATEGORIES_MANAGE',
    name: 'Manage Categories',
    description: 'Create and edit catalog categories',
    category: 'Categories',
  },
  // Inventory
  {
    code: 'INVENTORY_VIEW',
    name: 'View Inventory',
    description: 'View product stock and inventory levels',
    category: 'Inventory',
  },
  {
    code: 'INVENTORY_MANAGE',
    name: 'Manage Inventory',
    description: 'Adjust stock levels and restock items',
    category: 'Inventory',
  },
  // Customers
  {
    code: 'CUSTOMERS_VIEW',
    name: 'View Customers',
    description: 'View customer commerce profiles and purchase history',
    category: 'Customers',
  },
  // Payments
  {
    code: 'PAYMENTS_VIEW',
    name: 'View Payments',
    description: 'View payment transactions and payment statuses',
    category: 'Payments',
  },
  // Commissions
  {
    code: 'COMMISSIONS_VIEW',
    name: 'View Commissions',
    description: 'View marketplace platform commission ledger',
    category: 'Commissions',
  },
  {
    code: 'COMMISSIONS_MANAGE',
    name: 'Manage Commissions',
    description: 'Configure and adjust commission rates',
    category: 'Commissions',
  },
  // Payouts
  {
    code: 'PAYOUTS_VIEW',
    name: 'View Payouts',
    description: 'View seller payouts and balance ledger',
    category: 'Payouts',
  },
  {
    code: 'PAYOUTS_MANAGE',
    name: 'Manage Payouts',
    description: 'Process and disburse seller payouts',
    category: 'Payouts',
  },
  // Returns & Refunds
  {
    code: 'RETURNS_VIEW',
    name: 'View Returns',
    description: 'View return requests and refund statuses',
    category: 'Returns',
  },
  {
    code: 'RETURNS_MANAGE',
    name: 'Manage Returns',
    description: 'Approve, reject, and process refunds',
    category: 'Returns',
  },
  // Shipping
  {
    code: 'SHIPPING_VIEW',
    name: 'View Shipping',
    description: 'View shipments, carriers, and tracking status',
    category: 'Shipping',
  },
  {
    code: 'SHIPPING_MANAGE',
    name: 'Manage Shipping',
    description: 'Update shipments and configure shipping carriers',
    category: 'Shipping',
  },
  // Reviews & Moderation
  {
    code: 'REVIEWS_VIEW',
    name: 'View Reviews',
    description: 'View product ratings and reviews',
    category: 'Reviews',
  },
  {
    code: 'REVIEWS_MANAGE',
    name: 'Manage Reviews',
    description: 'Moderate, approve, and reject reviews',
    category: 'Reviews',
  },
  // Notifications
  {
    code: 'NOTIFICATIONS_VIEW',
    name: 'View Notifications',
    description: 'Access admin notification alerts center',
    category: 'Notifications',
  },
  {
    code: 'NOTIFICATIONS_MANAGE',
    name: 'Manage Notifications',
    description: 'Mark notifications as read or clear alerts',
    category: 'Notifications',
  },
];

const initialPlatformSettings = [
  {
    key: 'platform_name',
    value: 'To Be Take Marketplace',
    description: 'Marketplace display name',
    category: 'GENERAL',
    isPublic: true,
  },
  {
    key: 'platform_status',
    value: 'ONLINE',
    description: 'Current platform operating status (ONLINE, DEGRADED, MAINTENANCE)',
    category: 'GENERAL',
    isPublic: true,
  },
  {
    key: 'customer_registration_enabled',
    value: 'true',
    description: 'Allow new customer accounts to register',
    category: 'REGISTRATION',
    isPublic: true,
  },
  {
    key: 'seller_registration_enabled',
    value: 'true',
    description: 'Allow new sellers and vendors to register stores',
    category: 'REGISTRATION',
    isPublic: true,
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    description: 'Set entire platform to maintenance mode',
    category: 'MAINTENANCE',
    isPublic: true,
  },
  {
    key: 'maintenance_message',
    value: 'To Be Take is undergoing scheduled platform enhancements. We will be back shortly.',
    description: 'Message shown to visitors when maintenance mode is active',
    category: 'MAINTENANCE',
    isPublic: true,
  },
  {
    key: 'session_timeout_minutes',
    value: '120',
    description: 'Inactivity session timeout in minutes',
    category: 'SECURITY',
    isPublic: false,
  },
  {
    key: 'max_login_attempts',
    value: '5',
    description: 'Failed login attempts before temporary account lockout',
    category: 'SECURITY',
    isPublic: false,
  },
  {
    key: 'admin_audit_retention_days',
    value: '90',
    description: 'Number of days to retain administrative audit logs',
    category: 'SECURITY',
    isPublic: false,
  },
  {
    key: 'email_notifications_enabled',
    value: 'true',
    description: 'System-wide transactional email notifications enabled',
    category: 'NOTIFICATIONS',
    isPublic: false,
  },
  {
    key: 'admin_alert_notifications',
    value: 'true',
    description: 'Notify administrators of critical security alerts',
    category: 'NOTIFICATIONS',
    isPublic: false,
  },
];

export async function main() {
  console.log('🌱 Starting comprehensive database seed & Super Admin demo data generation...');

  // 1. Seed User Roles
  console.log('1. Seeding UserRoles...');
  for (const role of initialRoles) {
    const upsertedRole = await prisma.userRole.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
      },
      create: {
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description,
      },
    });
    console.log(`  ✓ Role: [${upsertedRole.id}] ${upsertedRole.name} (${upsertedRole.code})`);
  }

  // 2. Seed Departments
  console.log('2. Seeding Departments...');
  for (const dept of initialDepartments) {
    const upsertedDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        description: dept.description,
      },
      create: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
      },
    });
    console.log(`  ✓ Dept: [${upsertedDept.id}] ${upsertedDept.name} (${upsertedDept.code})`);
  }

  // 3. Seed Granular Permissions
  console.log('3. Seeding Platform Permissions...');
  const seededPermissions = [];
  for (const perm of initialPermissions) {
    const upsertedPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        description: perm.description,
        category: perm.category,
      },
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
        category: perm.category,
      },
    });
    seededPermissions.push(upsertedPerm);
  }
  console.log(`  ✓ Seeded ${seededPermissions.length} permissions`);

  // 4. Seed Role Permissions
  console.log('4. Assigning Role Permissions...');
  const spAdminRole = await prisma.userRole.findUnique({ where: { code: 'SPADMIN' } });
  const adminRole = await prisma.userRole.findUnique({ where: { code: 'ADMIN' } });

  if (spAdminRole) {
    for (const perm of seededPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: spAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: spAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
    console.log('  ✓ All permissions granted to SPADMIN role');
  }

  if (adminRole) {
    const adminPermCodes = [
      'USERS_VIEW',
      'USERS_MANAGE',
      'SELLERS_VIEW',
      'SELLERS_MANAGE',
      'SELLERS_APPROVE',
      'ADMINS_VIEW',
      'REPORTS_VIEW',
      'AUDIT_LOGS_VIEW',
      'SECURITY_VIEW',
      'SETTINGS_VIEW',
      'ORDERS_VIEW',
      'ORDERS_MANAGE',
      'PRODUCTS_VIEW',
      'PRODUCTS_MANAGE',
      'CATEGORIES_VIEW',
      'CATEGORIES_MANAGE',
      'INVENTORY_VIEW',
      'INVENTORY_MANAGE',
      'CUSTOMERS_VIEW',
      'PAYMENTS_VIEW',
      'COMMISSIONS_VIEW',
      'PAYOUTS_VIEW',
      'PAYOUTS_MANAGE',
      'RETURNS_VIEW',
      'RETURNS_MANAGE',
      'SHIPPING_VIEW',
      'SHIPPING_MANAGE',
      'REVIEWS_VIEW',
      'REVIEWS_MANAGE',
      'NOTIFICATIONS_VIEW',
      'NOTIFICATIONS_MANAGE',
    ];
    for (const perm of seededPermissions.filter((p) => adminPermCodes.includes(p.code))) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }
    console.log('  ✓ Operational permissions granted to ADMIN role');
  }

  // 5. Seed Platform Settings
  console.log('5. Seeding Platform Settings...');
  for (const setting of initialPlatformSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic,
      },
    });
  }
  console.log('  ✓ Platform settings seeded successfully');

  // 6. Reset PostgreSQL sequence counters to prevent collision on subsequent autoincrements
  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('user_roles', 'id'), COALESCE((SELECT MAX(id) FROM user_roles), 1))`,
    );
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1))`,
    );
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('permissions', 'id'), COALESCE((SELECT MAX(id) FROM permissions), 1))`,
    );
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('platform_settings', 'id'), COALESCE((SELECT MAX(id) FROM platform_settings), 1))`,
    );
    console.log('  ✓ PostgreSQL autoincrement sequence counters synchronized');
  } catch (err) {
    console.warn('  ⚠ Notice: Sequence counter synchronization skipped:', (err as Error).message);
  }

  // 7. Super Admin Bootstrap Process
  console.log('7. Checking Super Admin Bootstrap...');
  const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
  const superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL || 'superadmin@tobetake.dev'
  ).toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2026!';
  const superAdminFirstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const superAdminLastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ roleId: 1 }, { username: superAdminUsername }, { email: superAdminEmail }],
    },
  });

  let superAdminRecord = existingSuperAdmin;
  if (existingSuperAdmin) {
    console.log(
      `  ℹ Super Admin already exists (Username: ${existingSuperAdmin.username}, ID: ${existingSuperAdmin.id}). Preserving account.`,
    );
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);

    superAdminRecord = await prisma.user.create({
      data: {
        username: superAdminUsername,
        email: superAdminEmail,
        password: hashedPassword,
        firstName: superAdminFirstName,
        lastName: superAdminLastName,
        roleId: 1, // Super Admin
        departmentId: 1, // Administration
        designation: 'System Administrator',
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isMobileVerified: true,
        failedLoginAttempts: 0,
        isLocked: false,
        isDeleted: false,
        passwordChangedAt: new Date(),
        createdBy: null,
      },
    });

    console.log(
      `  ✓ Initial Super Admin bootstrapped successfully (ID: ${superAdminRecord.id}, Username: ${superAdminRecord.username}, Email: ${superAdminRecord.email})`,
    );
  }

  // 8. Realistic Pakistan Development Demo Data Seeding
  console.log('8. Seeding Pakistan Development Demo Data (Admins, Sellers, Customers, Approvals, Orders, Commerce)...');

  // Shared demo password for development accounts
  const demoUserPassword = process.env.DEMO_USER_PASSWORD || 'DevDemo@2026!';
  const hashedDemoPassword = await bcrypt.hash(demoUserPassword, 10);

  const baseDate = new Date();
  const getPastDate = (monthsAgo: number, daysAgo: number = 0): Date => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  // 8a. Operational Administrators (3 realistic Pakistani admins)
  const initialAdmins = [
    {
      username: 'admin_sarah',
      email: 'sarah.khan@tobetake.dev',
      firstName: 'Sarah',
      lastName: 'Khan',
      departmentId: 2, // Operations
      designation: 'Operations Lead',
      createdAt: getPastDate(5, 10),
    },
    {
      username: 'admin_usman',
      email: 'usman.tariq@tobetake.dev',
      firstName: 'Usman',
      lastName: 'Tariq',
      departmentId: 6, // Customer Support
      designation: 'Support Operations Manager',
      createdAt: getPastDate(3, 15),
    },
    {
      username: 'admin_ayesha',
      email: 'ayesha.siddiqui@tobetake.dev',
      firstName: 'Ayesha',
      lastName: 'Siddiqui',
      departmentId: 3, // Finance & Accounting
      designation: 'Finance Controller',
      createdAt: getPastDate(2, 5),
    },
  ];

  const adminRecords: Record<string, { id: string; username: string; email: string }> = {};

  for (const admin of initialAdmins) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ username: admin.username }, { email: admin.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: admin.username,
          email: admin.email,
          password: hashedDemoPassword,
          firstName: admin.firstName,
          lastName: admin.lastName,
          roleId: 2, // Operational Admin
          departmentId: admin.departmentId,
          designation: admin.designation,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isMobileVerified: true,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          createdAt: admin.createdAt,
          updatedAt: admin.createdAt,
          passwordChangedAt: admin.createdAt,
          createdBy: superAdminRecord?.id ?? null,
        },
      });
      console.log(`  ✓ Operational Admin created: @${user.username} (${user.email})`);
    } else {
      console.log(`  ℹ Operational Admin exists: @${user.username}`);
    }
    adminRecords[admin.username] = { id: user.id, username: user.username, email: user.email };
  }

  // 8b. Sellers / Vendors (8 realistic Pakistani sellers & businesses)
  const initialSellers = [
    {
      username: 'vendor_apex',
      email: 'contact@apextech.com',
      firstName: 'Muhammad',
      lastName: 'Ali',
      storeName: 'Al-Madina Electronics & Gadgets',
      businessCategory: 'Electronics & Gadgets',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(5, 18),
    },
    {
      username: 'vendor_artisan',
      email: 'hello@artisanhome.com',
      firstName: 'Zainab',
      lastName: 'Raza',
      storeName: 'Khaadi Crafts & Home Decor',
      businessCategory: 'Home & Living',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(4, 25),
    },
    {
      username: 'vendor_greenlife',
      email: 'support@greenlifeorganics.com',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      storeName: 'National Organic Goods',
      businessCategory: 'Health & Wellness',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(4, 5),
    },
    {
      username: 'vendor_velvetbloom',
      email: 'info@velvetbloom.com',
      firstName: 'Fatima',
      lastName: 'Mehmood',
      storeName: 'Gulberg Botanicals & Scents',
      businessCategory: 'Beauty & Wellness',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(3, 10),
    },
    {
      username: 'vendor_urbanstyle',
      email: 'sales@urbanstylethreads.com',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      storeName: 'Tariq Road Apparel & Fabrics',
      businessCategory: 'Fashion & Apparel',
      status: UserStatus.PENDING_VERIFICATION,
      createdAt: getPastDate(2, 20),
    },
    {
      username: 'vendor_nordiccraft',
      email: 'info@nordiccrafts.com',
      firstName: 'Tariq',
      lastName: 'Hassan',
      storeName: 'Chiniot Sheesham Woodcrafts',
      businessCategory: 'Home & Living',
      status: UserStatus.SUSPENDED,
      createdAt: getPastDate(1, 28),
    },
    {
      username: 'vendor_zenithgear',
      email: 'orders@zenithgear.com',
      firstName: 'Kamran',
      lastName: 'Akram',
      storeName: 'Sialkot Sports & Outdoor Gear',
      businessCategory: 'Sports & Outdoors',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(1, 2),
    },
    {
      username: 'vendor_pureharvest',
      email: 'care@pureharvestpantry.com',
      firstName: 'Hassan',
      lastName: 'Rizvi',
      storeName: 'Peshawar Dry Fruits & Pantry',
      businessCategory: 'Grocery & Food',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(0, 10),
    },
  ];

  const sellerRecords: Record<
    string,
    { id: string; username: string; email: string; storeName: string | null }
  > = {};

  for (const seller of initialSellers) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ username: seller.username }, { email: seller.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: seller.username,
          email: seller.email,
          password: hashedDemoPassword,
          firstName: seller.firstName,
          lastName: seller.lastName,
          roleId: 3, // Seller / Vendor
          storeName: seller.storeName,
          businessCategory: seller.businessCategory,
          status: seller.status,
          isEmailVerified: true,
          isMobileVerified: true,
          failedLoginAttempts: 0,
          isLocked: seller.status === UserStatus.SUSPENDED,
          isDeleted: false,
          createdAt: seller.createdAt,
          updatedAt: seller.createdAt,
          passwordChangedAt: seller.createdAt,
          createdBy: null,
        },
      });
      console.log(`  ✓ Seller created: @${user.username} (${user.storeName})`);
    } else {
      console.log(`  ℹ Seller exists: @${user.username}`);
    }
    sellerRecords[seller.username] = {
      id: user.id,
      username: user.username,
      email: user.email,
      storeName: user.storeName,
    };
  }

  // Index any existing registered vendors in DB so seed covers custom accounts as well
  const allExistingVendors = await prisma.user.findMany({
    where: { roleId: 3 },
  });
  for (const v of allExistingVendors) {
    if (!sellerRecords[v.username]) {
      sellerRecords[v.username] = {
        id: v.id,
        username: v.username,
        email: v.email,
        storeName: v.storeName,
      };
      console.log(`  ℹ Discovered existing registered vendor: @${v.username} (${v.email})`);
    }
  }

  // 8c. Customers / Buyers (Realistic Pakistani customer accounts)
  const initialCustomers = [
    {
      username: 'buyer_bilal',
      email: 'bilal.ahmed@example.pk',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(5, 28),
    },
    {
      username: 'buyer_fatima',
      email: 'fatima.khan@example.pk',
      firstName: 'Fatima',
      lastName: 'Khan',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(4, 20),
    },
    {
      username: 'buyer_zainab',
      email: 'zainab.raza@example.pk',
      firstName: 'Zainab',
      lastName: 'Raza',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(3, 15),
    },
    {
      username: 'buyer_hassan',
      email: 'hassan.ali@example.pk',
      firstName: 'Hassan',
      lastName: 'Ali',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(2, 10),
    },
    {
      username: 'buyer_ayesha',
      email: 'ayesha.siddiqui@example.pk',
      firstName: 'Ayesha',
      lastName: 'Siddiqui',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(1, 5),
    },
    {
      username: 'cust_olivia',
      email: 'ayesha.malik@example.pk',
      firstName: 'Ayesha',
      lastName: 'Malik',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(5, 26),
    },
    {
      username: 'cust_marcus',
      email: 'tariq.javed@example.pk',
      firstName: 'Tariq',
      lastName: 'Javed',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(5, 5),
    },
    {
      username: 'cust_sophia',
      email: 'fatima.zahra@example.pk',
      firstName: 'Fatima',
      lastName: 'Zahra',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(4, 18),
    },
    {
      username: 'cust_liam',
      email: 'bilal.farooq@example.pk',
      firstName: 'Bilal',
      lastName: 'Farooq',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(3, 24),
    },
    {
      username: 'cust_emma',
      email: 'sana.mirza@example.pk',
      firstName: 'Sana',
      lastName: 'Mirza',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(3, 4),
    },
    {
      username: 'cust_noah',
      email: 'usman.ghani@example.pk',
      firstName: 'Usman',
      lastName: 'Ghani',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(2, 16),
    },
    {
      username: 'cust_ava',
      email: 'zainab.tariq@example.pk',
      firstName: 'Zainab',
      lastName: 'Tariq',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(2, 2),
    },
    {
      username: 'cust_lucas',
      email: 'hamza.abbasi@example.pk',
      firstName: 'Hamza',
      lastName: 'Abbasi',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(1, 14),
    },
    {
      username: 'cust_isabella',
      email: 'maryam.nawaz@example.pk',
      firstName: 'Maryam',
      lastName: 'Nawaz',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(0, 28),
    },
    {
      username: 'cust_ethan',
      email: 'omer.khalid@example.pk',
      firstName: 'Omer',
      lastName: 'Khalid',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(0, 14),
    },
    {
      username: 'cust_mia',
      email: 'mahnoor.hassan@example.pk',
      firstName: 'Mahnoor',
      lastName: 'Hassan',
      status: UserStatus.ACTIVE,
      createdAt: getPastDate(0, 2),
    },
  ];

  const customerRecords: Record<string, { id: string; username: string; email: string }> = {};

  for (const cust of initialCustomers) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ username: cust.username }, { email: cust.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: cust.username,
          email: cust.email,
          password: hashedDemoPassword,
          firstName: cust.firstName,
          lastName: cust.lastName,
          roleId: 4, // Customer / Buyer
          status: cust.status,
          isEmailVerified: true,
          isMobileVerified: true,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          createdAt: cust.createdAt,
          updatedAt: cust.createdAt,
          passwordChangedAt: cust.createdAt,
          createdBy: null,
        },
      });
      console.log(`  ✓ Customer created: @${user.username} (${user.email})`);
    } else {
      console.log(`  ℹ Customer exists: @${user.username}`);
    }
    customerRecords[cust.username] = { id: user.id, username: user.username, email: user.email };
  }

  // 8d. Seller Onboarding Approvals (4 APPROVED, 2 PENDING, 1 REJECTED, 1 SUSPENDED)
  const sarahAdminId = adminRecords['admin_sarah']?.id ?? superAdminRecord?.id;
  const usmanAdminId = adminRecords['admin_usman']?.id ?? superAdminRecord?.id;
  const superAdminId = superAdminRecord?.id ?? sarahAdminId;

  const initialApprovals = [
    {
      sellerUsername: 'vendor_apex',
      status: ApprovalStatus.APPROVED,
      reviewedBy: superAdminId,
      notes: 'NTN, SECP registration, and Pakistani banking verified. Approved for electronics sales.',
      rejectionReason: null,
      submittedAt: getPastDate(5, 18),
      reviewedAt: getPastDate(5, 16),
    },
    {
      sellerUsername: 'vendor_artisan',
      status: ApprovalStatus.APPROVED,
      reviewedBy: sarahAdminId,
      notes: 'Handicraft catalog and trademark authorization documentation approved for home decor.',
      rejectionReason: null,
      submittedAt: getPastDate(4, 25),
      reviewedAt: getPastDate(4, 22),
    },
    {
      sellerUsername: 'vendor_greenlife',
      status: ApprovalStatus.APPROVED,
      reviewedBy: sarahAdminId,
      notes: 'Certified organic products verified and approved for botanical marketplace listings.',
      rejectionReason: null,
      submittedAt: getPastDate(4, 5),
      reviewedAt: getPastDate(4, 3),
    },
    {
      sellerUsername: 'vendor_velvetbloom',
      status: ApprovalStatus.APPROVED,
      reviewedBy: usmanAdminId,
      notes: 'Cosmetics formulation compliance, PSQCA certificates, and brand registration verified.',
      rejectionReason: null,
      submittedAt: getPastDate(3, 10),
      reviewedAt: getPastDate(3, 8),
    },
    {
      sellerUsername: 'vendor_urbanstyle',
      status: ApprovalStatus.PENDING,
      reviewedBy: null,
      notes: 'Initial seller onboarding request submitted. Pending review by Operations team.',
      rejectionReason: null,
      submittedAt: getPastDate(2, 20),
      reviewedAt: null,
    },
    {
      sellerUsername: 'vendor_pureharvest',
      status: ApprovalStatus.PENDING,
      reviewedBy: null,
      notes: 'Pantry organic supplier application awaiting Punjab Food Authority license validation.',
      rejectionReason: null,
      submittedAt: getPastDate(0, 10),
      reviewedAt: null,
    },
    {
      sellerUsername: 'vendor_zenithgear',
      status: ApprovalStatus.REJECTED,
      reviewedBy: sarahAdminId,
      notes: 'Seller notified to upload missing Sialkot Chamber of Commerce certificate.',
      rejectionReason: 'Missing authorized brand distribution agreement.',
      submittedAt: getPastDate(1, 2),
      reviewedAt: getPastDate(0, 25),
    },
    {
      sellerUsername: 'vendor_nordiccraft',
      status: ApprovalStatus.SUSPENDED,
      reviewedBy: superAdminId,
      notes: 'Store temporarily suspended pending woodwork origin authenticity review.',
      rejectionReason: null,
      submittedAt: getPastDate(1, 28),
      reviewedAt: getPastDate(0, 18),
    },
  ];

  for (const app of initialApprovals) {
    const seller = sellerRecords[app.sellerUsername];
    if (!seller) continue;

    const existingApproval = await prisma.sellerApproval.findFirst({
      where: { sellerId: seller.id },
    });

    if (!existingApproval) {
      await prisma.sellerApproval.create({
        data: {
          sellerId: seller.id,
          status: app.status,
          reviewedBy: app.reviewedBy,
          notes: app.notes,
          rejectionReason: app.rejectionReason,
          submittedAt: app.submittedAt,
          reviewedAt: app.reviewedAt,
          createdAt: app.submittedAt,
          updatedAt: app.reviewedAt || app.submittedAt,
        },
      });
      console.log(`  ✓ Seller approval created for @${app.sellerUsername} [${app.status}]`);
    } else {
      console.log(`  ℹ Seller approval exists for @${app.sellerUsername}`);
    }
  }

  // 8e. Product Categories (Hierarchical parent & subcategories)
  console.log('8e. Seeding Categories...');
  const categoriesToSeed = [
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      description: 'Consumer audio, smart home devices, and computing peripherals',
      parentSlug: null,
      displayOrder: 1,
    },
    {
      name: 'Audio & Headphones',
      slug: 'audio-headphones',
      description: 'Wireless earbuds, noise-cancelling headphones, and studio speakers',
      parentSlug: 'electronics-gadgets',
      displayOrder: 2,
    },
    {
      name: 'Smart Devices & Wearables',
      slug: 'smart-devices-wearables',
      description: 'Smart ambient sensors, fitness trackers, and connected devices',
      parentSlug: 'electronics-gadgets',
      displayOrder: 3,
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Handcrafted furniture, ceramics, and botanical decor',
      parentSlug: null,
      displayOrder: 4,
    },
    {
      name: 'Ceramics & Tableware',
      slug: 'ceramics-tableware',
      description: 'Artisan ceramic teapots, stoneware plates, and dinner sets',
      parentSlug: 'home-living',
      displayOrder: 5,
    },
    {
      name: 'Botanical & Planters',
      slug: 'botanical-planters',
      description: 'Terracotta planters, indoor pots, and botanical stands',
      parentSlug: 'home-living',
      displayOrder: 6,
    },
    {
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      description: 'Botanical skincare, organic haircare, and aromatherapy oils',
      parentSlug: null,
      displayOrder: 7,
    },
    {
      name: 'Botanical Skincare',
      slug: 'botanical-skincare',
      description: 'Cold-pressed oils, rosehip night serums, and hydrating mists',
      parentSlug: 'beauty-wellness',
      displayOrder: 8,
    },
    {
      name: 'Aromatherapy & Oils',
      slug: 'aromatherapy-oils',
      description: 'Pure essential oils, diffusers, and soothing balms',
      parentSlug: 'beauty-wellness',
      displayOrder: 9,
    },
    {
      name: 'Grocery & Food',
      slug: 'grocery-food',
      description: 'Organic pantry goods, specialty oils, and herbal teas',
      parentSlug: null,
      displayOrder: 10,
    },
  ];

  const categoryMap: Record<string, number> = {};

  for (const cat of categoriesToSeed) {
    let parentId: number | null = null;
    if (cat.parentSlug && categoryMap[cat.parentSlug]) {
      parentId = categoryMap[cat.parentSlug];
    }

    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        parentId,
        displayOrder: cat.displayOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId,
        isActive: true,
        displayOrder: cat.displayOrder,
      },
    });
    categoryMap[cat.slug] = upsertedCat.id;
    console.log(`  ✓ Category: [${upsertedCat.id}] ${upsertedCat.name} (${upsertedCat.slug})`);
  }

  // 8f. Catalog Products & Inventory Items (Realistic PKR Prices)
  console.log('8f. Seeding Marketplace Products & Stock Levels in PKR...');
  const productsToSeed = [
    {
      sellerUsername: 'vendor_artisan',
      categorySlug: 'ceramics-tableware',
      name: 'Handcrafted Multani Blue Pottery Teapot Set',
      slug: 'handcrafted-multani-blue-pottery-teapot-set',
      sku: 'ART-CER-001',
      description:
        'Authentic Multani handcrafted ceramic teapot with 4 matching chai cups featuring traditional floral glazed motifs.',
      price: new Decimal('3500.00'),
      compareAtPrice: new Decimal('4200.00'),
      costPrice: new Decimal('1800.00'),
      status: ProductStatus.ACTIVE,
      images: [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500',
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500',
      ],
      stockQuantity: 45,
      reservedQuantity: 5,
      lowStockThreshold: 10,
      location: 'Karachi Central Hub, Bin B-12',
      createdAt: getPastDate(4, 20),
    },
    {
      sellerUsername: 'vendor_artisan',
      categorySlug: 'botanical-planters',
      name: 'Handcrafted Multani Terracotta Planter Large',
      slug: 'handcrafted-multani-terracotta-planter-large',
      sku: 'ART-PLT-002',
      description:
        'Porcelain-lined terracotta planter with natural drainage hole, optimal for indoor monstera and money plants.',
      price: new Decimal('1850.00'),
      compareAtPrice: new Decimal('2400.00'),
      costPrice: new Decimal('800.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500'],
      stockQuantity: 8, // Low stock demo trigger
      reservedQuantity: 2,
      lowStockThreshold: 10,
      location: 'Karachi Central Hub, Floor Rack A',
      createdAt: getPastDate(4, 15),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'audio-headphones',
      name: 'Al-Madina Pro Wireless ANC Earbuds',
      slug: 'al-madina-pro-wireless-anc-earbuds',
      sku: 'APX-AUD-101',
      description:
        'High-resolution wireless earbuds with active hybrid noise cancellation, 32-hour battery life, and IPX7 water rating.',
      price: new Decimal('6500.00'),
      compareAtPrice: new Decimal('8500.00'),
      costPrice: new Decimal('3500.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
      stockQuantity: 80,
      reservedQuantity: 6,
      lowStockThreshold: 15,
      location: 'Hafeez Centre Warehouse, Shelf 1',
      createdAt: getPastDate(5, 10),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'smart-devices-wearables',
      name: 'Smart Ambient Climate & Air Sensor',
      slug: 'smart-ambient-climate-air-sensor',
      sku: 'APX-SMT-202',
      description:
        'Compact wireless humidity, temperature, and AQI air quality monitor with smartphone app integration.',
      price: new Decimal('3200.00'),
      compareAtPrice: new Decimal('4000.00'),
      costPrice: new Decimal('1600.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=500'],
      stockQuantity: 25,
      reservedQuantity: 3,
      lowStockThreshold: 8,
      location: 'Hafeez Centre Warehouse, Shelf 4',
      createdAt: getPastDate(5, 2),
    },
    {
      sellerUsername: 'vendor_greenlife',
      categorySlug: 'botanical-skincare',
      name: 'Pure Swat Rosehip Night Elixir 50ml',
      slug: 'pure-swat-rosehip-night-elixir-50ml',
      sku: 'GRN-SKN-301',
      description:
        'Cold-pressed virgin rosehip seed oil from northern valleys infused with botanical vitamin E and frankincense oil.',
      price: new Decimal('2450.00'),
      compareAtPrice: new Decimal('3000.00'),
      costPrice: new Decimal('1100.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1608248597359-593685d3fef1?w=500'],
      stockQuantity: 60,
      reservedQuantity: 4,
      lowStockThreshold: 12,
      location: 'Islamabad Botanicals Hub, Bay 2',
      createdAt: getPastDate(3, 28),
    },
    {
      sellerUsername: 'vendor_greenlife',
      categorySlug: 'aromatherapy-oils',
      name: 'Pure Swat Lavender Essential Oil 30ml',
      slug: 'pure-swat-lavender-essential-oil-30ml',
      sku: 'GRN-OIL-302',
      description:
        'Steam-distilled therapeutic-grade Lavandula essential oil from Swat valley for aroma diffusers and relaxation.',
      price: new Decimal('1650.00'),
      compareAtPrice: new Decimal('2100.00'),
      costPrice: new Decimal('750.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500'],
      stockQuantity: 3, // Low stock demo trigger
      reservedQuantity: 1,
      lowStockThreshold: 10,
      location: 'Islamabad Botanicals Hub, Bay 3',
      createdAt: getPastDate(3, 20),
    },
    {
      sellerUsername: 'vendor_velvetbloom',
      categorySlug: 'botanical-skincare',
      name: 'Organic Velvet Body Soufflé 200g',
      slug: 'organic-velvet-body-souffle-200g',
      sku: 'VLT-BDY-401',
      description:
        'Whipped organic shea butter enriched with jojoba oil, green tea extracts, and natural almond fragrance.',
      price: new Decimal('2200.00'),
      compareAtPrice: new Decimal('2800.00'),
      costPrice: new Decimal('950.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'],
      stockQuantity: 35,
      reservedQuantity: 2,
      lowStockThreshold: 8,
      location: 'Gulberg Lahore Hub, Bodycare Bay 1',
      createdAt: getPastDate(2, 15),
    },
    {
      sellerUsername: 'vendor_pureharvest',
      categorySlug: 'grocery-food',
      name: 'Chakwal Cold-Pressed Extra Virgin Olive Oil 750ml',
      slug: 'chakwal-cold-pressed-olive-oil-750ml',
      sku: 'PUR-OIL-501',
      description:
        'Single-orchard harvest extra virgin olive oil from Chakwal valley, cold-pressed within hours of harvest.',
      price: new Decimal('2100.00'),
      compareAtPrice: new Decimal('2600.00'),
      costPrice: new Decimal('1100.00'),
      status: ProductStatus.PENDING_REVIEW,
      images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500'],
      stockQuantity: 50,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      location: 'Peshawar Pantry Hub, P-1',
      createdAt: getPastDate(0, 8),
    },
    {
      sellerUsername: 'vendor_artisan',
      categorySlug: 'ceramics-tableware',
      name: 'Handcrafted Multani Clay Chai Cups (Set of 2)',
      slug: 'handcrafted-multani-clay-chai-cups-set-of-2',
      sku: 'ART-CER-003',
      description:
        'Traditional glazed terracotta Chai Matka cups with handcrafted smooth matte interior for authentic Karak chai.',
      price: new Decimal('1200.00'),
      compareAtPrice: new Decimal('1600.00'),
      costPrice: new Decimal('500.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'],
      stockQuantity: 28,
      reservedQuantity: 2,
      lowStockThreshold: 8,
      location: 'Karachi Central Hub, Bin C-4',
      createdAt: getPastDate(3, 12),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'audio-headphones',
      name: 'Al-Madina Studio Pro Wireless Headphones',
      slug: 'al-madina-studio-pro-wireless-headphones',
      sku: 'APX-AUD-102',
      description:
        'Audiophile-grade dynamic drivers with bespoke spatial acoustics, ultra-plush memory foam, and 45h playback.',
      price: new Decimal('12500.00'),
      compareAtPrice: new Decimal('15000.00'),
      costPrice: new Decimal('6800.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      stockQuantity: 40,
      reservedQuantity: 3,
      lowStockThreshold: 10,
      location: 'Hafeez Centre Warehouse, Shelf 2',
      createdAt: getPastDate(4, 1),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'electronics-gadgets',
      name: 'Al-Madina Ultra 4K Pro Streaming Webcam',
      slug: 'al-madina-ultra-4k-pro-streaming-webcam',
      sku: 'APX-CAM-301',
      description:
        'Ultra-sharp 4K HDR Sony sensor webcam with dual beamforming noise cancellation microphones and privacy cover.',
      price: new Decimal('7500.00'),
      compareAtPrice: new Decimal('9500.00'),
      costPrice: new Decimal('3800.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
      stockQuantity: 50,
      reservedQuantity: 4,
      lowStockThreshold: 10,
      location: 'Hafeez Centre Warehouse, Shelf 3',
      createdAt: getPastDate(3, 15),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'smart-devices-wearables',
      name: 'Al-Madina Chrono Pulse Smart Fitness Watch',
      slug: 'al-madina-chrono-pulse-smart-fitness-watch',
      sku: 'APX-WAT-401',
      description:
        'AMOLED display fitness smartwatch with continuous heart rate, SpO2 sensor, GPS, Urdu notification support, and 14-day battery.',
      price: new Decimal('8900.00'),
      compareAtPrice: new Decimal('11500.00'),
      costPrice: new Decimal('4500.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      stockQuantity: 35,
      reservedQuantity: 2,
      lowStockThreshold: 8,
      location: 'Hafeez Centre Warehouse, Shelf 5',
      createdAt: getPastDate(3, 10),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'electronics-gadgets',
      name: 'Al-Madina GaN 100W Fast Multi-Device Charger',
      slug: 'al-madina-gan-100w-fast-multi-device-charger',
      sku: 'APX-CHG-501',
      description:
        'Compact Gallium Nitride 4-port fast wall charger with PD 3.0 and intelligent power sharing for laptop and phone.',
      price: new Decimal('3800.00'),
      compareAtPrice: new Decimal('4800.00'),
      costPrice: new Decimal('1900.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500'],
      stockQuantity: 60,
      reservedQuantity: 5,
      lowStockThreshold: 12,
      location: 'Hafeez Centre Warehouse, Shelf 6',
      createdAt: getPastDate(2, 20),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'audio-headphones',
      name: 'Al-Madina Studio USB Condenser Microphone',
      slug: 'al-madina-studio-usb-condenser-microphone',
      sku: 'APX-MIC-601',
      description:
        'Professional cardioid broadcast microphone with zero-latency monitoring and built-in pop filter.',
      price: new Decimal('8500.00'),
      compareAtPrice: new Decimal('11000.00'),
      costPrice: new Decimal('4200.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
      stockQuantity: 20,
      reservedQuantity: 1,
      lowStockThreshold: 5,
      location: 'Hafeez Centre Warehouse, Shelf 7',
      createdAt: getPastDate(2, 10),
    },
    {
      sellerUsername: 'vendor_apex',
      categorySlug: 'electronics-gadgets',
      name: 'Al-Madina 12-in-1 Dual 4K USB-C Docking Station',
      slug: 'al-madina-12-in-1-dual-4k-usbc-docking-station',
      sku: 'APX-HUB-701',
      description:
        'Universal aluminum docking hub with Dual HDMI 4K@60Hz, 100W PD passthrough, Gigabit Ethernet, and SD slots.',
      price: new Decimal('6800.00'),
      compareAtPrice: new Decimal('8500.00'),
      costPrice: new Decimal('3200.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
      stockQuantity: 30,
      reservedQuantity: 2,
      lowStockThreshold: 6,
      location: 'Hafeez Centre Warehouse, Shelf 8',
      createdAt: getPastDate(1, 15),
    },
    {
      sellerUsername: 'vendor_artisan',
      categorySlug: 'home-living',
      name: 'Handwoven Lahore Wool Carpet Runner',
      slug: 'handwoven-lahore-wool-carpet-runner',
      sku: 'ART-RUG-004',
      description:
        'Traditional geometric motif runner rug handwoven by master artisans with 100% natural organic wool.',
      price: new Decimal('16500.00'),
      compareAtPrice: new Decimal('21000.00'),
      costPrice: new Decimal('8000.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500'],
      stockQuantity: 12,
      reservedQuantity: 1,
      lowStockThreshold: 4,
      location: 'Karachi Central Hub, Carpet Rack A',
      createdAt: getPastDate(2, 25),
    },
    {
      sellerUsername: 'vendor_artisan',
      categorySlug: 'home-living',
      name: 'Handcrafted Gujranwala Brass Table Lamp',
      slug: 'handcrafted-gujranwala-brass-table-lamp',
      sku: 'ART-LMP-005',
      description:
        'Warm ambient accent lamp with hand-hammered antique brass base and textured organic linen shade.',
      price: new Decimal('7800.00'),
      compareAtPrice: new Decimal('9800.00'),
      costPrice: new Decimal('3800.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
      stockQuantity: 15,
      reservedQuantity: 2,
      lowStockThreshold: 5,
      location: 'Karachi Central Hub, Lighting Rack B',
      createdAt: getPastDate(2, 18),
    },
    {
      sellerUsername: 'vendor_velvetbloom',
      categorySlug: 'aromatherapy-oils',
      name: 'Murree Pine Aroma Room Diffuser',
      slug: 'murree-pine-aroma-room-diffuser',
      sku: 'VLT-ARO-402',
      description:
        'Ultrasonic cool-mist aromatherapy diffuser with real bamboo housing and ambient warm LED glow.',
      price: new Decimal('2650.00'),
      compareAtPrice: new Decimal('3400.00'),
      costPrice: new Decimal('1100.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500'],
      stockQuantity: 18,
      reservedQuantity: 2,
      lowStockThreshold: 5,
      location: 'Gulberg Lahore Hub, Aromatics Bay 4',
      createdAt: getPastDate(2, 5),
    },
    {
      sellerUsername: 'vendor_greenlife',
      categorySlug: 'grocery-food',
      name: 'Hunza Valley Organic Herbal Green Tea 100g',
      slug: 'hunza-valley-organic-herbal-green-tea-100g',
      sku: 'GRN-TEA-303',
      description:
        'Premium grade handpicked loose green tea from the pristine high-altitude orchards of Hunza Valley.',
      price: new Decimal('1250.00'),
      compareAtPrice: new Decimal('1600.00'),
      costPrice: new Decimal('550.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500'],
      stockQuantity: 55,
      reservedQuantity: 5,
      lowStockThreshold: 12,
      location: 'Islamabad Botanicals Hub, Bay 1',
      createdAt: getPastDate(3, 1),
    },
    {
      sellerUsername: 'vendor_nordiccraft',
      categorySlug: 'home-living',
      name: 'Handcrafted Chiniot Sheesham Wood Serving Board',
      slug: 'handcrafted-chiniot-sheesham-wood-serving-board',
      sku: 'NOR-WOD-601',
      description:
        'Sustainably sourced authentic Chiniot Sheesham hardwood board finished with food-grade organic beeswax.',
      price: new Decimal('3800.00'),
      compareAtPrice: new Decimal('4800.00'),
      costPrice: new Decimal('1600.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1590736969955-71cc94801759?w=500'],
      stockQuantity: 0, // OUT OF STOCK demo trigger
      reservedQuantity: 0,
      lowStockThreshold: 10,
      location: 'Chiniot Woodcrafts Bay 1',
      createdAt: getPastDate(1, 20),
    },
    {
      sellerUsername: 'vendor_zenithgear',
      categorySlug: 'home-living',
      name: 'Sialkot Ultralight Mountain Trail Backpack 30L',
      slug: 'sialkot-ultralight-mountain-trail-backpack-30l',
      sku: 'ZNT-CAM-701',
      description:
        'Durable water-resistant Cordura trail backpack crafted in Sialkot with ergonomic load-bearing lumbar support.',
      price: new Decimal('5500.00'),
      compareAtPrice: new Decimal('7000.00'),
      costPrice: new Decimal('2600.00'),
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500'],
      stockQuantity: 15,
      reservedQuantity: 1,
      lowStockThreshold: 5,
      location: 'Sialkot Gear Hub, Bay 2',
      createdAt: getPastDate(1, 1),
    },
  ];

  const productRecords: Record<string, { id: string; name: string; sku: string; price: Decimal; sellerId: string }> = {};

  // Clean up stale test products while keeping manual user products intact
  await prisma.product.updateMany({
    where: {
      OR: [
        { sku: { startsWith: 'APEX-E2E-' } },
        { sku: { startsWith: 'APEX-QA-' } },
      ],
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: ProductStatus.INACTIVE,
    },
  });

  for (const p of productsToSeed) {
    const seller = sellerRecords[p.sellerUsername];
    if (!seller) continue;

    const categoryId = categoryMap[p.categorySlug] ?? null;

    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        sellerId: seller.id,
        categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        status: p.status,
        images: p.images,
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        sellerId: seller.id,
        categoryId,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        status: p.status,
        images: p.images,
        isDeleted: false,
        deletedAt: null,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      },
    });

    await prisma.inventoryItem.upsert({
      where: { productId: prod.id },
      update: {
        sku: prod.sku,
        stockQuantity: p.stockQuantity,
        reservedQuantity: p.reservedQuantity,
        lowStockThreshold: p.lowStockThreshold,
        location: p.location,
      },
      create: {
        productId: prod.id,
        sku: prod.sku,
        stockQuantity: p.stockQuantity,
        reservedQuantity: p.reservedQuantity,
        lowStockThreshold: p.lowStockThreshold,
        location: p.location,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      },
    });

    console.log(`  ✓ Product & Stock upserted: "${prod.name}" (SKU: ${prod.sku}, Seller: ${seller.username})`);

    productRecords[p.sku] = {
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      price: prod.price,
      sellerId: seller.id,
    };
  }

  // 8g. Marketplace Customer Orders, OrderItems, Payments, Commissions, Shipments (PKR & Pakistani Carriers)
  console.log('8g. Seeding Orders, Payments, Commissions, & Shipments in PKR...');

  const ordersToSeed = [
    {
      orderNumber: 'ORD-1001',
      customerUsername: 'cust_olivia',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('7000.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('7000.00'),
      shippingAddress: 'House 12-B, Street 5, Block 4, Clifton, Karachi, Sindh, 75600, Pakistan',
      billingAddress: 'House 12-B, Street 5, Block 4, Clifton, Karachi, Sindh, 75600, Pakistan',
      items: [
        {
          productSku: 'ART-CER-001',
          quantity: 2,
          unitPrice: new Decimal('3500.00'),
          totalPrice: new Decimal('7000.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1001-RAAST',
        paymentMethod: 'JazzCash / Raast',
        amount: new Decimal('7000.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('700.00'),
        sellerEarnings: new Decimal('6300.00'),
      },
      shipment: {
        carrier: 'TCS Express',
        trackingNumber: 'TCS-9988112233',
        status: ShippingStatus.DELIVERED,
      },
      createdAt: getPastDate(4, 10),
    },
    {
      orderNumber: 'ORD-1002',
      customerUsername: 'cust_marcus',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('6500.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('6500.00'),
      shippingAddress: 'Shop 14, Hafeez Centre, Main Boulevard, Gulberg III, Lahore, Punjab, 54000, Pakistan',
      billingAddress: 'Shop 14, Hafeez Centre, Main Boulevard, Gulberg III, Lahore, Punjab, 54000, Pakistan',
      items: [
        {
          productSku: 'APX-AUD-101',
          quantity: 1,
          unitPrice: new Decimal('6500.00'),
          totalPrice: new Decimal('6500.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1002-EASYPAISA',
        paymentMethod: 'EasyPaisa',
        amount: new Decimal('6500.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('650.00'),
        sellerEarnings: new Decimal('5850.00'),
      },
      shipment: {
        carrier: 'Leopards Courier',
        trackingNumber: 'LEO-4433221100',
        status: ShippingStatus.DELIVERED,
      },
      createdAt: getPastDate(3, 18),
    },
    {
      orderNumber: 'ORD-1003',
      customerUsername: 'cust_sophia',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('4900.00'),
      shippingTotal: new Decimal('250.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('5150.00'),
      shippingAddress: 'House 22, Street 8, Sector F-7/2, Islamabad, ICT, 44000, Pakistan',
      billingAddress: 'House 22, Street 8, Sector F-7/2, Islamabad, ICT, 44000, Pakistan',
      items: [
        {
          productSku: 'GRN-SKN-301',
          quantity: 2,
          unitPrice: new Decimal('2450.00'),
          totalPrice: new Decimal('4900.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1003-MEEZAN',
        paymentMethod: 'Bank Transfer (Meezan Bank)',
        amount: new Decimal('5150.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('490.00'),
        sellerEarnings: new Decimal('4410.00'),
      },
      shipment: {
        carrier: 'Trax Logistics',
        trackingNumber: 'TRAX-7766554433',
        status: ShippingStatus.DELIVERED,
      },
      createdAt: getPastDate(2, 22),
    },
    {
      orderNumber: 'ORD-1004',
      customerUsername: 'cust_liam',
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('5550.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('5550.00'),
      shippingAddress: 'Flat 402, Al-Rahim Heights, University Road, Peshawar, Khyber Pakhtunkhwa, 25000, Pakistan',
      billingAddress: 'Flat 402, Al-Rahim Heights, University Road, Peshawar, Khyber Pakhtunkhwa, 25000, Pakistan',
      items: [
        {
          productSku: 'ART-PLT-002',
          quantity: 3,
          unitPrice: new Decimal('1850.00'),
          totalPrice: new Decimal('5550.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1004-COD',
        paymentMethod: 'Cash on Delivery (COD)',
        amount: new Decimal('5550.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('555.00'),
        sellerEarnings: new Decimal('4995.00'),
      },
      shipment: {
        carrier: 'Pakistan Post',
        trackingNumber: 'PKPOST-8877665544',
        status: ShippingStatus.IN_TRANSIT,
      },
      createdAt: getPastDate(0, 14),
    },
    {
      orderNumber: 'ORD-1005',
      customerUsername: 'cust_emma',
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('3200.00'),
      shippingTotal: new Decimal('200.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('3400.00'),
      shippingAddress: 'House 55, Street 4, Satellite Town, Rawalpindi, Punjab, 46000, Pakistan',
      billingAddress: 'House 55, Street 4, Satellite Town, Rawalpindi, Punjab, 46000, Pakistan',
      items: [
        {
          productSku: 'APX-SMT-202',
          quantity: 1,
          unitPrice: new Decimal('3200.00'),
          totalPrice: new Decimal('3200.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1005-JAZZCASH',
        paymentMethod: 'JazzCash',
        amount: new Decimal('3400.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('320.00'),
        sellerEarnings: new Decimal('2880.00'),
      },
      shipment: {
        carrier: 'TCS Express',
        trackingNumber: 'TCS-1122334455',
        status: ShippingStatus.LABEL_CREATED,
      },
      createdAt: getPastDate(0, 4),
    },
    {
      orderNumber: 'ORD-1006',
      customerUsername: 'cust_noah',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: new Decimal('2200.00'),
      shippingTotal: new Decimal('250.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('2450.00'),
      shippingAddress: 'House 8-A, Canal Road, Faisalabad, Punjab, 38000, Pakistan',
      billingAddress: 'House 8-A, Canal Road, Faisalabad, Punjab, 38000, Pakistan',
      items: [
        {
          productSku: 'VLT-BDY-401',
          quantity: 1,
          unitPrice: new Decimal('2200.00'),
          totalPrice: new Decimal('2200.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1006-PENDING',
        paymentMethod: 'Cash on Delivery (COD)',
        amount: new Decimal('2450.00'),
        status: PaymentStatus.PENDING,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('220.00'),
        sellerEarnings: new Decimal('1980.00'),
      },
      shipment: {
        carrier: 'Call Courier',
        trackingNumber: 'CC-PENDING-1006',
        status: ShippingStatus.PENDING,
      },
      createdAt: getPastDate(0, 1),
    },
    {
      orderNumber: 'ORD-1007',
      customerUsername: 'cust_ava',
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('12500.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('12500.00'),
      shippingAddress: 'House 19-C, Cantt Area, Multan, Punjab, 60000, Pakistan',
      billingAddress: 'House 19-C, Cantt Area, Multan, Punjab, 60000, Pakistan',
      items: [
        {
          productSku: 'APX-AUD-102',
          quantity: 1,
          unitPrice: new Decimal('12500.00'),
          totalPrice: new Decimal('12500.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1007-HBL',
        paymentMethod: 'Bank Transfer (HBL Pay)',
        amount: new Decimal('12500.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('1250.00'),
        sellerEarnings: new Decimal('11250.00'),
      },
      shipment: {
        carrier: 'TCS Express',
        trackingNumber: 'TCS-4455667788',
        status: ShippingStatus.LABEL_CREATED,
      },
      createdAt: getPastDate(0, 2),
    },
    {
      orderNumber: 'ORD-1008',
      customerUsername: 'cust_lucas',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('2400.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('2400.00'),
      shippingAddress: 'House 34, Street 2, Jinnah Town, Quetta, Balochistan, 87300, Pakistan',
      billingAddress: 'House 34, Street 2, Jinnah Town, Quetta, Balochistan, 87300, Pakistan',
      items: [
        {
          productSku: 'ART-CER-003',
          quantity: 2,
          unitPrice: new Decimal('1200.00'),
          totalPrice: new Decimal('2400.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1008-EASYPAISA',
        paymentMethod: 'EasyPaisa',
        amount: new Decimal('2400.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('240.00'),
        sellerEarnings: new Decimal('2160.00'),
      },
      shipment: {
        carrier: 'M&P Express',
        trackingNumber: 'MNP-7766112233',
        status: ShippingStatus.DELIVERED,
      },
      createdAt: getPastDate(1, 15),
    },
    {
      orderNumber: 'ORD-1009',
      customerUsername: 'cust_isabella',
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
      subtotal: new Decimal('2500.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('2500.00'),
      shippingAddress: 'Bungalow 18, Block 2, PECHS, Karachi, Sindh, 75400, Pakistan',
      billingAddress: 'Bungalow 18, Block 2, PECHS, Karachi, Sindh, 75400, Pakistan',
      items: [
        {
          productSku: 'GRN-TEA-303',
          quantity: 2,
          unitPrice: new Decimal('1250.00'),
          totalPrice: new Decimal('2500.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1009-REFUND',
        paymentMethod: 'JazzCash',
        amount: new Decimal('2500.00'),
        status: PaymentStatus.REFUNDED,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('250.00'),
        sellerEarnings: new Decimal('2250.00'),
      },
      shipment: {
        carrier: 'Leopards Courier',
        trackingNumber: 'LEO-CANCELLED-1009',
        status: ShippingStatus.PENDING,
      },
      createdAt: getPastDate(0, 10),
    },
    {
      orderNumber: 'ORD-1010',
      customerUsername: 'cust_ethan',
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      subtotal: new Decimal('5300.00'),
      shippingTotal: new Decimal('0.00'),
      taxTotal: new Decimal('0.00'),
      discountTotal: new Decimal('0.00'),
      total: new Decimal('5300.00'),
      shippingAddress: 'House 77, Street 11, Sector G-11/3, Islamabad, ICT, 44000, Pakistan',
      billingAddress: 'House 77, Street 11, Sector G-11/3, Islamabad, ICT, 44000, Pakistan',
      items: [
        {
          productSku: 'VLT-ARO-402',
          quantity: 2,
          unitPrice: new Decimal('2650.00'),
          totalPrice: new Decimal('5300.00'),
        },
      ],
      payment: {
        transactionReference: 'TXN-ORD1010-ALFALAH',
        paymentMethod: 'Bank Transfer (Bank Alfalah)',
        amount: new Decimal('5300.00'),
        status: PaymentStatus.PAID,
      },
      commission: {
        commissionRate: new Decimal('10.00'),
        platformFee: new Decimal('530.00'),
        sellerEarnings: new Decimal('4770.00'),
      },
      shipment: {
        carrier: 'Trax Logistics',
        trackingNumber: 'TRAX-9988443322',
        status: ShippingStatus.LABEL_CREATED,
      },
      createdAt: getPastDate(0, 3),
    },
  ];

  const orderRecords: Record<string, { id: string; orderNumber: string }> = {};

  for (const o of ordersToSeed) {
    const cust = customerRecords[o.customerUsername];
    if (!cust) continue;

    let order = await prisma.order.findUnique({ where: { orderNumber: o.orderNumber } });

    if (!order) {
      order = await prisma.order.create({
        data: {
          orderNumber: o.orderNumber,
          customerId: cust.id,
          status: o.status,
          paymentStatus: o.paymentStatus,
          currency: 'PKR',
          subtotal: o.subtotal,
          shippingTotal: o.shippingTotal,
          taxTotal: o.taxTotal,
          discountTotal: o.discountTotal,
          total: o.total,
          shippingAddress: o.shippingAddress,
          billingAddress: o.billingAddress,
          createdAt: o.createdAt,
          updatedAt: o.createdAt,
        },
      });

      // Add order items
      for (const item of o.items) {
        const prod = productRecords[item.productSku];
        if (!prod) continue;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: prod.id,
            sellerId: prod.sellerId,
            productName: prod.name,
            sku: prod.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            createdAt: o.createdAt,
          },
        });

        // Add commission record
        await prisma.commissionRecord.create({
          data: {
            orderId: order.id,
            sellerId: prod.sellerId,
            orderAmount: item.totalPrice,
            commissionRate: o.commission.commissionRate,
            platformFee: o.commission.platformFee,
            sellerEarnings: o.commission.sellerEarnings,
            status: o.paymentStatus === PaymentStatus.PAID ? 'CONFIRMED' : 'PENDING',
            createdAt: o.createdAt,
            updatedAt: o.createdAt,
          },
        });
      }

      // Add payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          transactionReference: o.payment.transactionReference,
          paymentMethod: o.payment.paymentMethod,
          amount: o.payment.amount,
          currency: 'PKR',
          status: o.payment.status,
          paidAt: o.payment.status === PaymentStatus.PAID ? o.createdAt : null,
          createdAt: o.createdAt,
          updatedAt: o.createdAt,
        },
      });

      // Add shipment
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: o.shipment.carrier,
          trackingNumber: o.shipment.trackingNumber,
          status: o.shipment.status,
          shippedDate: o.status === OrderStatus.SHIPPED || o.status === OrderStatus.DELIVERED ? o.createdAt : null,
          deliveredDate: o.status === OrderStatus.DELIVERED ? o.createdAt : null,
          createdAt: o.createdAt,
          updatedAt: o.createdAt,
        },
      });

      // Add initial status history entry
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: o.status,
          notes: `Order created with initial status ${o.status}.`,
          createdAt: o.createdAt,
        },
      });

      console.log(`  ✓ Order created: ${order.orderNumber} (Rs ${order.total})`);
    } else {
      console.log(`  ℹ Order exists: ${order.orderNumber}`);
    }

    orderRecords[o.orderNumber] = { id: order.id, orderNumber: order.orderNumber };
  }

  // 8h. Seller Payouts Ledger
  console.log('8h. Seeding Seller Payout Disbursements in PKR...');
  const payoutsToSeed = [
    {
      payoutNumber: 'PO-2026-001',
      sellerUsername: 'vendor_artisan',
      amount: new Decimal('6300.00'),
      status: PayoutStatus.PAID,
      processedBy: adminRecords['admin_ayesha']?.id ?? superAdminRecord?.id,
      notes: 'Disbursement for Order #ORD-1001 sales net of 10% platform commission via Raast direct transfer.',
      periodStart: getPastDate(4, 15),
      periodEnd: getPastDate(4, 1),
      processedAt: getPastDate(3, 28),
      createdAt: getPastDate(4, 1),
    },
    {
      payoutNumber: 'PO-2026-002',
      sellerUsername: 'vendor_apex',
      amount: new Decimal('5850.00'),
      status: PayoutStatus.PAID,
      processedBy: adminRecords['admin_ayesha']?.id ?? superAdminRecord?.id,
      notes: 'Disbursement for Order #ORD-1002 sales net of 10% platform fee via Meezan Bank IBFT.',
      periodStart: getPastDate(3, 20),
      periodEnd: getPastDate(3, 10),
      processedAt: getPastDate(3, 5),
      createdAt: getPastDate(3, 10),
    },
    {
      payoutNumber: 'PO-2026-003',
      sellerUsername: 'vendor_greenlife',
      amount: new Decimal('4410.00'),
      status: PayoutStatus.PENDING,
      processedBy: null,
      notes: 'Scheduled payout for Order #ORD-1003 net proceeds via Raast IBFT.',
      periodStart: getPastDate(2, 25),
      periodEnd: getPastDate(2, 10),
      processedAt: null,
      createdAt: getPastDate(0, 10),
    },
    {
      payoutNumber: 'PO-2026-004',
      sellerUsername: 'vendor_artisan',
      amount: new Decimal('4995.00'),
      status: PayoutStatus.PROCESSING,
      processedBy: adminRecords['admin_ayesha']?.id ?? superAdminRecord?.id,
      notes: 'Processing payout batch for Order #ORD-1004 net proceeds.',
      periodStart: getPastDate(1, 15),
      periodEnd: getPastDate(0, 15),
      processedAt: null,
      createdAt: getPastDate(0, 12),
    },
    {
      payoutNumber: 'PO-2026-005',
      sellerUsername: 'vendor_zenithgear',
      amount: new Decimal('4500.00'),
      status: PayoutStatus.REJECTED,
      processedBy: adminRecords['admin_ayesha']?.id ?? superAdminRecord?.id,
      notes: 'Disbursement held: Seller FBR NTN verification documents require re-submission.',
      periodStart: getPastDate(1, 1),
      periodEnd: getPastDate(0, 20),
      processedAt: getPastDate(0, 15),
      createdAt: getPastDate(0, 20),
    },
    {
      payoutNumber: 'PO-2026-006',
      sellerUsername: 'vendor_nordiccraft',
      amount: new Decimal('7500.00'),
      status: PayoutStatus.CANCELLED,
      processedBy: superAdminRecord?.id ?? adminRecords['admin_ayesha']?.id,
      notes: 'Disbursement cancelled due to seller account suspension.',
      periodStart: getPastDate(1, 20),
      periodEnd: getPastDate(0, 18),
      processedAt: getPastDate(0, 18),
      createdAt: getPastDate(0, 20),
    },
  ];

  for (const po of payoutsToSeed) {
    const seller = sellerRecords[po.sellerUsername];
    if (!seller) continue;

    let payout = await prisma.sellerPayout.findUnique({ where: { payoutNumber: po.payoutNumber } });

    if (!payout) {
      payout = await prisma.sellerPayout.create({
        data: {
          payoutNumber: po.payoutNumber,
          sellerId: seller.id,
          amount: po.amount,
          currency: 'PKR',
          status: po.status,
          periodStart: po.periodStart,
          periodEnd: po.periodEnd,
          processedAt: po.processedAt,
          processedBy: po.processedBy,
          notes: po.notes,
          createdAt: po.createdAt,
          updatedAt: po.processedAt || po.createdAt,
        },
      });
      console.log(`  ✓ Payout created: ${payout.payoutNumber} (Rs ${payout.amount}) [${payout.status}]`);
    } else {
      console.log(`  ℹ Payout exists: ${payout.payoutNumber}`);
    }
  }

  // 8i. Order Returns & Refunds
  console.log('8i. Seeding Returns & Refunds...');
  const returnsToSeed = [
    {
      returnNumber: 'RET-1001',
      orderNumber: 'ORD-1003',
      customerUsername: 'cust_sophia',
      sellerUsername: 'vendor_greenlife',
      reason: 'Customer requested exchange due to damaged seal on 1 bottle.',
      status: ReturnStatus.REQUESTED,
      refundStatus: PaymentStatus.PENDING,
      refundAmount: new Decimal('2450.00'),
      adminNotes: 'Reviewing return authorization with National Organic Goods customer support.',
      createdAt: getPastDate(0, 8),
    },
    {
      returnNumber: 'RET-1002',
      orderNumber: 'ORD-1001',
      customerUsername: 'cust_olivia',
      sellerUsername: 'vendor_artisan',
      reason: 'Customer ordered extra teapot set by mistake and requested return of duplicate item.',
      status: ReturnStatus.APPROVED,
      refundStatus: PaymentStatus.PENDING,
      refundAmount: new Decimal('3500.00'),
      adminNotes: 'Return authorized. TCS return pickup label issued to customer.',
      createdAt: getPastDate(3, 15),
    },
    {
      returnNumber: 'RET-1003',
      orderNumber: 'ORD-1009',
      customerUsername: 'cust_isabella',
      sellerUsername: 'vendor_greenlife',
      reason: 'Order cancelled prior to fulfillment at customer request.',
      status: ReturnStatus.REFUNDED,
      refundStatus: PaymentStatus.REFUNDED,
      refundAmount: new Decimal('2500.00'),
      adminNotes: 'Order was successfully refunded to customer JazzCash account.',
      createdAt: getPastDate(0, 9),
    },
    {
      returnNumber: 'RET-1004',
      orderNumber: 'ORD-1002',
      customerUsername: 'cust_marcus',
      sellerUsername: 'vendor_apex',
      reason: 'Customer requested return after 45 days of delivery.',
      status: ReturnStatus.REJECTED,
      refundStatus: PaymentStatus.FAILED,
      refundAmount: new Decimal('6500.00'),
      adminNotes: 'Return request rejected. Policy allows returns within 14 days of delivery.',
      createdAt: getPastDate(1, 5),
    },
  ];

  for (const ret of returnsToSeed) {
    const order = orderRecords[ret.orderNumber];
    const cust = customerRecords[ret.customerUsername];
    const seller = sellerRecords[ret.sellerUsername];
    if (!order || !cust || !seller) continue;

    let existingReturn = await prisma.orderReturn.findUnique({ where: { returnNumber: ret.returnNumber } });

    if (!existingReturn) {
      existingReturn = await prisma.orderReturn.create({
        data: {
          returnNumber: ret.returnNumber,
          orderId: order.id,
          customerId: cust.id,
          sellerId: seller.id,
          reason: ret.reason,
          status: ret.status,
          refundStatus: ret.refundStatus,
          refundAmount: ret.refundAmount,
          adminNotes: ret.adminNotes,
          createdAt: ret.createdAt,
          updatedAt: ret.createdAt,
        },
      });
      console.log(`  ✓ Return request created: ${existingReturn.returnNumber} [${existingReturn.status}]`);
    } else {
      console.log(`  ℹ Return request exists: ${existingReturn.returnNumber}`);
    }
  }

  // 8j. Product Ratings & Reviews
  console.log('8j. Seeding Product Ratings & Reviews...');
  const reviewsToSeed = [
    {
      productSku: 'ART-CER-001',
      customerUsername: 'cust_olivia',
      sellerUsername: 'vendor_artisan',
      rating: 5,
      title: 'Exquisite Multani blue pottery craftsmanship',
      comment:
        'The teapot set arrived meticulously packaged via TCS. The vibrant blue glaze and handcrafted finish are stunning in person.',
      status: ReviewStatus.APPROVED,
      isReported: false,
      createdAt: getPastDate(3, 20),
    },
    {
      productSku: 'APX-AUD-101',
      customerUsername: 'cust_marcus',
      sellerUsername: 'vendor_apex',
      rating: 5,
      title: 'Studio quality noise cancellation in Lahore',
      comment:
        'Terrific audio clarity and deep bass. Battery easily lasts all workday with active noise cancellation turned on.',
      status: ReviewStatus.APPROVED,
      isReported: false,
      createdAt: getPastDate(3, 10),
    },
    {
      productSku: 'ART-PLT-002',
      customerUsername: 'cust_sophia',
      sellerUsername: 'vendor_artisan',
      rating: 2,
      title: 'Minor chip on the pot rim',
      comment:
        'Beautiful terracotta clay but noticed a small chip near the rim when unboxing in Islamabad.',
      status: ReviewStatus.FLAGGED,
      isReported: true,
      reportReason: 'Shipping damage claim filed by customer',
      moderationNotes: 'Support has reached out to customer to send a replacement pot.',
      createdAt: getPastDate(0, 15),
    },
    {
      productSku: 'GRN-SKN-301',
      customerUsername: 'cust_emma',
      sellerUsername: 'vendor_greenlife',
      rating: 4,
      title: 'Hydrating and gentle aroma from Swat',
      comment:
        'Skin feels supple and calm the next morning. Clean organic ingredients without any synthetic fragrances.',
      status: ReviewStatus.PENDING,
      isReported: false,
      createdAt: getPastDate(0, 3),
    },
    {
      productSku: 'APX-AUD-102',
      customerUsername: 'cust_ava',
      sellerUsername: 'vendor_apex',
      rating: 5,
      title: 'Remarkable soundstage and premium materials',
      comment:
        'The soundstage is wide, clear, and rich. Aluminum frame and leather cups are top notch.',
      status: ReviewStatus.APPROVED,
      isReported: false,
      createdAt: getPastDate(0, 2),
    },
    {
      productSku: 'VLT-BDY-401',
      customerUsername: 'cust_noah',
      sellerUsername: 'vendor_velvetbloom',
      rating: 4,
      title: 'Luxurious feel and delicate scent',
      comment:
        'Non-greasy formula absorbs quickly. Highly recommended for dry winter months in Punjab.',
      status: ReviewStatus.APPROVED,
      isReported: false,
      createdAt: getPastDate(0, 1),
    },
    {
      productSku: 'GRN-TEA-303',
      customerUsername: 'cust_lucas',
      sellerUsername: 'vendor_greenlife',
      rating: 1,
      title: 'Promotional spam comment',
      comment:
        'Visit my discount coupons site at www.discountspamsite.example for 50% off everything.',
      status: ReviewStatus.REJECTED,
      isReported: true,
      reportReason: 'Commercial advertisement and spam link',
      moderationNotes: 'Rejected due to link spam violation of community review guidelines.',
      createdAt: getPastDate(0, 5),
    },
  ];

  for (const rev of reviewsToSeed) {
    const prod = productRecords[rev.productSku];
    const cust = customerRecords[rev.customerUsername];
    const seller = sellerRecords[rev.sellerUsername];
    if (!prod || !cust || !seller) continue;

    const existingRev = await prisma.productReview.findFirst({
      where: { productId: prod.id, customerId: cust.id },
    });

    if (!existingRev) {
      await prisma.productReview.create({
        data: {
          productId: prod.id,
          customerId: cust.id,
          sellerId: seller.id,
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          status: rev.status,
          isReported: rev.isReported,
          reportReason: rev.reportReason || null,
          moderationNotes: rev.moderationNotes || null,
          createdAt: rev.createdAt,
          updatedAt: rev.createdAt,
        },
      });
      console.log(`  ✓ Product review created for "${prod.name}" by @${cust.username} (${rev.rating}★)`);
    } else {
      console.log(`  ℹ Product review exists for "${prod.name}" by @${cust.username}`);
    }
  }

  // 8k. Admin Notifications Center
  console.log('8k. Seeding Admin Notifications...');
  const notificationsToSeed = [
    {
      type: NotificationType.SELLER_APPROVAL,
      title: 'New Seller Application Submitted',
      message: 'Tariq Road Apparel & Fabrics (@vendor_urbanstyle) submitted business NTN and documents for onboarding review.',
      targetUrl: '/admin/seller-approvals',
      isRead: false,
      createdAt: getPastDate(2, 20),
    },
    {
      type: NotificationType.LOW_STOCK,
      title: 'Low Stock Inventory Alert',
      message: 'Pure Swat Lavender Essential Oil 30ml (SKU: GRN-OIL-302) has reached low stock threshold (3 units remaining in Islamabad Hub).',
      targetUrl: '/admin/inventory',
      isRead: false,
      createdAt: getPastDate(0, 12),
    },
    {
      type: NotificationType.LOW_STOCK,
      title: 'Out of Stock Alert',
      message: 'Handcrafted Chiniot Sheesham Wood Serving Board (SKU: NOR-WOD-601) is currently out of stock (0 units remaining).',
      targetUrl: '/admin/inventory',
      isRead: false,
      createdAt: getPastDate(0, 10),
    },
    {
      type: NotificationType.RETURN_REQUEST,
      title: 'Return Request #RET-1001 Opened',
      message: 'Customer Fatima Zahra submitted return request for Order #ORD-1003 (Rs 2,450.00 refund value).',
      targetUrl: '/admin/returns',
      isRead: false,
      createdAt: getPastDate(0, 8),
    },
    {
      type: NotificationType.RETURN_REQUEST,
      title: 'Return Request #RET-1002 Approved',
      message: 'Return #RET-1002 for Order #ORD-1001 approved for Rs 3,500.00 refund.',
      targetUrl: '/admin/returns',
      isRead: true,
      createdAt: getPastDate(3, 14),
    },
    {
      type: NotificationType.ORDER_CREATED,
      title: 'New Order #ORD-1006 Placed',
      message: 'Customer Usman Ghani placed Order #ORD-1006 for Rs 2,450.00 with Gulberg Botanicals & Scents.',
      targetUrl: '/admin/orders',
      isRead: true,
      createdAt: getPastDate(0, 1),
    },
    {
      type: NotificationType.ORDER_CREATED,
      title: 'New High-Value Order #ORD-1007 Placed',
      message: 'Customer Zainab Tariq placed high-value Order #ORD-1007 for Rs 12,500.00 with Al-Madina Electronics.',
      targetUrl: '/admin/orders',
      isRead: false,
      createdAt: getPastDate(0, 2),
    },
    {
      type: NotificationType.PAYMENT_ALERT,
      title: 'Seller Payout Queued for Disbursement',
      message: 'Payout batch #PO-2026-004 (Rs 4,995.00) queued for Khaadi Crafts & Home Decor via Raast.',
      targetUrl: '/admin/payouts',
      isRead: false,
      createdAt: getPastDate(0, 12),
    },
  ];

  for (const notif of notificationsToSeed) {
    const existingNotif = await prisma.adminNotification.findFirst({
      where: { title: notif.title, type: notif.type },
    });

    if (!existingNotif) {
      await prisma.adminNotification.create({
        data: {
          type: notif.type,
          title: notif.title,
          message: notif.message,
          targetUrl: notif.targetUrl,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        },
      });
      console.log(`  ✓ Notification created: "${notif.title}"`);
    } else {
      console.log(`  ℹ Notification exists: "${notif.title}"`);
    }
  }

  // 8l. Active User Sessions for Security Center
  console.log('8l. Seeding Active User Sessions...');
  const sessionsToSeed = [
    {
      userId: superAdminRecord?.id,
      sessionToken: 'demo_session_spadmin_token_001',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      deviceInfo: 'Desktop (Windows)',
      isValid: true,
      lastActivityAt: getPastDate(0, 0),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      userId: adminRecords['admin_sarah']?.id,
      sessionToken: 'demo_session_sarah_token_002',
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0',
      deviceInfo: 'MacBook Pro (macOS)',
      isValid: true,
      lastActivityAt: getPastDate(0, 1),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      userId: adminRecords['admin_usman']?.id,
      sessionToken: 'demo_session_usman_token_003',
      ipAddress: '192.168.1.72',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/129.0',
      deviceInfo: 'Desktop (Windows)',
      isValid: true,
      lastActivityAt: getPastDate(0, 2),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      userId: adminRecords['admin_ayesha']?.id,
      sessionToken: 'demo_session_ayesha_token_004',
      ipAddress: '10.0.4.12',
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Chrome/126.0.0.0',
      deviceInfo: 'Workstation (Linux)',
      isValid: true,
      lastActivityAt: getPastDate(0, 3),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const s of sessionsToSeed) {
    if (!s.userId) continue;

    await prisma.userSession.upsert({
      where: { sessionToken: s.sessionToken },
      update: {
        lastActivityAt: s.lastActivityAt,
        isValid: s.isValid,
      },
      create: {
        userId: s.userId,
        sessionToken: s.sessionToken,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceInfo: s.deviceInfo,
        isValid: s.isValid,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
        createdAt: s.lastActivityAt,
      },
    });
  }
  console.log('  ✓ User security sessions seeded');

  // 8m. Administrative Audit Logs
  console.log('8m. Seeding Administrative Audit Logs...');
  const auditLogsToSeed = [
    {
      actorId: superAdminRecord?.id ?? null,
      actorName: superAdminRecord?.username ?? 'superadmin',
      actorEmail: superAdminRecord?.email ?? 'superadmin@tobetake.dev',
      actorRole: 'SPADMIN',
      action: 'PLATFORM_SETTINGS_UPDATED',
      targetType: 'PlatformSetting',
      targetId: null,
      status: 'SUCCESS',
      details: JSON.stringify({ message: 'Initial platform security parameters and registration toggles configured for Pakistan marketplace.' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: getPastDate(5, 25),
    },
    {
      actorId: superAdminRecord?.id ?? null,
      actorName: superAdminRecord?.username ?? 'superadmin',
      actorEmail: superAdminRecord?.email ?? 'superadmin@tobetake.dev',
      actorRole: 'SPADMIN',
      action: 'SELLER_APPROVED',
      targetType: 'SellerApproval',
      targetId: sellerRecords['vendor_apex']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        sellerId: sellerRecords['vendor_apex']?.id,
        storeName: 'Al-Madina Electronics & Gadgets',
        newApprovalStatus: 'APPROVED',
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: getPastDate(5, 16),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'ADMIN_LOGIN',
      targetType: 'Auth',
      targetId: adminRecords['admin_sarah']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({ authMethod: 'password', ip: '192.168.1.45' }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(4, 25),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'SELLER_APPROVED',
      targetType: 'SellerApproval',
      targetId: sellerRecords['vendor_artisan']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        sellerId: sellerRecords['vendor_artisan']?.id,
        storeName: 'Khaadi Crafts & Home Decor',
        newApprovalStatus: 'APPROVED',
      }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(4, 22),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'CATEGORY_CREATED',
      targetType: 'Category',
      targetId: '5',
      status: 'SUCCESS',
      details: JSON.stringify({ name: 'Ceramics & Tableware', slug: 'ceramics-tableware' }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(4, 21),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'PRODUCT_APPROVED',
      targetType: 'Product',
      targetId: productRecords['ART-CER-001']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        sku: 'ART-CER-001',
        productName: 'Handcrafted Multani Blue Pottery Teapot Set',
        status: 'ACTIVE',
      }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(4, 20),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'SELLER_APPROVED',
      targetType: 'SellerApproval',
      targetId: sellerRecords['vendor_greenlife']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        sellerId: sellerRecords['vendor_greenlife']?.id,
        storeName: 'National Organic Goods',
        newApprovalStatus: 'APPROVED',
      }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(4, 3),
    },
    {
      actorId: adminRecords['admin_ayesha']?.id ?? null,
      actorName: 'admin_ayesha',
      actorEmail: 'ayesha.siddiqui@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'ADMIN_LOGIN',
      targetType: 'Auth',
      targetId: adminRecords['admin_ayesha']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({ authMethod: 'password', ip: '10.0.4.12' }),
      ipAddress: '10.0.4.12',
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64)',
      createdAt: getPastDate(3, 28),
    },
    {
      actorId: adminRecords['admin_ayesha']?.id ?? null,
      actorName: 'admin_ayesha',
      actorEmail: 'ayesha.siddiqui@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'PAYOUT_PROCESSED',
      targetType: 'SellerPayout',
      targetId: 'PO-2026-001',
      status: 'SUCCESS',
      details: JSON.stringify({
        payoutNumber: 'PO-2026-001',
        amount: 6300.00,
        sellerStore: 'Khaadi Crafts & Home Decor',
      }),
      ipAddress: '10.0.4.12',
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64)',
      createdAt: getPastDate(3, 28),
    },
    {
      actorId: adminRecords['admin_usman']?.id ?? null,
      actorName: 'admin_usman',
      actorEmail: 'usman.tariq@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'SELLER_APPROVED',
      targetType: 'SellerApproval',
      targetId: sellerRecords['vendor_velvetbloom']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        sellerId: sellerRecords['vendor_velvetbloom']?.id,
        storeName: 'Gulberg Botanicals & Scents',
        newApprovalStatus: 'APPROVED',
      }),
      ipAddress: '192.168.1.72',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(3, 8),
    },
    {
      actorId: adminRecords['admin_ayesha']?.id ?? null,
      actorName: 'admin_ayesha',
      actorEmail: 'ayesha.siddiqui@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'PAYOUT_PROCESSED',
      targetType: 'SellerPayout',
      targetId: 'PO-2026-002',
      status: 'SUCCESS',
      details: JSON.stringify({
        payoutNumber: 'PO-2026-002',
        amount: 5850.00,
        sellerStore: 'Al-Madina Electronics & Gadgets',
      }),
      ipAddress: '10.0.4.12',
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64)',
      createdAt: getPastDate(3, 5),
    },
    {
      actorId: superAdminRecord?.id ?? null,
      actorName: superAdminRecord?.username ?? 'superadmin',
      actorEmail: superAdminRecord?.email ?? 'superadmin@tobetake.dev',
      actorRole: 'SPADMIN',
      action: 'ROLE_PERMISSIONS_UPDATED',
      targetType: 'Role',
      targetId: '2',
      status: 'SUCCESS',
      details: JSON.stringify({
        roleName: 'Admin',
        roleCode: 'ADMIN',
        assignedPermissions: ['SELLERS_APPROVE', 'REPORTS_VIEW', 'USERS_VIEW', 'ORDERS_MANAGE'],
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(2, 25),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'INVENTORY_RESTOCKED',
      targetType: 'InventoryItem',
      targetId: productRecords['GRN-SKN-301']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({ sku: 'GRN-SKN-301', quantityAdded: 30 }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(2, 10),
    },
    {
      actorId: superAdminRecord?.id ?? null,
      actorName: superAdminRecord?.username ?? 'superadmin',
      actorEmail: superAdminRecord?.email ?? 'superadmin@tobetake.dev',
      actorRole: 'SPADMIN',
      action: 'SELLER_SUSPENDED',
      targetType: 'SellerApproval',
      targetId: sellerRecords['vendor_nordiccraft']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        sellerId: sellerRecords['vendor_nordiccraft']?.id,
        storeName: 'Chiniot Sheesham Woodcrafts',
        newApprovalStatus: 'SUSPENDED',
        reason: 'Woodwork origin authenticity review in progress',
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(0, 18),
    },
    {
      actorId: adminRecords['admin_usman']?.id ?? null,
      actorName: 'admin_usman',
      actorEmail: 'usman.tariq@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'REVIEW_FLAGGED',
      targetType: 'ProductReview',
      targetId: productRecords['ART-PLT-002']?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({
        productSku: 'ART-PLT-002',
        reason: 'Shipping damage claim filed by customer in Islamabad',
      }),
      ipAddress: '192.168.1.72',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(0, 15),
    },
    {
      actorId: adminRecords['admin_sarah']?.id ?? null,
      actorName: 'admin_sarah',
      actorEmail: 'sarah.khan@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'ORDER_SHIPPED',
      targetType: 'Order',
      targetId: 'ORD-1004',
      status: 'SUCCESS',
      details: JSON.stringify({ orderNumber: 'ORD-1004', trackingNumber: 'PKPOST-8877665544' }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: getPastDate(0, 14),
    },
    {
      actorId: adminRecords['admin_usman']?.id ?? null,
      actorName: 'admin_usman',
      actorEmail: 'usman.tariq@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'RETURN_REQUESTED',
      targetType: 'OrderReturn',
      targetId: 'RET-1001',
      status: 'SUCCESS',
      details: JSON.stringify({ returnNumber: 'RET-1001', orderNumber: 'ORD-1003', amount: 2450.00 }),
      ipAddress: '192.168.1.72',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(0, 8),
    },
    {
      actorId: adminRecords['admin_usman']?.id ?? null,
      actorName: 'admin_usman',
      actorEmail: 'usman.tariq@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'REPORT_GENERATED',
      targetType: 'Report',
      targetId: null,
      status: 'SUCCESS',
      details: JSON.stringify({ reportType: 'MonthlySalesSummary', format: 'CSV' }),
      ipAddress: '192.168.1.72',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(0, 5),
    },
    {
      actorId: superAdminRecord?.id ?? null,
      actorName: superAdminRecord?.username ?? 'superadmin',
      actorEmail: superAdminRecord?.email ?? 'superadmin@tobetake.dev',
      actorRole: 'SPADMIN',
      action: 'ADMIN_LOGIN',
      targetType: 'Auth',
      targetId: superAdminRecord?.id ?? null,
      status: 'SUCCESS',
      details: JSON.stringify({ authMethod: 'password', ip: '127.0.0.1' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: getPastDate(0, 1),
    },
  ];

  for (const log of auditLogsToSeed) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: log.action,
        actorEmail: log.actorEmail,
        createdAt: log.createdAt,
      },
    });

    if (!existing) {
      await prisma.auditLog.create({
        data: {
          actorId: log.actorId,
          actorName: log.actorName,
          actorEmail: log.actorEmail,
          actorRole: log.actorRole,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          status: log.status,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        },
      });
    }
  }
  console.log(`  ✓ Seeded administrative audit logs (${auditLogsToSeed.length} entries)`);

  // 8m. Customer Saved Addresses
  console.log('8m. Seeding Customer Saved Addresses...');
  const addressesToSeed = [
    {
      userUsername: 'buyer_bilal',
      label: 'Home',
      recipientName: 'Bilal Ahmed',
      phone: '+92 300 1234567',
      streetAddress: 'House 42, Street 14, Sector Y, Phase 3',
      area: 'DHA Phase 3',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54792',
      isDefault: true,
    },
    {
      userUsername: 'buyer_bilal',
      label: 'Office',
      recipientName: 'Bilal Ahmed (Tech Hub)',
      phone: '+92 300 1234567',
      streetAddress: 'Floor 4, Arfa Software Technology Park, Ferozepur Rd',
      area: 'Nishtar Town',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54600',
      isDefault: false,
    },
    {
      userUsername: 'buyer_fatima',
      label: 'Home',
      recipientName: 'Fatima Khan',
      phone: '+92 321 7654321',
      streetAddress: 'Apartment 6B, Creek Vistas, Phase 8',
      area: 'DHA Phase 8',
      city: 'Karachi',
      province: 'Sindh',
      postalCode: '75500',
      isDefault: true,
    },
    {
      userUsername: 'buyer_zainab',
      label: 'Home',
      recipientName: 'Zainab Raza',
      phone: '+92 333 9988776',
      streetAddress: 'House 18, Street 45, Sector F-7/2',
      area: 'Sector F-7',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
      postalCode: '44000',
      isDefault: true,
    },
    {
      userUsername: 'buyer_hassan',
      label: 'Home',
      recipientName: 'Hassan Ali',
      phone: '+92 345 8899001',
      streetAddress: 'House 9, Street 3, University Town',
      area: 'University Town',
      city: 'Peshawar',
      province: 'Khyber Pakhtunkhwa',
      postalCode: '25000',
      isDefault: true,
    },
  ];

  for (const addr of addressesToSeed) {
    const user = customerRecords[addr.userUsername];
    if (user) {
      const existing = await prisma.userAddress.findFirst({
        where: {
          userId: user.id,
          streetAddress: addr.streetAddress,
        },
      });

      if (!existing) {
        await prisma.userAddress.create({
          data: {
            userId: user.id,
            label: addr.label,
            recipientName: addr.recipientName,
            phone: addr.phone,
            streetAddress: addr.streetAddress,
            area: addr.area,
            city: addr.city,
            province: addr.province,
            postalCode: addr.postalCode,
            country: 'Pakistan',
            isDefault: addr.isDefault,
          },
        });
      }
    }
  }
  console.log('  ✓ Seeded realistic Pakistani customer shipping addresses');

  // 8n. Customer Shopping Carts & Wishlists
  console.log('8n. Seeding Customer Shopping Carts and Wishlists...');
  const activeProducts = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    take: 10,
  });

  if (activeProducts.length > 0) {
    const bilalUser = customerRecords['buyer_bilal'];
    if (bilalUser) {
      // Cart items
      if (activeProducts[0]) {
        await prisma.cartItem.upsert({
          where: {
            userId_productId: {
              userId: bilalUser.id,
              productId: activeProducts[0].id,
            },
          },
          update: { quantity: 1 },
          create: {
            userId: bilalUser.id,
            productId: activeProducts[0].id,
            quantity: 1,
          },
        });
      }
      if (activeProducts[1]) {
        await prisma.cartItem.upsert({
          where: {
            userId_productId: {
              userId: bilalUser.id,
              productId: activeProducts[1].id,
            },
          },
          update: { quantity: 2 },
          create: {
            userId: bilalUser.id,
            productId: activeProducts[1].id,
            quantity: 2,
          },
        });
      }

      // Wishlist items
      for (let i = 2; i < Math.min(6, activeProducts.length); i++) {
        await prisma.wishlistItem.upsert({
          where: {
            userId_productId: {
              userId: bilalUser.id,
              productId: activeProducts[i].id,
            },
          },
          update: {},
          create: {
            userId: bilalUser.id,
            productId: activeProducts[i].id,
          },
        });
      }
    }

    const fatimaUser = customerRecords['buyer_fatima'];
    if (fatimaUser && activeProducts.length > 3) {
      await prisma.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId: fatimaUser.id,
            productId: activeProducts[3].id,
          },
        },
        update: {},
        create: {
          userId: fatimaUser.id,
          productId: activeProducts[3].id,
        },
      });
    }
  }
  console.log('  ✓ Seeded customer cart items and wishlists');

  // 8o. Customer Notifications
  console.log('8o. Seeding Customer Notifications...');
  const bilalUser = customerRecords['buyer_bilal'];
  if (bilalUser) {
    const customerNotificationsToSeed = [
      {
        userId: bilalUser.id,
        type: 'ORDER',
        title: 'Order Placed Successfully',
        message: 'Your order #ORD-2026-0001 has been confirmed by Al-Madina Electronics & Gadgets.',
        targetUrl: '/account/orders',
        isRead: false,
        createdAt: getPastDate(0, 1),
      },
      {
        userId: bilalUser.id,
        type: 'SHIPPING',
        title: 'Package Dispatched via TCS Express',
        message: 'Your consignment TCS-772910482 is in transit to Lahore and expected in 24 hours.',
        targetUrl: '/account/orders',
        isRead: false,
        createdAt: getPastDate(0, 2),
      },
      {
        userId: bilalUser.id,
        type: 'PROMO',
        title: '🎉 Spring Craft Festival 15% Off',
        message: 'Use voucher code PAKISTAN15 on handcrafted Multan pottery and Chiniot furniture.',
        targetUrl: '/products',
        isRead: true,
        createdAt: getPastDate(0, 5),
      },
    ];

    for (const notif of customerNotificationsToSeed) {
      await prisma.customerNotification.create({
        data: notif,
      });
    }
  }
  console.log('  ✓ Seeded customer notifications');

  console.log('✅ Comprehensive database seed and Pakistan demo data bootstrap completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
