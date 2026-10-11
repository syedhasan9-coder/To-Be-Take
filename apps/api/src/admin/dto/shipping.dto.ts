import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingStatus } from '@tobetake/database';

export class ShippingQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ShippingStatus)
  status?: ShippingStatus;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export class CreateShipmentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  carrier!: string;

  @IsString()
  trackingNumber!: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @IsString()
  destinationCity?: string;

  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pieces?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingCharges?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsString()
  estimatedDelivery?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordCodSettlementDto {
  @IsString()
  remittanceReference!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountReceived!: number;

  @IsOptional()
  @IsString()
  settlementDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShipmentDto {
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
  @IsString()
  estimatedDelivery?: string;

  @IsOptional()
  @IsString()
  shippedDate?: string;

  @IsOptional()
  @IsString()
  deliveredDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
