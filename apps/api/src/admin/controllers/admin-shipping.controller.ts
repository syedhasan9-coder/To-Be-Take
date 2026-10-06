import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, PaginatedResult, ShipmentListItem } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CreateShipmentDto, ShippingQueryDto, UpdateShipmentDto } from '../dto/shipping.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminShippingService } from '../services/admin-shipping.service';

@Controller('admin/shipping')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminShippingController {
  constructor(private readonly shippingService: AdminShippingService) {}

  @Get()
  @RequirePermissions('SHIPPING_VIEW')
  async listShipments(
    @Query() query: ShippingQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ShipmentListItem>>> {
    const data = await this.shippingService.listShipments(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @RequirePermissions('SHIPPING_MANAGE')
  @AdminMutationThrottle()
  @HttpCode(HttpStatus.CREATED)
  async createShipment(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ShipmentListItem>> {
    const data = await this.shippingService.createShipment(dto, admin);
    return {
      success: true,
      message: 'Shipment created and tracking registered',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @RequirePermissions('SHIPPING_MANAGE')
  @AdminMutationThrottle()
  async updateShipment(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ShipmentListItem>> {
    const data = await this.shippingService.updateShipment(id, dto, admin);
    return {
      success: true,
      message: 'Shipment tracking updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/tracking')
  @RequirePermissions('SHIPPING_MANAGE')
  @AdminMutationThrottle()
  async updateShipmentTracking(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ShipmentListItem>> {
    const data = await this.shippingService.updateShipment(id, dto, admin);
    return {
      success: true,
      message: 'Shipment tracking updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
