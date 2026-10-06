import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerInventoryService } from '../services/seller-inventory.service';
import { AdjustSellerInventoryDto } from '../dto/adjust-seller-inventory.dto';
import { ApiResponse, InventoryItemDto, PaginatedResult } from '@tobetake/shared-types';

@Controller('seller/inventory')
@UseGuards(SellerAuthGuard)
export class SellerInventoryController {
  constructor(private readonly inventoryService: SellerInventoryService) {}

  @Get()
  async getInventory(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('outOfStockOnly') outOfStockOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<InventoryItemDto>>> {
    const data = await this.inventoryService.getInventory(seller.id, {
      search,
      lowStockOnly: lowStockOnly === 'true',
      outOfStockOnly: outOfStockOnly === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':productId/stock')
  async adjustStock(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('productId') productId: string,
    @Body() dto: AdjustSellerInventoryDto,
  ): Promise<ApiResponse<InventoryItemDto>> {
    const data = await this.inventoryService.adjustStock(
      seller.id,
      productId,
      dto,
    );

    return {
      success: true,
      message: 'Stock adjusted successfully.',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
