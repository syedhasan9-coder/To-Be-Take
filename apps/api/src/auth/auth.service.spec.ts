import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaService, UserStatus } from '@tobetake/database';
import { PasswordService } from '../common/services/password.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
    username: 'admin_tariq',
    email: 'tariq.admin@tobetake.dev',
    password: 'Password123!',
    firstName: 'Tariq',
    lastName: 'Mehmood',
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
    expect(result.username).toBe('admin_tariq');
    expect(result.email).toBe('tariq.admin@tobetake.dev');
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
    username: 'seller_fatima',
    email: 'fatima.seller@tobetake.dev',
    password: 'Password123!',
    firstName: 'Fatima',
    lastName: 'Khan',
    storeName: 'Fatima Boutique',
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
    expect(result.username).toBe('seller_fatima');
    expect(result.email).toBe('fatima.seller@tobetake.dev');
    expect(result.role).toBe('Seller');
    expect(result.roleCode).toBe('VENDOR');
    expect(result.storeName).toBe('Fatima Boutique');
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
          storeName: 'Fatima Boutique',
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
    username: 'buyer_bilal',
    email: 'bilal.buyer@tobetake.dev',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    firstName: 'Bilal',
    lastName: 'Ahmed',
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
    expect(result.username).toBe('buyer_bilal');
    expect(result.email).toBe('bilal.buyer@tobetake.dev');
    expect(result.firstName).toBe('Bilal');
    expect(result.lastName).toBe('Ahmed');
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
          username: 'buyer_bilal',
          email: 'bilal.buyer@tobetake.dev',
          password: '$2b$10$hashedPassword789',
          firstName: 'Bilal',
          lastName: 'Ahmed',
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

