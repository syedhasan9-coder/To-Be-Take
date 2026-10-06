import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '@tobetake/database';
import { UpdateUserStatusInput } from '@tobetake/shared-types';

export class UpdateUserStatusDto implements UpdateUserStatusInput {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(UserStatus, { message: 'Invalid user status' })
  status!: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
