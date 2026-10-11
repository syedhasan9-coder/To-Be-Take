import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiResponse, PaymentCallbackResult } from '@tobetake/shared-types';
import { EasypaisaService } from '../services/easypaisa.service';

@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly easypaisaService: EasypaisaService) {}

  @Post('easypaisa/callback')
  @HttpCode(HttpStatus.OK)
  async handleEasypaisaCallbackPost(
    @Body() body: Record<string, any>,
  ): Promise<ApiResponse<PaymentCallbackResult>> {
    const result = await this.easypaisaService.processCallback(body);
    return {
      success: result.success,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('easypaisa/callback')
  @HttpCode(HttpStatus.OK)
  async handleEasypaisaCallbackGet(
    @Query() query: Record<string, any>,
  ): Promise<ApiResponse<PaymentCallbackResult>> {
    const result = await this.easypaisaService.processCallback(query);
    return {
      success: result.success,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('easypaisa/ipn')
  @HttpCode(HttpStatus.OK)
  async handleEasypaisaIpn(
    @Body() body: Record<string, any>,
  ): Promise<ApiResponse<PaymentCallbackResult>> {
    const result = await this.easypaisaService.processCallback(body);
    return {
      success: result.success,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
