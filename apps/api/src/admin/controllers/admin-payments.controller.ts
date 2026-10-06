import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, PaginatedResult, PaymentListItem } from '@tobetake/shared-types';
import { CurrentUser, AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PaymentQueryDto, RefundPaymentDto } from '../dto/payment.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminPaymentsService } from '../services/admin-payments.service';

@Controller('admin/payments')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: AdminPaymentsService) {}

  @Get()
  @RequirePermissions('PAYMENTS_VIEW')
  async listPayments(
    @Query() query: PaymentQueryDto,
  ): Promise<ApiResponse<PaginatedResult<PaymentListItem>>> {
    const data = await this.paymentsService.listPayments(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('PAYMENTS_VIEW')
  async getPaymentDetails(@Param('id') id: string): Promise<ApiResponse<PaymentListItem>> {
    const data = await this.paymentsService.getPaymentDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/refund')
  @RequirePermissions('PAYMENTS_MANAGE')
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<PaymentListItem>> {
    const data = await this.paymentsService.refundPayment(id, admin, dto?.reason);
    return {
      success: true,
      message: 'Payment refund processed successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

