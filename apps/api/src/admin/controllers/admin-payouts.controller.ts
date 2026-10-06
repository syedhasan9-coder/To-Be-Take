import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, PaginatedResult, SellerPayoutItem } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CreatePayoutDto, PayoutQueryDto, ProcessPayoutDto } from '../dto/payout.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminPayoutsService } from '../services/admin-payouts.service';

@Controller('admin/payouts')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminPayoutsController {
  constructor(private readonly payoutsService: AdminPayoutsService) {}

  @Get()
  @RequirePermissions('PAYOUTS_VIEW')
  async listPayouts(
    @Query() query: PayoutQueryDto,
  ): Promise<ApiResponse<PaginatedResult<SellerPayoutItem>>> {
    const data = await this.payoutsService.listPayouts(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @RequirePermissions('PAYOUTS_MANAGE')
  @AdminMutationThrottle()
  @HttpCode(HttpStatus.CREATED)
  async createPayout(
    @Body() dto: CreatePayoutDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<SellerPayoutItem>> {
    const data = await this.payoutsService.createPayout(dto, admin);
    return {
      success: true,
      message: 'Seller payout request generated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/process')
  @RequirePermissions('PAYOUTS_MANAGE')
  @AdminMutationThrottle()
  async processPayout(
    @Param('id') id: string,
    @Body() dto: ProcessPayoutDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<SellerPayoutItem>> {
    const data = await this.payoutsService.processPayout(id, dto, admin);
    return {
      success: true,
      message: `Payout status updated to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
