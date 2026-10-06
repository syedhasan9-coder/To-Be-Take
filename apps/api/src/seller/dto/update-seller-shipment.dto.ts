import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShippingStatus } from '@tobetake/database';

export class UpdateSellerShipmentDto {
  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsEnum(ShippingStatus)
  status?: ShippingStatus;

  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
