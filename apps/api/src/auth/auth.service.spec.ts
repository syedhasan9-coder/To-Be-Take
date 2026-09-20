import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaService, UserStatus } from '@tobetake/database';
import { PasswordService } from '../common/services/password.service';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { RegisterUserDto } from './dto/register-user.dto';

describe('AuthService - Admin Registration', () => {
  let authService: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockAdminRole = {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    description: 'Platform Administrator',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDepartment = {
    id: 2,
    name: 'Vendor Management',
    code: 'VEND',
    description: 'Vendor operations',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validAdminDto: RegisterAdminDto = {
    username: 'admin_john',
    email: 'john.admin@tobetake.dev',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    departmentId: 2,
    designation: 'Operations Lead',
  };

  beforeEach(async () => {
    const mockPrisma = {
      department: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        findUnique: jest.fn(),
      },
    };

    const mockPassword = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordService, useValue: mockPassword },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    passwordService = module.get(PasswordService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should successfully register a new Admin user with strict security defaults', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword123');

    const createdUserMock = {
      id: 'usr-uuid-1234',
      username: validAdminDto.username,
      email: validAdminDto.email,
      password: '$2b$10$hashedPassword123',
      firstName: validAdminDto.firstName,
      lastName: validAdminDto.lastName,
      roleId: mockAdminRole.id,
      role: mockAdminRole,
      departmentId: mockDepartment.id,
      department: mockDepartment,
      designation: validAdminDto.designation,
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
    };

    (prismaService.user.create as jest.Mock).mockResolvedValue(createdUserMock);

    const result = await authService.registerAdmin(validAdminDto);

    expect(result).toBeDefined();
    expect(result.id).toBe('usr-uuid-1234');
    expect(result.username).toBe('admin_john');
    expect(result.email).toBe('john.admin@tobetake.dev');
    expect(result.role).toBe('Admin');
    expect(result.roleCode).toBe('ADMIN');
    expect(result.department).toBe('Vendor Management');
    expect(result.departmentId).toBe(2);
    expect(result.status).toBe(UserStatus.ACTIVE);
    expect(result.isEmailVerified).toBe(false);
    expect(result.isMobileVerified).toBe(false);

    // Verify password and hash are NOT present in result
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();

    // Verify password was hashed with dedicated password service
    expect(passwordService.hash).toHaveBeenCalledWith('Password123!');
    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: '$2b$10$hashedPassword123',
          roleId: mockAdminRole.id,
          departmentId: mockDepartment.id,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          isMobileVerified: false,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          deletedAt: null,
          lastLogin: null,
        }),
      }),
    );
  });

  it('should attach creatorId when provided by super admin caller', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword123');

    const createdUserMock = {
      id: 'usr-uuid-1234',
      username: validAdminDto.username,
      email: validAdminDto.email,
      password: '$2b$10$hashedPassword123',
      firstName: validAdminDto.firstName,
      lastName: validAdminDto.lastName,
      roleId: mockAdminRole.id,
      role: mockAdminRole,
      departmentId: mockDepartment.id,
      department: mockDepartment,
      designation: validAdminDto.designation,
      status: UserStatus.ACTIVE,
      isEmailVerified: false,
      isMobileVerified: false,
      failedLoginAttempts: 0,
      isLocked: false,
      isDeleted: false,
      deletedAt: null,
      lastLogin: null,
      passwordChangedAt: new Date(),
      createdBy: 'superadmin-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prismaService.user.create as jest.Mock).mockResolvedValue(createdUserMock);

    await authService.registerAdmin(validAdminDto, 'superadmin-uuid');

    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: 'superadmin-uuid',
        }),
      }),
    );
  });

  it('should throw BadRequestException if the department does not exist', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(BadRequestException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if the username is already taken', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.username === validAdminDto.username) {
        return Promise.resolve({ id: 'existing-id', username: validAdminDto.username });
      }
      return Promise.resolve(null);
    });

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(ConflictException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if the email is already registered', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.email === validAdminDto.email) {
        return Promise.resolve({ id: 'existing-id', email: validAdminDto.email });
      }
      return Promise.resolve(null);
    });

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(ConflictException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should handle Prisma P2002 unique constraint race condition for username cleanly', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword123');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['username'] },
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(
      new ConflictException(`The username '${validAdminDto.username}' is already taken.`),
    );
  });

  it('should handle Prisma P2002 unique constraint race condition for email cleanly', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword123');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['email'] },
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(
      new ConflictException(`The email address '${validAdminDto.email}' is already registered.`),
    );
  });

  it('should handle Prisma P2002 unique constraint race condition fallback cleanly', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword123');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: {},
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(
      new ConflictException('A user with the specified username or email already exists.'),
    );
  });

  it('should throw InternalServerErrorException if ADMIN role is missing in database', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartment);
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(authService.registerAdmin(validAdminDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });
});

