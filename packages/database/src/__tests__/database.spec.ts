import { PrismaClient, UserStatus } from '@prisma/client';

describe('Sprint 1 - Database Schema and Seed Verification', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. UserRoles Table & Seed Verification', () => {
    it('should have all 4 initial roles seeded correctly', async () => {
      const roles = await prisma.userRole.findMany({
        orderBy: { id: 'asc' },
      });

      expect(roles).toHaveLength(4);

      expect(roles[0]).toMatchObject({
        id: 1,
        name: 'Super Admin',
        code: 'SPADMIN',
      });
      expect(roles[1]).toMatchObject({
        id: 2,
        name: 'Admin',
        code: 'ADMIN',
      });
      expect(roles[2]).toMatchObject({
        id: 3,
        name: 'Seller',
        code: 'VENDOR',
      });
      expect(roles[3]).toMatchObject({
        id: 4,
        name: 'Buyer',
        code: 'CUST',
      });
    });

    it('should enforce unique constraint on role code', async () => {
      await expect(
        prisma.userRole.create({
          data: {
            name: 'Duplicate Role',
            code: 'SPADMIN',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('2. Departments Table & Seed Verification', () => {
    it('should have all 11 administrative departments seeded correctly', async () => {
      const departments = await prisma.department.findMany({
        orderBy: { id: 'asc' },
      });

      expect(departments).toHaveLength(11);

      expect(departments[0]).toMatchObject({
        id: 1,
        name: 'Administration',
        code: 'ADMN',
      });
      expect(departments[1]).toMatchObject({
        id: 2,
        name: 'Operations',
        code: 'OPS',
      });
      expect(departments[2]).toMatchObject({
        id: 3,
        name: 'Finance & Accounting',
        code: 'FIN_ACC',
      });
      expect(departments[3]).toMatchObject({
        id: 4,
        name: 'Sales',
        code: 'SALES',
      });
      expect(departments[4]).toMatchObject({
        id: 5,
        name: 'Marketing',
        code: 'MKTG',
      });
      expect(departments[5]).toMatchObject({
        id: 6,
        name: 'Customer Support',
        code: 'CS',
      });
      expect(departments[6]).toMatchObject({
        id: 7,
        name: 'Human Resources',
        code: 'HR',
      });
      expect(departments[7]).toMatchObject({
        id: 8,
        name: 'IT & Technology',
        code: 'IT_TECH',
      });
      expect(departments[8]).toMatchObject({
        id: 9,
        name: 'Product Management',
        code: 'PROD_MGMT',
      });
      expect(departments[9]).toMatchObject({
        id: 10,
        name: 'Logistics & Fulfillment',
        code: 'LOG_FULFILL',
      });
      expect(departments[10]).toMatchObject({
        id: 11,
        name: 'Risk & Compliance',
        code: 'RISK_COMP',
      });
    });

    it('should enforce unique constraint on department code', async () => {
      await expect(
        prisma.department.create({
          data: {
            name: 'Duplicate Department',
            code: 'ADMN',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('3. Users Table, Relationships, Audit & Soft Delete', () => {
    const testAdminEmail = 'test_admin_sprint1@tobetake.dev';
    const testAdminUsername = 'test_admin_sprint1';
    const testSellerEmail = 'test_seller_sprint1@tobetake.dev';
    const testSellerUsername = 'test_seller_sprint1';

    afterEach(async () => {
      // Clean up test users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [testAdminEmail, testSellerEmail],
          },
        },
      });
    });

    it('should create admin and seller users with respective account structures', async () => {
      const dummyPasswordHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrst';

      // 1. Create a creator/admin user (Admin structure: department + designation)
      const adminUser = await prisma.user.create({
        data: {
          username: testAdminUsername,
          email: testAdminEmail,
          password: dummyPasswordHash,
          firstName: 'System',
          lastName: 'SuperAdmin',
          roleId: 1, // Super Admin
          departmentId: 1, // Administration
          designation: 'Head of Operations',
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isMobileVerified: true,
        },
        include: {
          role: true,
          department: true,
        },
      });

      expect(adminUser).toBeDefined();
      expect(adminUser.id).toBeDefined();
      expect(adminUser.role.code).toBe('SPADMIN');
      expect(adminUser.department?.code).toBe('ADMN');
      expect(adminUser.designation).toBe('Head of Operations');
      expect(adminUser.status).toBe(UserStatus.ACTIVE);
      expect(adminUser.isDeleted).toBe(false);
      expect(adminUser.deletedAt).toBeNull();
      expect(adminUser.failedLoginAttempts).toBe(0);
      expect(adminUser.isLocked).toBe(false);

      // 2. Create seller user (Seller structure: storeName + businessCategory)
      const sellerUser = await prisma.user.create({
        data: {
          username: testSellerUsername,
          email: testSellerEmail,
          password: dummyPasswordHash,
          firstName: 'John',
          lastName: 'Vendor',
          roleId: 3, // Seller
          storeName: 'Acme Electronics',
          businessCategory: 'Electronics & Gadgets',
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
          status: UserStatus.ACTIVE,
        },
        include: {
          role: true,
          department: true,
          creator: true,
          updater: true,
        },
      });

      expect(sellerUser.role.code).toBe('VENDOR');
      expect(sellerUser.storeName).toBe('Acme Electronics');
      expect(sellerUser.businessCategory).toBe('Electronics & Gadgets');
      expect(sellerUser.departmentId).toBeNull();
      expect(sellerUser.department).toBeNull();
      expect(sellerUser.designation).toBeNull();
      expect(sellerUser.creator?.id).toBe(adminUser.id);
      expect(sellerUser.updater?.id).toBe(adminUser.id);
    });

    it('should enforce unique constraint on email and username', async () => {
      const dummyPasswordHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrst';

      await prisma.user.create({
        data: {
          username: testAdminUsername,
          email: testAdminEmail,
          password: dummyPasswordHash,
          firstName: 'First',
          lastName: 'User',
          roleId: 4,
        },
      });

      // Duplicate email attempt
      await expect(
        prisma.user.create({
          data: {
            username: 'different_username',
            email: testAdminEmail,
            password: dummyPasswordHash,
            firstName: 'Duplicate',
            lastName: 'Email',
            roleId: 4,
          },
        }),
      ).rejects.toThrow();

      // Duplicate username attempt
      await expect(
        prisma.user.create({
          data: {
            username: testAdminUsername,
            email: 'different_email@tobetake.dev',
            password: dummyPasswordHash,
            firstName: 'Duplicate',
            lastName: 'Username',
            roleId: 4,
          },
        }),
      ).rejects.toThrow();
    });

    it('should support soft delete workflow without physical row deletion', async () => {
      const dummyPasswordHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrst';

      const user = await prisma.user.create({
        data: {
          username: testAdminUsername,
          email: testAdminEmail,
          password: dummyPasswordHash,
          firstName: 'Active',
          lastName: 'User',
          roleId: 4,
        },
      });

      const deletedTimestamp = new Date();
      const softDeletedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isDeleted: true,
          deletedAt: deletedTimestamp,
          status: UserStatus.INACTIVE,
        },
      });

      expect(softDeletedUser.isDeleted).toBe(true);
      expect(softDeletedUser.deletedAt).toBeDefined();
      expect(softDeletedUser.status).toBe(UserStatus.INACTIVE);

      // Verify row still exists in database
      const foundInDb = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(foundInDb).not.toBeNull();
      expect(foundInDb?.isDeleted).toBe(true);
    });
  });
});
