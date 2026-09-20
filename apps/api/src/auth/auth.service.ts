import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaService, UserStatus } from '@tobetake/database';
import { PasswordService } from '../common/services/password.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  // Register a new Admin user
  async registerAdmin(dto: RegisterAdminDto, creatorId?: string | null): Promise<UserResponseDto> {
    this.logger.log(`Registering new Admin user: username='${dto.username}', email='${dto.email}'`);

    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new BadRequestException(
        `Invalid department selected (ID: ${dto.departmentId}). Department does not exist.`,
      );
    }

    // Check for duplicate username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException(`The username '${dto.username}' is already taken.`);
    }

    // Check for duplicate email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException(`The email address '${dto.email}' is already registered.`);
    }

    // Get Admin role
    const adminRole = await this.prisma.userRole.findUnique({
      where: { code: 'ADMIN' },
    });

    if (!adminRole) {
      this.logger.error("Admin role with code 'ADMIN' was not found in the database.");
      throw new InternalServerErrorException(
        'System role configuration error: Admin role is not configured.',
      );
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create Admin user
    const now = new Date();
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleId: adminRole.id,
          departmentId: department.id,
          designation: dto.designation,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          isMobileVerified: false,
          failedLoginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          deletedAt: null,
          lastLogin: null,
          passwordChangedAt: now,
          createdBy: creatorId ?? null,
        },
        include: {
          role: true,
          department: true,
        },
      });

      this.logger.log(`Admin user registered successfully (ID: ${newUser.id})`);

      // Return user response
      return new UserResponseDto({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role.name,
        roleCode: newUser.role.code,
        departmentId: newUser.department?.id ?? null,
        department: newUser.department?.name ?? null,
        designation: newUser.designation,
        status: newUser.status,
        isEmailVerified: newUser.isEmailVerified,
        isMobileVerified: newUser.isMobileVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('username')) {
          throw new ConflictException(`The username '${dto.username}' is already taken.`);
        }
        if (target.includes('email')) {
          throw new ConflictException(`The email address '${dto.email}' is already registered.`);
        }
        throw new ConflictException('A user with the specified username or email already exists.');
      }
      throw error;
    }
  }

  // Register a new Seller user
  async registerSeller(
    dto: RegisterSellerDto,
    creatorId?: string | null,
  ): Promise<UserResponseDto> {
    this.logger.log(
      `Registering new Seller user: username='${dto.username}', email='${dto.email}'`,
    );

    // Check for duplicate username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException(`The username '${dto.username}' is already taken.`);
    }

    // Check for duplicate email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException(`The email address '${dto.email}' is already registered.`);
    }

    // Get Seller role
    const sellerRole = await this.prisma.userRole.findUnique({
      where: { code: 'VENDOR' },
    });

    if (!sellerRole) {
      this.logger.error("Seller role with code 'VENDOR' was not found in the database.");
      throw new InternalServerErrorException(
        'System role configuration error: Seller role is not configured.',
      );
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create Seller user
    const now = new Date();
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleId: sellerRole.id,
          storeName: dto.storeName,
          businessCategory: dto.businessCategory,
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
          passwordChangedAt: now,
          createdBy: creatorId ?? null,
        },
        include: {
          role: true,
        },
      });

      this.logger.log(`Seller user registered successfully (ID: ${newUser.id})`);

      // Return user response
      return new UserResponseDto({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role.name,
        roleCode: newUser.role.code,
        storeName: newUser.storeName,
        businessCategory: newUser.businessCategory,
        departmentId: null,
        department: null,
        designation: null,
        status: newUser.status,
        isEmailVerified: newUser.isEmailVerified,
        isMobileVerified: newUser.isMobileVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('username')) {
          throw new ConflictException(`The username '${dto.username}' is already taken.`);
        }
        if (target.includes('email')) {
          throw new ConflictException(`The email address '${dto.email}' is already registered.`);
        }
        throw new ConflictException('A user with the specified username or email already exists.');
      }
      throw error;
    }
  }

  // Register a new Buyer user
  async registerUser(dto: RegisterUserDto, creatorId?: string | null): Promise<UserResponseDto> {
    this.logger.log(`Registering new Buyer user: username='${dto.username}', email='${dto.email}'`);

    // Validate password confirmation match
    if (dto.confirmPassword && dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    // Check for duplicate username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException(`The username '${dto.username}' is already taken.`);
    }

    // Check for duplicate email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException(`The email address '${dto.email}' is already registered.`);
    }

    // Get Buyer role
    const buyerRole = await this.prisma.userRole.findUnique({
      where: { code: 'CUST' },
    });

    if (!buyerRole) {
      this.logger.error("Buyer role with code 'CUST' was not found in the database.");
      throw new InternalServerErrorException(
        'System role configuration error: Buyer role is not configured.',
      );
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create Buyer user
    const now = new Date();
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleId: buyerRole.id,
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
          passwordChangedAt: now,
          createdBy: creatorId ?? null,
        },
        include: {
          role: true,
          department: true,
        },
      });

      this.logger.log(`Buyer user registered successfully (ID: ${newUser.id})`);

      // Return user response
      return new UserResponseDto({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role.name,
        roleCode: newUser.role.code,
        departmentId: null,
        department: null,
        designation: null,
        status: newUser.status,
        isEmailVerified: newUser.isEmailVerified,
        isMobileVerified: newUser.isMobileVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('username')) {
          throw new ConflictException(`The username '${dto.username}' is already taken.`);
        }
        if (target.includes('email')) {
          throw new ConflictException(`The email address '${dto.email}' is already registered.`);
        }
        throw new ConflictException('A user with the specified username or email already exists.');
      }
      throw error;
    }
  }
}
