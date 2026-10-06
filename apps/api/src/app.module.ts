import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { CustomerModule } from './customer/customer.module';
import configuration, { ThrottlerConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttlerConfig = configService.get<ThrottlerConfig>('throttler') || {
          ttl: 60000,
          limit: 120,
          authTtl: 60000,
          authLimit: 10,
          adminTtl: 60000,
          adminLimit: 30,
        };
        return {
          errorMessage: 'Too many requests, please try again later.',
          throttlers: [
            {
              name: 'default',
              ttl: throttlerConfig.ttl,
              limit: throttlerConfig.limit,
            },
          ],
        };
      },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    DepartmentsModule,
    AdminModule,
    SellerModule,
    CustomerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
