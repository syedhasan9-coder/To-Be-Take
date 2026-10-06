import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewSellerApprovalInput } from '@tobetake/shared-types';

export class ReviewSellerApprovalDto implements ReviewSellerApprovalInput {
  @IsNotEmpty({ message: 'Approval status is required' })
  @IsIn(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'], {
    message: 'Status must be APPROVED, REJECTED, SUSPENDED, or PENDING',
  })
  status!: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
