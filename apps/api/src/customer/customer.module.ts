import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PasswordService } from '../common/services/password.service';

// Guards
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { OptionalCustomerAuthGuard } from './guards/optional-customer-auth.guard';

// Controllers
import { CustomerStorefrontController } from './controllers/customer-storefront.controller';
import { CustomerCategoriesController } from './controllers/customer-categories.controller';
import { CustomerProductsController } from './controllers/customer-products.controller';
import { CustomerCartController } from './controllers/customer-cart.controller';
import { CustomerWishlistController } from './controllers/customer-wishlist.controller';
import { CustomerAddressesController } from './controllers/customer-addresses.controller';
import { CustomerCheckoutController } from './controllers/customer-checkout.controller';
import { CustomerOrdersController } from './controllers/customer-orders.controller';
import { CustomerReviewsController } from './controllers/customer-reviews.controller';
import { CustomerNotificationsController } from './controllers/customer-notifications.controller';
import { CustomerProfileController } from './controllers/customer-profile.controller';

// Services
import { CustomerStorefrontService } from './services/customer-storefront.service';
import { CustomerProductsService } from './services/customer-products.service';
import { CustomerCartService } from './services/customer-cart.service';
import { CustomerWishlistService } from './services/customer-wishlist.service';
import { CustomerAddressesService } from './services/customer-addresses.service';
import { CustomerCheckoutService } from './services/customer-checkout.service';
import { CustomerOrdersService } from './services/customer-orders.service';
import { CustomerReviewsService } from './services/customer-reviews.service';
import { CustomerNotificationsService } from './services/customer-notifications.service';
import { CustomerProfileService } from './services/customer-profile.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    CustomerStorefrontController,
    CustomerCategoriesController,
    CustomerProductsController,
    CustomerCartController,
    CustomerWishlistController,
    CustomerAddressesController,
    CustomerCheckoutController,
    CustomerOrdersController,
    CustomerReviewsController,
    CustomerNotificationsController,
    CustomerProfileController,
  ],
  providers: [
    PasswordService,
    CustomerAuthGuard,
    OptionalCustomerAuthGuard,
    CustomerStorefrontService,
    CustomerProductsService,
    CustomerCartService,
    CustomerWishlistService,
    CustomerAddressesService,
    CustomerCheckoutService,
    CustomerOrdersService,
    CustomerReviewsService,
    CustomerNotificationsService,
    CustomerProfileService,
  ],
  exports: [
    CustomerAuthGuard,
    OptionalCustomerAuthGuard,
    CustomerStorefrontService,
    CustomerProductsService,
    CustomerCartService,
    CustomerWishlistService,
    CustomerAddressesService,
    CustomerCheckoutService,
    CustomerOrdersService,
    CustomerReviewsService,
    CustomerNotificationsService,
    CustomerProfileService,
  ],
})
export class CustomerModule {}
