import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerReturnsService } from '../services/seller-returns.service';
import { ApiResponse, OrderReturnItem, PaginatedResult } from '@tobetake/shared-types';

@Controller('seller/returns')
@UseGuards(SellerAuthGuard)
export class SellerReturnsController {
  constructor(private readonly returnsService: SellerReturnsService) {}

  @Get()
  async getReturns(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<OrderReturnItem>>> {
    const data = await this.returnsService.getReturns(seller.id, {
      search,
      status,
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
