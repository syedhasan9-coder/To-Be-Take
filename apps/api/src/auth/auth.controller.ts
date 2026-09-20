import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@tobetake/shared-types';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AdminRegistrationGuard } from './guards/admin-registration.guard';
import { SellerRegistrationGuard } from './guards/seller-registration.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Admin registration endpoint
  @Post('register/admin')
  @UseGuards(AdminRegistrationGuard)
  @HttpCode(HttpStatus.CREATED)
  async registerAdmin(
    @Body() registerAdminDto: RegisterAdminDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.authService.registerAdmin(registerAdminDto);

    return {
      success: true,
      message: 'Admin registered successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  // Seller registration endpoint
  @Post('register/seller')
  @UseGuards(SellerRegistrationGuard)
  @HttpCode(HttpStatus.CREATED)
  async registerSeller(
    @Body() registerSellerDto: RegisterSellerDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.authService.registerSeller(registerSellerDto);

    return {
      success: true,
      message: 'Seller registered successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  // Buyer registration endpoint
  @Post('register/user')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.authService.registerUser(registerUserDto);

    return {
      success: true,
      message: 'User registered successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }
}
