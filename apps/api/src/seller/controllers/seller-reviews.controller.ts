import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerReviewsService } from '../services/seller-reviews.service';
import { ApiResponse, PaginatedResult, ProductReviewItem } from '@tobetake/shared-types';

@Controller('seller/reviews')
@UseGuards(SellerAuthGuard)
export class SellerReviewsController {
  constructor(private readonly reviewsService: SellerReviewsService) {}

  @Get()
  async getReviews(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('productId') productId?: string,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<ProductReviewItem>>> {
    const data = await this.reviewsService.getReviews(seller.id, {
      productId,
      rating: rating ? Number(rating) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
