import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

export async function main() {
  console.log('🌱 Starting database seed & Super Admin bootstrap for Sprint 1...');

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
      where: { id: dept.id },
      update: {
        name: dept.name,
        code: dept.code,
        description: dept.description,
      },
      create: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
      },
    });
    console.log(`  ✓ Department: [${upsertedDept.id}] ${upsertedDept.name} (${upsertedDept.code})`);
  }

  // 3. Reset PostgreSQL sequence counters to prevent collision on subsequent autoincrements
  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('user_roles', 'id'), COALESCE((SELECT MAX(id) FROM user_roles), 1))`,
    );
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1))`,
    );
    console.log('  ✓ PostgreSQL autoincrement sequence counters synchronized');
  } catch (err) {
    console.warn('  ⚠ Notice: Sequence counter synchronization skipped:', (err as Error).message);
  }

  // 4. Super Admin Bootstrap Process (Development/System Bootstrap)
  console.log('3. Checking Super Admin Bootstrap...');
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

  if (existingSuperAdmin) {
    console.log(
      `  ℹ Super Admin already exists (Username: ${existingSuperAdmin.username}, ID: ${existingSuperAdmin.id}). Skipping bootstrap creation.`,
    );
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);

    const superAdmin = await prisma.user.create({
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
      `  ✓ Initial Super Admin bootstrapped successfully (ID: ${superAdmin.id}, Username: ${superAdmin.username}, Email: ${superAdmin.email})`,
    );
  }

  console.log('✅ Database seed and bootstrap completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
