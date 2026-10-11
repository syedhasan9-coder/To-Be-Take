import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { EasypaisaService } from './services/easypaisa.service';
import { PaymentsWebhookController } from './controllers/payments-webhook.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [PaymentsWebhookController],
  providers: [EasypaisaService],
  exports: [EasypaisaService],
})
export class PaymentsModule {}
