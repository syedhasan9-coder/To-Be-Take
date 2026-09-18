import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService, UserStatus } from '@tobetake/database';

describe('Auth & Departments (e2e)', () => {
  let app: INestApplication;

  const mockAdminRole = {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    description: 'Platform Administrator',
  };

  const mockSellerRole = {
    id: 3,
    name: 'Seller',
    code: 'VENDOR',
    description: 'Seller / Vendor account',
  };

  const mockBuyerRole = {
    id: 4,
    name: 'Buyer',
    code: 'CUST',
    description: 'Buyer / Customer account',
  };

  const mockDepartments = [
    { id: 1, name: 'Administration', code: 'ADMN', description: 'Admin ops' },
    { id: 2, name: 'Vendor Management', code: 'VEND', description: 'Vendor ops' },
  ];

  const mockPrismaService = {
    isHealthy: jest.fn().mockResolvedValue(true),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    department: {
      findMany: jest.fn().mockResolvedValue(mockDepartments),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = mockDepartments.find((d) => d.id === where.id);
        return Promise.resolve(found ?? null);
      }),
    },
    userRole: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.code === 'ADMIN') return Promise.resolve(mockAdminRole);
        if (where.code === 'VENDOR') return Promise.resolve(mockSellerRole);
        if (where.code === 'CUST') return Promise.resolve(mockBuyerRole);
        return Promise.resolve(null);
      }),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.username === 'existing_user' || where.email === 'existing@tobetake.dev') {
          return Promise.resolve({
            id: 'existing-id',
            username: where.username,
            email: where.email,
          });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        let role = mockAdminRole;
        let userId = 'new-admin-uuid';
        if (data.roleId === mockSellerRole.id) {
          role = mockSellerRole;
          userId = 'new-seller-uuid';
        } else if (data.roleId === mockBuyerRole.id) {
          role = mockBuyerRole;
          userId = 'new-buyer-uuid';
        }
        const dept = data.departmentId
          ? mockDepartments.find((d) => d.id === data.departmentId) || mockDepartments[1]
          : null;

        return Promise.resolve({
          id: userId,
          username: data.username,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: role.id,
          role: role,
          storeName: data.storeName ?? null,
          businessCategory: data.businessCategory ?? null,
          departmentId: data.departmentId ?? null,
          department: dept,
          designation: data.designation ?? null,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          isMobileVerified: false,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          deletedAt: null,
          lastLogin: null,
          passwordChangedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/departments', () => {
    it('should return list of departments', () => {
      return request(app.getHttpServer())
        .get('/api/departments')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toHaveLength(2);
          expect(res.body.data[0].code).toBe('ADMN');
        });
    });
  });

  describe('POST /api/auth/register/admin', () => {
    const validAdminPayload = {
      username: 'new_admin',
      email: 'new.admin@tobetake.dev',
      password: 'SecurePassword123!',
      firstName: 'Sarah',
      lastName: 'Connor',
      departmentId: 2,
      designation: 'Operations Director',
    };

    it('should register a new admin successfully (201)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send(validAdminPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Admin registered successfully');
          expect(res.body.data).toMatchObject({
            id: 'new-admin-uuid',
            username: 'new_admin',
            email: 'new.admin@tobetake.dev',
            firstName: 'Sarah',
            lastName: 'Connor',
            role: 'Admin',
            roleCode: 'ADMIN',
            department: 'Vendor Management',
            status: 'ACTIVE',
            isEmailVerified: false,
          });
          // Verify password and hash are not returned
          expect(res.body.data.password).toBeUndefined();
        });
    });

    it('should reject weak password with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          username: 'another_user',
          email: 'another@tobetake.dev',
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('Password must be at least 8 characters long'),
            ]),
          );
        });
    });

    it('should reject invalid email with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          email: 'not-an-email',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('valid email')]),
          );
        });
    });

    it('should reject duplicate username with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          username: 'existing_user',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already taken');
        });
    });

    it('should reject duplicate email with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          username: 'unique_user',
          email: 'existing@tobetake.dev',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already registered');
        });
    });

    it('should reject nonexistent department with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          departmentId: 9999,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid department');
        });
    });

    it('should reject requests attempting to inject security/role fields (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          roleId: 1, // Super Admin escalation attempt
          status: 'SUSPENDED',
          isEmailVerified: true,
          isMobileVerified: true,
          isDeleted: true,
          failedLoginAttempts: 99,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('property roleId should not exist'),
              expect.stringContaining('property status should not exist'),
              expect.stringContaining('property isEmailVerified should not exist'),
            ]),
          );
        });
    });

    it('should reject missing required fields with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          username: 'incomplete_admin',
        })
        .expect(400)
        .expect((res) => {
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.length).toBeGreaterThanOrEqual(5);
        });
    });

    it('should reject invalid username formats and length bounds with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          username: 'ab', // < 3 chars
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('at least 3 characters')]),
          );
        });
    });

    it('should reject short first/last names or designation with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/admin')
        .send({
          ...validAdminPayload,
          firstName: 'A',
          lastName: 'B',
          designation: 'C',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('First name must be at least 2 characters long'),
              expect.stringContaining('Last name must be at least 2 characters long'),
              expect.stringContaining('Designation must be at least 2 characters long'),
            ]),
          );
        });
    });
  });

  describe('POST /api/auth/register/seller', () => {
    const validSellerPayload = {
      username: 'new_seller',
      email: 'new.seller@tobetake.dev',
      password: 'SecurePassword123!',
      firstName: 'Emily',
      lastName: 'Blunt',
      storeName: 'Emily Fashion Store',
      businessCategory: 'Fashion & Apparel',
    };

    it('should register a new seller successfully (201)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send(validSellerPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Seller registered successfully');
          expect(res.body.data).toMatchObject({
            id: 'new-seller-uuid',
            username: 'new_seller',
            email: 'new.seller@tobetake.dev',
            firstName: 'Emily',
            lastName: 'Blunt',
            role: 'Seller',
            roleCode: 'VENDOR',
            storeName: 'Emily Fashion Store',
            businessCategory: 'Fashion & Apparel',
            status: 'ACTIVE',
            isEmailVerified: false,
          });
          // Verify password and hash are not returned
          expect(res.body.data.password).toBeUndefined();
        });
    });

    it('should reject weak password with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          username: 'another_seller',
          email: 'seller2@tobetake.dev',
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('Password must be at least 8 characters long'),
            ]),
          );
        });
    });

    it('should reject invalid email with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          email: 'not-an-email',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('valid email')]),
          );
        });
    });

    it('should reject duplicate username with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          username: 'existing_user',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already taken');
        });
    });

    it('should reject duplicate email with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          username: 'unique_seller',
          email: 'existing@tobetake.dev',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already registered');
        });
    });

    it('should reject requests attempting to inject security/role fields (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          roleId: 1, // Super Admin escalation attempt
          status: 'SUSPENDED',
          isEmailVerified: true,
          isMobileVerified: true,
          isDeleted: true,
          failedLoginAttempts: 99,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('property roleId should not exist'),
              expect.stringContaining('property status should not exist'),
              expect.stringContaining('property isEmailVerified should not exist'),
            ]),
          );
        });
    });

    it('should reject missing required fields with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          username: 'incomplete_seller',
        })
        .expect(400)
        .expect((res) => {
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.length).toBeGreaterThanOrEqual(5);
        });
    });

    it('should reject invalid username formats and length bounds with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          username: 'ab', // < 3 chars
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('at least 3 characters')]),
          );
        });
    });

    it('should reject short first/last names or store name with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/seller')
        .send({
          ...validSellerPayload,
          firstName: 'A',
          lastName: 'B',
          storeName: 'C',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('First name must be at least 2 characters long'),
              expect.stringContaining('Last name must be at least 2 characters long'),
              expect.stringContaining('Store name must be at least 2 characters long'),
            ]),
          );
        });
    });
  });

  describe('POST /api/auth/register/user', () => {
    const validBuyerPayload = {
      username: 'new_buyer',
      email: 'new.buyer@tobetake.dev',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      firstName: 'Bruce',
      lastName: 'Wayne',
    };

    it('should register a new customer/buyer successfully (201 Created)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send(validBuyerPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User registered successfully');
          expect(res.body.data).toMatchObject({
            id: 'new-buyer-uuid',
            username: 'new_buyer',
            email: 'new.buyer@tobetake.dev',
            firstName: 'Bruce',
            lastName: 'Wayne',
            role: 'Buyer',
            roleCode: 'CUST',
            department: null,
            departmentId: null,
            designation: null,
            status: 'ACTIVE',
            isEmailVerified: false,
            isMobileVerified: false,
          });
          // Verify password and hash are not returned
          expect(res.body.data.password).toBeUndefined();
        });
    });

    it('should reject password mismatch with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          username: 'mismatch_buyer',
          email: 'mismatch@tobetake.dev',
          confirmPassword: 'DifferentPassword123!',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('Passwords do not match')]),
          );
        });
    });

    it('should reject weak password with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          username: 'another_buyer',
          email: 'buyer2@tobetake.dev',
          password: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('Password must be at least 8 characters long'),
            ]),
          );
        });
    });

    it('should reject invalid email with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          email: 'not-an-email',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('valid email')]),
          );
        });
    });

    it('should reject duplicate username with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          username: 'existing_user',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already taken');
        });
    });

    it('should reject duplicate email with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          username: 'unique_buyer_99',
          email: 'existing@tobetake.dev',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already registered');
        });
    });

    it('should reject requests attempting to inject security/role/internal fields (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          roleId: 1, // Super Admin escalation attempt
          role: 'ADMIN',
          status: 'SUSPENDED',
          isEmailVerified: true,
          isMobileVerified: true,
          isDeleted: true,
          departmentId: 1,
          designation: 'Executive',
          failedLoginAttempts: 99,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('property roleId should not exist'),
              expect.stringContaining('property role should not exist'),
              expect.stringContaining('property status should not exist'),
              expect.stringContaining('property isEmailVerified should not exist'),
              expect.stringContaining('property departmentId should not exist'),
              expect.stringContaining('property designation should not exist'),
            ]),
          );
        });
    });

    it('should reject missing required fields with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          username: 'incomplete_buyer',
        })
        .expect(400)
        .expect((res) => {
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.length).toBeGreaterThanOrEqual(4);
        });
    });

    it('should reject invalid username formats and length bounds with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          username: 'ab', // < 3 chars
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('at least 3 characters')]),
          );
        });
    });

    it('should reject short first/last names with 400 Bad Request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/user')
        .send({
          ...validBuyerPayload,
          firstName: 'A',
          lastName: 'B',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              expect.stringContaining('First name must be at least 2 characters long'),
              expect.stringContaining('Last name must be at least 2 characters long'),
            ]),
          );
        });
    });
  });
});
