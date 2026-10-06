import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, PaginatedResult, ProductReviewItem } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { ModerateReviewDto, ReviewQueryDto } from '../dto/review.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminReviewsService } from '../services/admin-reviews.service';

@Controller('admin/reviews')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminReviewsController {
  constructor(private readonly reviewsService: AdminReviewsService) {}

  @Get()
  @RequirePermissions('REVIEWS_VIEW')
  async listReviews(
    @Query() query: ReviewQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ProductReviewItem>>> {
    const data = await this.reviewsService.listReviews(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('REVIEWS_VIEW')
  async getReviewDetails(@Param('id') id: string): Promise<ApiResponse<ProductReviewItem>> {
    const data = await this.reviewsService.getReviewDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/moderate')
  @RequirePermissions('REVIEWS_MANAGE')
  @AdminMutationThrottle()
  async moderateReview(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ProductReviewItem>> {
    const data = await this.reviewsService.moderateReview(id, dto, admin);
    return {
      success: true,
      message: `Review status updated to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
