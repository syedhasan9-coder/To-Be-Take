import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AdminAuditService } from '../admin/services/admin-audit.service';
import { LeopardsCourierProvider } from './providers/leopards-courier.provider';
import { ManualCourierProvider } from './providers/manual-courier.provider';
import { TcsCourierProvider } from './providers/tcs-courier.provider';
import { CodSettlementService } from './services/cod-settlement.service';
import { CourierRegistryService } from './services/courier-registry.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [
    ManualCourierProvider,
    TcsCourierProvider,
    LeopardsCourierProvider,
    CourierRegistryService,
    CodSettlementService,
    AdminAuditService,
  ],
  exports: [
    CourierRegistryService,
    ManualCourierProvider,
    TcsCourierProvider,
    LeopardsCourierProvider,
    CodSettlementService,
  ],
})
export class ShippingModule {}
