import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, UserStatus } from '@tobetake/database';
import { SellerAuthGuard } from './seller-auth.guard';

describe('SellerAuthGuard', () => {
  let guard: SellerAuthGuard;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
  };

  const createMockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
    const request = { headers, user: null };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerAuthGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get<SellerAuthGuard>(SellerAuthGuard);
  });

  it('should throw UnauthorizedException if no auth credentials are provided', async () => {
    const context = createMockExecutionContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should authenticate a valid VENDOR user and inject into request.user', async () => {
    const mockSeller = {
      id: 'seller-123',
      username: 'vendor_tariq',
      email: 'vendor@almadina.pk',
      firstName: 'Tariq',
      lastName: 'Mehmood',
      roleId: 3,
      storeName: 'Al-Madina Electronics & Gadgets',
      businessCategory: 'Electronics & Gadgets',
      status: UserStatus.ACTIVE,
      isLocked: false,
      lockedUntil: null,
      role: { id: 3, name: 'Seller', code: 'VENDOR' },
    };

    prisma.user.findFirst.mockResolvedValue(mockSeller);

    const context = createMockExecutionContext({
      authorization: 'Bearer seller-123',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({
      id: 'seller-123',
      username: 'vendor_tariq',
      email: 'vendor@almadina.pk',
      firstName: 'Tariq',
      lastName: 'Mehmood',
      roleId: 3,
      role: 'Seller',
      roleCode: 'VENDOR',
      storeName: 'Al-Madina Electronics & Gadgets',
      businessCategory: 'Electronics & Gadgets',
    });
  });

  it('should reject non-vendor user (CUSTOMER or ADMIN) with ForbiddenException', async () => {
    const mockCustomer = {
      id: 'cust-123',
      username: 'buyer_fatima',
      email: 'fatima@buyer.pk',
      firstName: 'Fatima',
      lastName: 'Khan',
      roleId: 4,
      status: UserStatus.ACTIVE,
      isLocked: false,
      lockedUntil: null,
      role: { id: 4, name: 'Buyer', code: 'CUST' },
    };

    prisma.user.findFirst.mockResolvedValue(mockCustomer);

    const context = createMockExecutionContext({
      authorization: 'Bearer cust-123',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should reject locked or suspended seller with ForbiddenException', async () => {
    const mockSuspended = {
      id: 'seller-locked',
      username: 'vendor_locked',
      email: 'locked@vendor.com',
      firstName: 'Locked',
      lastName: 'Seller',
      roleId: 3,
      status: UserStatus.SUSPENDED,
      isLocked: false,
      role: { id: 3, name: 'Seller', code: 'VENDOR' },
    };

    prisma.user.findFirst.mockResolvedValue(mockSuspended);

    const context = createMockExecutionContext({
      authorization: 'Bearer seller-locked',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