describe('AuthService - Seller Registration', () => {
  let authService: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockSellerRole = {
    id: 3,
    name: 'Seller',
    code: 'VENDOR',
    description: 'Seller / Vendor account',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validSellerDto: RegisterSellerDto = {
    username: 'seller_alice',
    email: 'alice.seller@tobetake.dev',
    password: 'Password123!',
    firstName: 'Alice',
    lastName: 'Smith',
    storeName: 'Alice Boutique',
    businessCategory: 'Fashion & Apparel',
  };

  beforeEach(async () => {
    const mockPrisma = {
      department: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        findUnique: jest.fn(),
      },
    };

    const mockPassword = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordService, useValue: mockPassword },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    passwordService = module.get(PasswordService);
  });

  it('should successfully register a new Seller user with strict security defaults', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockSellerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword456');

    const createdUserMock = {
      id: 'usr-uuid-5678',
      username: validSellerDto.username,
      email: validSellerDto.email,
      password: '$2b$10$hashedPassword456',
      firstName: validSellerDto.firstName,
      lastName: validSellerDto.lastName,
      roleId: mockSellerRole.id,
      role: mockSellerRole,
      storeName: validSellerDto.storeName,
      businessCategory: validSellerDto.businessCategory,
      departmentId: null,
      designation: null,
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
    };

    (prismaService.user.create as jest.Mock).mockResolvedValue(createdUserMock);

    const result = await authService.registerSeller(validSellerDto);

    expect(result).toBeDefined();
    expect(result.id).toBe('usr-uuid-5678');
    expect(result.username).toBe('seller_alice');
    expect(result.email).toBe('alice.seller@tobetake.dev');
    expect(result.role).toBe('Seller');
    expect(result.roleCode).toBe('VENDOR');
    expect(result.storeName).toBe('Alice Boutique');
    expect(result.businessCategory).toBe('Fashion & Apparel');
    expect(result.department).toBeNull();
    expect(result.departmentId).toBeNull();
    expect(result.designation).toBeNull();
    expect(result.status).toBe(UserStatus.ACTIVE);
    expect(result.isEmailVerified).toBe(false);
    expect(result.isMobileVerified).toBe(false);

    // Verify password and hash are NOT present in result
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();

    // Verify password was hashed with dedicated password service
    expect(passwordService.hash).toHaveBeenCalledWith('Password123!');
    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: '$2b$10$hashedPassword456',
          roleId: mockSellerRole.id,
          storeName: 'Alice Boutique',
          businessCategory: 'Fashion & Apparel',
          departmentId: null,
          designation: null,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          isMobileVerified: false,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          deletedAt: null,
          lastLogin: null,
        }),
      }),
    );
  });

  it('should attach creatorId when provided', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockSellerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword456');

    const createdUserMock = {
      id: 'usr-uuid-5678',
      username: validSellerDto.username,
      email: validSellerDto.email,
      password: '$2b$10$hashedPassword456',
      firstName: validSellerDto.firstName,
      lastName: validSellerDto.lastName,
      roleId: mockSellerRole.id,
      role: mockSellerRole,
      storeName: validSellerDto.storeName,
      businessCategory: validSellerDto.businessCategory,
      departmentId: null,
      designation: null,
      status: UserStatus.ACTIVE,
      isEmailVerified: false,
      isMobileVerified: false,
      failedLoginAttempts: 0,
      isLocked: false,
      isDeleted: false,
      deletedAt: null,
      lastLogin: null,
      passwordChangedAt: new Date(),
      createdBy: 'creator-admin-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prismaService.user.create as jest.Mock).mockResolvedValue(createdUserMock);

    await authService.registerSeller(validSellerDto, 'creator-admin-uuid');

    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: 'creator-admin-uuid',
        }),
      }),
    );
  });

  it('should throw ConflictException if the username is already taken', async () => {
    (prismaService.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.username === validSellerDto.username) {
        return Promise.resolve({ id: 'existing-id', username: validSellerDto.username });
      }
      return Promise.resolve(null);
    });

    await expect(authService.registerSeller(validSellerDto)).rejects.toThrow(ConflictException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if the email is already registered', async () => {
    (prismaService.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.email === validSellerDto.email) {
        return Promise.resolve({ id: 'existing-id', email: validSellerDto.email });
      }
      return Promise.resolve(null);
    });

    await expect(authService.registerSeller(validSellerDto)).rejects.toThrow(ConflictException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should handle Prisma P2002 unique constraint race condition for username cleanly', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockSellerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword456');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['username'] },
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerSeller(validSellerDto)).rejects.toThrow(
      new ConflictException(`The username '${validSellerDto.username}' is already taken.`),
    );
  });

  it('should handle Prisma P2002 unique constraint race condition for email cleanly', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockSellerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword456');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['email'] },
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerSeller(validSellerDto)).rejects.toThrow(
      new ConflictException(`The email address '${validSellerDto.email}' is already registered.`),
    );
  });

  it('should handle Prisma P2002 unique constraint race condition fallback cleanly', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockSellerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword456');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: {},
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerSeller(validSellerDto)).rejects.toThrow(
      new ConflictException('A user with the specified username or email already exists.'),
    );
  });

  it('should throw InternalServerErrorException if VENDOR role is missing in database', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(authService.registerSeller(validSellerDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });
});

