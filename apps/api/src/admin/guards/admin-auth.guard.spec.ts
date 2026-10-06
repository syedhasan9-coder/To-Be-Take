import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService, UserStatus } from '@tobetake/database';
import { AdminAuthGuard } from './admin-auth.guard';

describe('AdminAuthGuard - Security & Hardening Matrix', () => {
  let guard: AdminAuthGuard;
  let prisma: jest.Mocked<PrismaService>;
  const originalEnv = process.env;

  const mockSuperAdminUser = {
    id: 'spadmin-1',
    username: 'superadmin',
    email: 'superadmin@tobetake.dev',
    firstName: 'Super',
    lastName: 'Admin',
    roleId: 1,
    role: {
      id: 1,
      name: 'Super Admin',
      code: 'SPADMIN',
      rolePermissions: [],
    },
    departmentId: 1,
    department: { id: 1, name: 'Administration', code: 'ADMN' },
    designation: 'System Administrator',
    status: UserStatus.ACTIVE,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
  };

  const mockAdminUser = {
    id: 'admin-1',
    username: 'admin1',
    email: 'admin1@tobetake.dev',
    firstName: 'Admin',
    lastName: 'One',
    roleId: 2,
    role: {
      id: 2,
      name: 'Admin',
      code: 'ADMIN',
      rolePermissions: [
        { permission: { id: 1, code: 'USERS_VIEW', name: 'View Users', category: 'Users' } },
      ],
    },
    departmentId: 2,
    department: { id: 2, name: 'Operations', code: 'OPS' },
    designation: 'Ops Lead',
    status: UserStatus.ACTIVE,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
  };

  const mockCustomerUser = {
    id: 'cust-1',
    username: 'cust1',
    email: 'cust1@tobetake.dev',
    firstName: 'Customer',
    lastName: 'User',
    roleId: 4,
    role: { id: 4, name: 'Buyer', code: 'CUST', rolePermissions: [] },
    status: UserStatus.ACTIVE,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
  };

  const mockSellerUser = {
    id: 'seller-1',
    username: 'seller1',
    email: 'seller1@tobetake.dev',
    firstName: 'Seller',
    lastName: 'User',
    roleId: 3,
    role: { id: 3, name: 'Seller', code: 'VENDOR', rolePermissions: [] },
    status: UserStatus.ACTIVE,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ALLOW_DEV_SUPERADMIN_FALLBACK;

    prisma = {
      user: {
        findFirst: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    guard = new AdminAuthGuard(prisma);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createMockContext = (headers: Record<string, string>) => {
    const request = {
      headers,
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  // Scenario 1: Production + No Auth Headers => 401 Unauthorized
  it('Scenario 1: should strictly reject unauthenticated request in production with 401', async () => {
    process.env.NODE_ENV = 'production';
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  // Scenario 2: Staging + No Auth Headers => 401 Unauthorized
  it('Scenario 2: should strictly reject unauthenticated request in staging with 401', async () => {
    process.env.NODE_ENV = 'staging';
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  // Scenario 3: Development + Fallback Disabled (Default) => 401 Unauthorized
  it('Scenario 3: should reject unauthenticated request in development when fallback is disabled by default', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DEV_SUPERADMIN_FALLBACK;
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  // Scenario 4: Development + Explicit Opt-In Fallback Flag => Allowed
  it('Scenario 4: should allow Super Admin fallback only when explicitly enabled in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_SUPERADMIN_FALLBACK = 'true';
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockSuperAdminUser);

    const context = createMockContext({});
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user.roleCode).toBe('SPADMIN');
    expect(req.user.permissions).toContain('*');
  });

  // Scenario 5: Valid Super Admin with Authorization Header => Allowed
  it('Scenario 5: should authenticate Super Admin user with Bearer token', async () => {
    process.env.NODE_ENV = 'production';
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockSuperAdminUser);
    const context = createMockContext({ authorization: 'Bearer spadmin-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user.roleCode).toBe('SPADMIN');
    expect(req.user.permissions).toContain('*');
  });

  // Scenario 6: Valid Operational Admin with Header => Allowed
  it('Scenario 6: should authenticate operational Admin user with x-user-id header', async () => {
    process.env.NODE_ENV = 'production';
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockAdminUser);
    const context = createMockContext({ 'x-user-id': 'admin-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user.roleCode).toBe('ADMIN');
    expect(req.user.permissions).toContain('USERS_VIEW');
  });

  // Scenario 7: Customer with Header attempting Admin Access => 403 Forbidden
  it('Scenario 7: should strictly reject Customer user with 403 Forbidden', async () => {
    process.env.NODE_ENV = 'production';
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockCustomerUser);
    const context = createMockContext({ 'x-user-id': 'cust-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  // Scenario 8: Seller with Header attempting Admin Access => 403 Forbidden
  it('Scenario 8: should strictly reject Seller user with 403 Forbidden', async () => {
    process.env.NODE_ENV = 'production';
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
    const context = createMockContext({ 'x-user-id': 'seller-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  // Scenario 9: Suspended Admin with Header => 403 Forbidden
  it('Scenario 9: should reject suspended admin user with 403 Forbidden', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      status: UserStatus.SUSPENDED,
    });
    const context = createMockContext({ 'x-user-id': 'admin-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  // Scenario 10: Unknown/Revoked user id => 401 Unauthorized
  it('Scenario 10: should reject unknown user ID with 401 Unauthorized', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    const context = createMockContext({ 'x-user-id': 'unknown-id' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
