import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerShippingService } from '../services/seller-shipping.service';
import { UpdateSellerShipmentDto } from '../dto/update-seller-shipment.dto';
import { ApiResponse, PaginatedResult, ShipmentListItem } from '@tobetake/shared-types';

@Controller('seller/shipping')
@UseGuards(SellerAuthGuard)
export class SellerShippingController {
  constructor(private readonly shippingService: SellerShippingService) {}

  @Get()
  async getShipments(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<ShipmentListItem>>> {
    const data = await this.shippingService.getShipments(seller.id, {
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

  @Post()
  async createShipment(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Body()
    body: {
      orderId: string;
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
      estimatedDelivery?: string;
      notes?: string;
    },
  ): Promise<ApiResponse<ShipmentListItem>> {
    const data = await this.shippingService.createShipment(seller.id, body);
    return {
      success: true,
      message: 'Shipment created successfully.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  async updateShipment(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
    @Body() dto: UpdateSellerShipmentDto,
  ): Promise<ApiResponse<ShipmentListItem>> {
    const data = await this.shippingService.updateShipment(seller.id, id, dto);
    return {
      success: true,
      message: 'Shipment updated successfully.',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
