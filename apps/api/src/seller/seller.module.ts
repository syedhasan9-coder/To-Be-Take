import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SellerAuthGuard } from './guards/seller-auth.guard';
import { SellerDashboardController } from './controllers/seller-dashboard.controller';
import { SellerDashboardService } from './services/seller-dashboard.service';
import { SellerProductsController } from './controllers/seller-products.controller';
import { SellerProductsService } from './services/seller-products.service';
import { SellerInventoryController } from './controllers/seller-inventory.controller';
import { SellerInventoryService } from './services/seller-inventory.service';
import { SellerOrdersController } from './controllers/seller-orders.controller';
import { SellerOrdersService } from './services/seller-orders.service';
import { SellerShippingController } from './controllers/seller-shipping.controller';
import { SellerShippingService } from './services/seller-shipping.service';
import { SellerFinanceController } from './controllers/seller-finance.controller';
import { SellerFinanceService } from './services/seller-finance.service';
import { SellerReturnsController } from './controllers/seller-returns.controller';
import { SellerReturnsService } from './services/seller-returns.service';
import { SellerReviewsController } from './controllers/seller-reviews.controller';
import { SellerReviewsService } from './services/seller-reviews.service';
import { SellerProfileController } from './controllers/seller-profile.controller';
import { SellerProfileService } from './services/seller-profile.service';
import { SellerNotificationsController } from './controllers/seller-notifications.controller';
import { SellerNotificationsService } from './services/seller-notifications.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    SellerDashboardController,
    SellerProductsController,
    SellerInventoryController,
    SellerOrdersController,
    SellerShippingController,
    SellerFinanceController,
    SellerReturnsController,
    SellerReviewsController,
    SellerProfileController,
    SellerNotificationsController,
  ],
  providers: [
    SellerAuthGuard,
    SellerDashboardService,
    SellerProductsService,
    SellerInventoryService,
    SellerOrdersService,
    SellerShippingService,
    SellerFinanceService,
    SellerReturnsService,
    SellerReviewsService,
    SellerProfileService,
    SellerNotificationsService,
  ],
  exports: [
    SellerAuthGuard,
    SellerDashboardService,
    SellerProductsService,
    SellerInventoryService,
    SellerOrdersService,
    SellerShippingService,
    SellerFinanceService,
    SellerReturnsService,
    SellerReviewsService,
    SellerProfileService,
    SellerNotificationsService,
  ],
})
export class SellerModule {}
