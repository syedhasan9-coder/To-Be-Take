import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiResponse,
  InventoryItemDto,
  InventoryLogItem,
  PaginatedResult,
} from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { InventoryQueryDto, UpdateStockDto } from '../dto/inventory.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminInventoryService } from '../services/admin-inventory.service';

@Controller('admin/inventory')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminInventoryController {
  constructor(private readonly inventoryService: AdminInventoryService) {}

  @Get()
  @RequirePermissions('INVENTORY_VIEW')
  async listInventory(
    @Query() query: InventoryQueryDto,
  ): Promise<ApiResponse<PaginatedResult<InventoryItemDto>>> {
    const data = await this.inventoryService.listInventory(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/stock')
  @RequirePermissions('INVENTORY_MANAGE')
  @AdminMutationThrottle()
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<InventoryItemDto>> {
    const data = await this.inventoryService.updateStock(id, dto, admin);
    return {
      success: true,
      message: 'Inventory stock level updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/logs')
  @RequirePermissions('INVENTORY_VIEW')
  async getInventoryLogs(
    @Param('id') id: string,
  ): Promise<ApiResponse<InventoryLogItem[]>> {
    const data = await this.inventoryService.getInventoryLogs(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