describe('AuthService - Login', () => {
  let authService: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockSuperAdminRole = {
    id: 1,
    name: 'Super Admin',
    code: 'SPADMIN',
    description: 'Super Administrator with full platform privileges',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRole = {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    description: 'Platform Administrator',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDepartment = {
    id: 1,
    name: 'Administration',
    code: 'ADMN',
    description: 'Administration ops',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuperAdminUser = {
    id: 'superadmin-uuid-1',
    username: 'superadmin',
    email: 'superadmin@tobetake.dev',
    password: '$2b$10$hashedSuperAdminPassword',
    firstName: 'Super',
    lastName: 'Admin',
    roleId: 1,
    role: mockSuperAdminRole,
    departmentId: 1,
    department: mockDepartment,
    designation: 'System Administrator',
    storeName: null,
    businessCategory: null,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: true,
    failedLoginAttempts: 0,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    deletedAt: null,
    lastLogin: null,
    passwordChangedAt: new Date(),
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 'admin-uuid-2',
    username: 'admin_tariq',
    email: 'tariq.admin@tobetake.dev',
    password: '$2b$10$hashedAdminPassword',
    firstName: 'Tariq',
    lastName: 'Mehmood',
    roleId: 2,
    role: mockAdminRole,
    departmentId: 1,
    department: mockDepartment,
    designation: 'Operations Lead',
    storeName: null,
    businessCategory: null,
    status: UserStatus.ACTIVE,
    isEmailVerified: false,
    isMobileVerified: false,
    failedLoginAttempts: 0,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    deletedAt: null,
    lastLogin: null,
    passwordChangedAt: new Date(),
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBuyerRole = {
    id: 4,
    name: 'Buyer',
    code: 'CUST',
    description: 'Buyer / Customer account',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellerRole = {
    id: 3,
    name: 'Seller',
    code: 'VENDOR',
    description: 'Seller / Vendor account',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBuyerUser = {
    id: 'buyer-uuid-1',
    username: 'buyer_bilal',
    email: 'bilal.buyer@tobetake.dev',
    password: '$2b$10$hashedBuyerPassword',
    firstName: 'Bilal',
    lastName: 'Ahmed',
    roleId: 4,
    role: mockBuyerRole,
    departmentId: null,
    department: null,
    designation: null,
    storeName: null,
    businessCategory: null,
    status: UserStatus.ACTIVE,
    isEmailVerified: false,
    isMobileVerified: false,
    failedLoginAttempts: 0,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    deletedAt: null,
    lastLogin: null,
    passwordChangedAt: new Date(),
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellerUser = {
    id: 'seller-uuid-1',
    username: 'seller_fatima',
    email: 'fatima.seller@tobetake.dev',
    password: '$2b$10$hashedSellerPassword',
    firstName: 'Fatima',
    lastName: 'Khan',
    roleId: 3,
    role: mockSellerRole,
    departmentId: null,
    department: null,
    designation: null,
    storeName: 'Fatima Boutique',
    businessCategory: 'Fashion & Apparel',
    status: UserStatus.ACTIVE,
    isEmailVerified: false,
    isMobileVerified: false,
    failedLoginAttempts: 0,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    deletedAt: null,
    lastLogin: null,
    passwordChangedAt: new Date(),
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
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

  it('should authenticate a valid Super Admin using username', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSuperAdminUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      username: 'superadmin',
      password: 'SuperAdmin@2026!',
    };

    const result = await authService.login(loginDto);

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: 'superadmin' }, { email: 'superadmin' }],
        isDeleted: false,
      },
      include: {
        role: true,
        department: true,
      },
    });
    expect(passwordService.compare).toHaveBeenCalledWith(
      'SuperAdmin@2026!',
      mockSuperAdminUser.password,
    );
    expect(prismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockSuperAdminUser.id },
        data: expect.objectContaining({ failedLoginAttempts: 0 }),
      }),
    );
    expect(result.id).toBe(mockSuperAdminUser.id);
    expect(result.username).toBe('superadmin');
    expect(result.email).toBe('superadmin@tobetake.dev');
    expect(result.role).toBe('Super Admin');
    expect(result.roleCode).toBe('SPADMIN');
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('should authenticate a valid Admin using email', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockAdminUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      email: 'tariq.admin@tobetake.dev',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: 'tariq.admin@tobetake.dev' }, { email: 'tariq.admin@tobetake.dev' }],
        isDeleted: false,
      },
      include: {
        role: true,
        department: true,
      },
    });
    expect(result.id).toBe(mockAdminUser.id);
    expect(result.username).toBe('admin_tariq');
    expect(result.role).toBe('Admin');
    expect(result.roleCode).toBe('ADMIN');
  });

  it('should authenticate a valid Buyer user using username', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockBuyerUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      username: 'buyer_bilal',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(result.id).toBe(mockBuyerUser.id);
    expect(result.username).toBe('buyer_bilal');
    expect(result.email).toBe('bilal.buyer@tobetake.dev');
    expect(result.role).toBe('Buyer');
    expect(result.roleCode).toBe('CUST');
    expect(result.department).toBeNull();
    expect(result.storeName).toBeNull();
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('should authenticate a valid Buyer user using email', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockBuyerUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      email: 'bilal.buyer@tobetake.dev',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(result.id).toBe(mockBuyerUser.id);
    expect(result.username).toBe('buyer_bilal');
    expect(result.roleCode).toBe('CUST');
  });

  it('should authenticate a valid Seller user using username', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      username: 'seller_fatima',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(result.id).toBe(mockSellerUser.id);
    expect(result.username).toBe('seller_fatima');
    expect(result.email).toBe('fatima.seller@tobetake.dev');
    expect(result.role).toBe('Seller');
    expect(result.roleCode).toBe('VENDOR');
    expect(result.storeName).toBe('Fatima Boutique');
    expect(result.businessCategory).toBe('Fashion & Apparel');
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('should authenticate a valid Seller user using email', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      email: 'fatima.seller@tobetake.dev',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(result.id).toBe(mockSellerUser.id);
    expect(result.username).toBe('seller_fatima');
    expect(result.roleCode).toBe('VENDOR');
    expect(result.storeName).toBe('Fatima Boutique');
  });

  it('should authenticate when identifier is provided via usernameOrEmail', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockAdminUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      usernameOrEmail: 'admin_tariq',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(result.id).toBe(mockAdminUser.id);
  });

  it('should authenticate when identifier is provided via identifier field directly', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      identifier: 'seller_fatima',
      password: 'Password123!',
    };

    const result = await authService.login(loginDto);

    expect(result.id).toBe(mockSellerUser.id);
    expect(result.roleCode).toBe('VENDOR');
  });

  it('should throw BadRequestException if no username or email is provided', async () => {
    const loginDto = {
      password: 'Password123!',
    } as LoginDto;

    await expect(authService.login(loginDto)).rejects.toThrow(
      new BadRequestException('Username or email is required.'),
    );
    expect(prismaService.user.findFirst).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if user is not found (prevents enumeration)', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

    const loginDto: LoginDto = {
      username: 'nonexistent_user',
      password: 'Password123!',
    };

    await expect(authService.login(loginDto)).rejects.toThrow(
      new UnauthorizedException('Invalid credentials.'),
    );
    expect(passwordService.compare).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException and increment failed attempts if password is wrong', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockAdminUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(false);

    const loginDto: LoginDto = {
      username: 'admin_tariq',
      password: 'WrongPassword!',
    };

    await expect(authService.login(loginDto)).rejects.toThrow(
      new UnauthorizedException('Invalid credentials.'),
    );
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: mockAdminUser.id },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  });

  it('should throw UnauthorizedException if account is inactive', async () => {
    const inactiveUser = { ...mockAdminUser, status: UserStatus.INACTIVE };
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(inactiveUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      username: 'admin_tariq',
      password: 'Password123!',
    };

    await expect(authService.login(loginDto)).rejects.toThrow(
      new UnauthorizedException(
        'Account is inactive or suspended. Please contact an administrator.',
      ),
    );
  });

  it('should throw UnauthorizedException if account is suspended', async () => {
    const suspendedUser = { ...mockAdminUser, status: UserStatus.SUSPENDED };
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(suspendedUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      username: 'admin_tariq',
      password: 'Password123!',
    };

    await expect(authService.login(loginDto)).rejects.toThrow(
      new UnauthorizedException(
        'Account is inactive or suspended. Please contact an administrator.',
      ),
    );
  });

  it('should throw UnauthorizedException if account is locked with future lockedUntil', async () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60);
    const lockedUser = { ...mockAdminUser, isLocked: true, lockedUntil: futureDate };
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(lockedUser);
    (passwordService.compare as jest.Mock).mockResolvedValue(true);

    const loginDto: LoginDto = {
      username: 'admin_tariq',
      password: 'Password123!',
    };

    await expect(authService.login(loginDto)).rejects.toThrow(
      new UnauthorizedException('Account is locked. Please contact an administrator.'),
    );
  });

  describe('Portal & Role Boundary Enforcement (Regression Tests)', () => {
    it('1. Seller login + VENDOR = allowed', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'seller_fatima',
        password: 'Password123!',
        portal: 'seller',
        requiredRole: 'VENDOR',
      };

      const result = await authService.login(loginDto);
      expect(result.roleCode).toBe('VENDOR');
      expect(result.username).toBe('seller_fatima');
    });

    it('2. Seller login + ADMIN = rejected with 401', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockAdminUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'admin_tariq',
        password: 'Password123!',
        portal: 'seller',
        requiredRole: 'VENDOR',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Access denied. Seller account required.'),
      );
    });

    it('3. Seller login + SPADMIN = rejected with 401', async () => {
      const mockSpadminUser = {
        ...mockAdminUser,
        id: 'spadmin-uuid',
        username: 'superadmin',
        role: { id: 1, name: 'Super Admin', code: 'SPADMIN' },
      };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSpadminUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'superadmin',
        password: 'Password123!',
        portal: 'seller',
        requiredRole: 'VENDOR',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Access denied. Seller account required.'),
      );
    });

    it('4. Seller login + CUSTOMER = rejected with 401', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockBuyerUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'buyer_bilal',
        password: 'Password123!',
        portal: 'seller',
        requiredRole: 'VENDOR',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Access denied. Seller account required.'),
      );
    });

    it('5. Admin login + VENDOR = rejected with 401', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'seller_fatima',
        password: 'Password123!',
        portal: 'admin',
        requiredRole: 'ADMIN',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Access denied. Administrator privileges required.'),
      );
    });

    it('6. Customer login + VENDOR = rejected with 401', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockSellerUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'seller_fatima',
        password: 'Password123!',
        portal: 'user',
        requiredRole: 'CUST',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Access denied. Customer account required.'),
      );
    });

    it('7. Seller login + PENDING_VERIFICATION seller = rejected with 401', async () => {
      const pendingSeller = { ...mockSellerUser, status: UserStatus.PENDING_VERIFICATION };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(pendingSeller);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = {
        identifier: 'seller_fatima',
        password: 'Password123!',
        portal: 'seller',
        requiredRole: 'VENDOR',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(
          'Your seller account is pending verification. Please wait for administrator approval.',
        ),
      );
    });
  });
});
