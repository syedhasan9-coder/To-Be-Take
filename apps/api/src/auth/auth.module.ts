import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordService } from '../common/services/password.service';
import { TokenService } from '../common/services/token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminRegistrationGuard } from './guards/admin-registration.guard';
import { SellerRegistrationGuard } from './guards/seller-registration.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    AdminRegistrationGuard,
    SellerRegistrationGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    AdminRegistrationGuard,
    SellerRegistrationGuard,
  ],
})
export class AuthModule {}
