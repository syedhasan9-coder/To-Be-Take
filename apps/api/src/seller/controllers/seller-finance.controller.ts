import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerFinanceService } from '../services/seller-finance.service';
import {
  ApiResponse,
  CommissionRecordItem,
  PaginatedResult,
  SellerEarningsSummary,
  SellerPayoutItem,
} from '@tobetake/shared-types';

@Controller('seller/finance')
@UseGuards(SellerAuthGuard)
export class SellerFinanceController {
  constructor(private readonly financeService: SellerFinanceService) {}

  @Get('earnings')
  async getEarnings(
    @CurrentSeller() seller: AuthenticatedSellerUser,
  ): Promise<ApiResponse<SellerEarningsSummary>> {
    const data = await this.financeService.getEarningsSummary(seller.id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('commissions')
  async getCommissions(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<CommissionRecordItem>>> {
    const data = await this.financeService.getCommissions(seller.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('payouts')
  async getPayouts(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<SellerPayoutItem>>> {
    const data = await this.financeService.getPayouts(seller.id, {
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