describe('AuthService - User / Buyer Registration', () => {
  let authService: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockBuyerRole = {
    id: 4,
    name: 'Buyer',
    code: 'CUST',
    description: 'Buyer / Customer account',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validBuyerDto: RegisterUserDto = {
    username: 'buyer_bob',
    email: 'bob.buyer@tobetake.dev',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    firstName: 'Bob',
    lastName: 'Dylan',
  };

  beforeEach(async () => {
    const mockPrisma = {
      department: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        findUnique: jest.fn(),
      },
    };

    const mockPassword = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordService, useValue: mockPassword },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    passwordService = module.get(PasswordService);
  });

  it('should successfully register a new Buyer user with strict security defaults', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockBuyerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword789');

    const createdUserMock = {
      id: 'usr-uuid-9999',
      username: validBuyerDto.username,
      email: validBuyerDto.email,
      password: '$2b$10$hashedPassword789',
      firstName: validBuyerDto.firstName,
      lastName: validBuyerDto.lastName,
      roleId: mockBuyerRole.id,
      role: mockBuyerRole,
      departmentId: null,
      department: null,
      designation: null,
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
    };

    (prismaService.user.create as jest.Mock).mockResolvedValue(createdUserMock);

    const result = await authService.registerUser(validBuyerDto);

    expect(result).toBeDefined();
    expect(result.id).toBe('usr-uuid-9999');
    expect(result.username).toBe('buyer_bob');
    expect(result.email).toBe('bob.buyer@tobetake.dev');
    expect(result.firstName).toBe('Bob');
    expect(result.lastName).toBe('Dylan');
    expect(result.role).toBe('Buyer');
    expect(result.roleCode).toBe('CUST');
    expect(result.department).toBeNull();
    expect(result.departmentId).toBeNull();
    expect(result.designation).toBeNull();
    expect(result.status).toBe(UserStatus.ACTIVE);
    expect(result.isEmailVerified).toBe(false);
    expect(result.isMobileVerified).toBe(false);

    // Verify password and hash are NOT present in result
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();

    // Verify password was hashed with dedicated password service
    expect(passwordService.hash).toHaveBeenCalledWith('Password123!');
    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: 'buyer_bob',
          email: 'bob.buyer@tobetake.dev',
          password: '$2b$10$hashedPassword789',
          firstName: 'Bob',
          lastName: 'Dylan',
          roleId: mockBuyerRole.id,
          departmentId: null,
          designation: null,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          isMobileVerified: false,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          deletedAt: null,
          lastLogin: null,
        }),
      }),
    );
  });

  it('should throw BadRequestException when confirmPassword does not match password', async () => {
    const mismatchedDto: RegisterUserDto = {
      ...validBuyerDto,
      confirmPassword: 'DifferentPassword123!',
    };

    await expect(authService.registerUser(mismatchedDto)).rejects.toThrow(
      new BadRequestException('Passwords do not match.'),
    );
    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if username is already registered', async () => {
    (prismaService.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.username === validBuyerDto.username) {
        return Promise.resolve({ id: 'existing-id', username: validBuyerDto.username });
      }
      return Promise.resolve(null);
    });

    await expect(authService.registerUser(validBuyerDto)).rejects.toThrow(
      new ConflictException(`The username '${validBuyerDto.username}' is already taken.`),
    );
    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if email is already registered', async () => {
    (prismaService.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.email === validBuyerDto.email) {
        return Promise.resolve({ id: 'existing-id', email: validBuyerDto.email });
      }
      return Promise.resolve(null);
    });

    await expect(authService.registerUser(validBuyerDto)).rejects.toThrow(
      new ConflictException(`The email address '${validBuyerDto.email}' is already registered.`),
    );
    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('should handle Prisma P2002 unique constraint race condition on username', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockBuyerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword789');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['username'] },
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerUser(validBuyerDto)).rejects.toThrow(
      new ConflictException(`The username '${validBuyerDto.username}' is already taken.`),
    );
  });

  it('should handle Prisma P2002 unique constraint race condition on email', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockBuyerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword789');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['email'] },
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerUser(validBuyerDto)).rejects.toThrow(
      new ConflictException(`The email address '${validBuyerDto.email}' is already registered.`),
    );
  });

  it('should handle Prisma P2002 unique constraint race condition fallback cleanly', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(mockBuyerRole);
    (passwordService.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword789');

    const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: {},
    });

    (prismaService.user.create as jest.Mock).mockRejectedValue(p2002Error);

    await expect(authService.registerUser(validBuyerDto)).rejects.toThrow(
      new ConflictException('A user with the specified username or email already exists.'),
    );
  });

  it('should throw InternalServerErrorException if CUST role is missing in database', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaService.userRole.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(authService.registerUser(validBuyerDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });
});
