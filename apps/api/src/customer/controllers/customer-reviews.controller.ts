import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CustomerReviewItem, SubmitReviewInput } from '@tobetake/shared-types';
import { CustomerReviewsService } from '../services/customer-reviews.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/reviews')
@UseGuards(CustomerAuthGuard)
export class CustomerReviewsController {
  constructor(private readonly reviewsService: CustomerReviewsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getReviews(@CurrentCustomer() user: AuthenticatedCustomerUser): Promise<ApiResponse<CustomerReviewItem[]>> {
    const data = await this.reviewsService.getCustomerReviews(user.id);
    return {
      success: true,
      message: 'Customer reviews retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitReview(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input: SubmitReviewInput,
  ): Promise<ApiResponse<CustomerReviewItem>> {
    const data = await this.reviewsService.submitReview(user.id, input);
    return {
      success: true,
      message: 'Review submitted successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
