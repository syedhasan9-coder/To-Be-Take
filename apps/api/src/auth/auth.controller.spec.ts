import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AdminRegistrationGuard } from './guards/admin-registration.guard';
import { SellerRegistrationGuard } from './guards/seller-registration.guard';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAdminResponse = new UserResponseDto({
    id: 'user-uuid-123',
    username: 'alex_admin',
    email: 'alex@tobetake.dev',
    firstName: 'Alex',
    lastName: 'Mercer',
    role: 'Admin',
    roleCode: 'ADMIN',
    departmentId: 1,
    department: 'Administration',
    designation: 'Manager',
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockSellerResponse = new UserResponseDto({
    id: 'seller-uuid-456',
    username: 'seller_fatima',
    email: 'fatima.seller@tobetake.dev',
    firstName: 'Fatima',
    lastName: 'Khan',
    role: 'Seller',
    roleCode: 'VENDOR',
    storeName: 'Fatima Boutique Lahore',
    businessCategory: 'Fashion & Apparel',
    departmentId: null,
    department: null,
    designation: null,
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockUserResponse = new UserResponseDto({
    id: 'buyer-uuid-789',
    username: 'buyer_bilal',
    email: 'bilal.buyer@tobetake.dev',
    firstName: 'Bilal',
    lastName: 'Ahmed',
    role: 'Buyer',
    roleCode: 'CUST',
    departmentId: null,
    department: null,
    designation: null,
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn().mockResolvedValue(mockAdminResponse),
      registerAdmin: jest.fn().mockResolvedValue(mockAdminResponse),
      registerSeller: jest.fn().mockResolvedValue(mockSellerResponse),
      registerUser: jest.fn().mockResolvedValue(mockUserResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('development') },
        },
        AdminRegistrationGuard,
        SellerRegistrationGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.login and return standard ApiResponse envelope', async () => {
    const dto = {
      username: 'tariq_admin',
      password: 'Password123!',
    };

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.data).toEqual(mockAdminResponse);
    expect(result.timestamp).toBeDefined();
  });

  it('should call authService.registerAdmin and return standard ApiResponse envelope', async () => {
    const dto: RegisterAdminDto = {
      firstName: 'Tariq',
      lastName: 'Mehmood',
      username: 'tariq_admin',
      email: 'tariq@tobetake.dev',
      password: 'Password123!',
      departmentId: 1,
      designation: 'Manager',
    };

    const result = await controller.registerAdmin(dto);

    expect(authService.registerAdmin).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Admin registered successfully');
    expect(result.data).toEqual(mockAdminResponse);
    expect(result.timestamp).toBeDefined();
  });

  it('should call authService.registerSeller and return standard ApiResponse envelope', async () => {
    const dto: RegisterSellerDto = {
      firstName: 'Fatima',
      lastName: 'Khan',
      username: 'seller_fatima',
      email: 'fatima.seller@tobetake.dev',
      password: 'Password123!',
      storeName: 'Fatima Boutique Lahore',
      businessCategory: 'Fashion & Apparel',
    };

    const result = await controller.registerSeller(dto);

    expect(authService.registerSeller).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Seller registered successfully');
    expect(result.data).toEqual(mockSellerResponse);
    expect(result.timestamp).toBeDefined();
  });

  it('should call authService.registerUser and return standard ApiResponse envelope', async () => {
    const dto = {
      firstName: 'Bilal',
      lastName: 'Ahmed',
      username: 'buyer_bilal',
      email: 'bilal.buyer@tobetake.dev',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };

    const result = await controller.registerUser(dto);

    expect(authService.registerUser).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
    expect(result.message).toBe('User registered successfully');
    expect(result.data).toEqual(mockUserResponse);
    expect(result.timestamp).toBeDefined();
  });
});
