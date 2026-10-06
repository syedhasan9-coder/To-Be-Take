import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustSellerInventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Stock quantity cannot be negative' })
  stockQuantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Low stock threshold cannot be negative' })
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  changeType?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
