import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@tobetake/database';

export class UpdateSellerOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
