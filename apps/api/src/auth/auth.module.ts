import { Module } from '@nestjs/common';
import { PasswordService } from '../common/services/password.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminRegistrationGuard } from './guards/admin-registration.guard';
import { SellerRegistrationGuard } from './guards/seller-registration.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, AdminRegistrationGuard, SellerRegistrationGuard],
  exports: [AuthService, PasswordService, AdminRegistrationGuard, SellerRegistrationGuard],
})
export class AuthModule {}
