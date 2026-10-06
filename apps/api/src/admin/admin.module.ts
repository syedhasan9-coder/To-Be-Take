import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { PasswordService } from '../common/services/password.service';

import { AdminAuthGuard } from './guards/admin-auth.guard';
import { SuperAdminOnlyGuard } from './guards/super-admin-only.guard';
import { PermissionsGuard } from './guards/permissions.guard';

import { AdminAuditService } from './services/admin-audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminSellerApprovalsService } from './services/admin-seller-approvals.service';
import { AdminRolesPermissionsService } from './services/admin-roles-permissions.service';
import { AdminSecurityService } from './services/admin-security.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminReportsService } from './services/admin-reports.service';
import { AdminProfileService } from './services/admin-profile.service';
// Commerce Services
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminCategoriesService } from './services/admin-categories.service';
import { AdminInventoryService } from './services/admin-inventory.service';
import { AdminPaymentsService } from './services/admin-payments.service';
import { AdminCommissionsService } from './services/admin-commissions.service';
import { AdminPayoutsService } from './services/admin-payouts.service';
import { AdminReturnsService } from './services/admin-returns.service';
import { AdminShippingService } from './services/admin-shipping.service';
import { AdminReviewsService } from './services/admin-reviews.service';
import { AdminNotificationsService } from './services/admin-notifications.service';
import { AdminSearchService } from './services/admin-search.service';

import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminSearchController } from './controllers/admin-search.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminSellerApprovalsController } from './controllers/admin-seller-approvals.controller';
import { AdminRolesPermissionsController } from './controllers/admin-roles-permissions.controller';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminSecurityController } from './controllers/admin-security.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminReportsController } from './controllers/admin-reports.controller';
import { AdminProfileController } from './controllers/admin-profile.controller';
// Commerce Controllers
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminInventoryController } from './controllers/admin-inventory.controller';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { AdminCommissionsController } from './controllers/admin-commissions.controller';
import { AdminPayoutsController } from './controllers/admin-payouts.controller';
import { AdminReturnsController } from './controllers/admin-returns.controller';
import { AdminShippingController } from './controllers/admin-shipping.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminNotificationsController } from './controllers/admin-notifications.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [
    AdminDashboardController,
    AdminSearchController,
    AdminUsersController,
    AdminSellerApprovalsController,
    AdminRolesPermissionsController,
    AdminAuditLogsController,
    AdminSecurityController,
    AdminSettingsController,
    AdminReportsController,
    AdminProfileController,
    // Commerce Controllers
    AdminOrdersController,
    AdminProductsController,
    AdminCategoriesController,
    AdminInventoryController,
    AdminPaymentsController,
    AdminCommissionsController,
    AdminPayoutsController,
    AdminReturnsController,
    AdminShippingController,
    AdminReviewsController,
    AdminNotificationsController,
  ],
  providers: [
    PasswordService,
    AdminAuditService,
    AdminDashboardService,
    AdminSearchService,
    AdminUsersService,
    AdminSellerApprovalsService,
    AdminRolesPermissionsService,
    AdminSecurityService,
    AdminSettingsService,
    AdminReportsService,
    AdminProfileService,
    // Commerce Services
    AdminOrdersService,
    AdminProductsService,
    AdminCategoriesService,
    AdminInventoryService,
    AdminPaymentsService,
    AdminCommissionsService,
    AdminPayoutsService,
    AdminReturnsService,
    AdminShippingService,
    AdminReviewsService,
    AdminNotificationsService,
    AdminAuthGuard,
    SuperAdminOnlyGuard,
    PermissionsGuard,
  ],
  exports: [
    AdminAuditService,
    AdminDashboardService,
    AdminSearchService,
    AdminUsersService,
    AdminSellerApprovalsService,
    AdminRolesPermissionsService,
    AdminSecurityService,
    AdminSettingsService,
    AdminReportsService,
    AdminProfileService,
    // Commerce Services
    AdminOrdersService,
    AdminProductsService,
    AdminCategoriesService,
    AdminInventoryService,
    AdminPaymentsService,
    AdminCommissionsService,
    AdminPayoutsService,
    AdminReturnsService,
    AdminShippingService,
    AdminReviewsService,
    AdminNotificationsService,
  ],
})
export class AdminModule {}
