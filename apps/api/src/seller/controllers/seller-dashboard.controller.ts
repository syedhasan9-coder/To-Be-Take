import { Controller, Get, UseGuards } from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerDashboardService } from '../services/seller-dashboard.service';
import { ApiResponse, SellerDashboardData } from '@tobetake/shared-types';

@Controller('seller/dashboard')
@UseGuards(SellerAuthGuard)
export class SellerDashboardController {
  constructor(private readonly dashboardService: SellerDashboardService) {}

  @Get()
  async getDashboard(
    @CurrentSeller() seller: AuthenticatedSellerUser,
  ): Promise<ApiResponse<SellerDashboardData>> {
    const data = await this.dashboardService.getDashboardData(seller.id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
