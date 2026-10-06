import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserStatus } from '@tobetake/database';
import { UpdateAdminInput } from '@tobetake/shared-types';

export class UpdateAdminUserDto implements UpdateAdminInput {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsOptional()
  @IsInt({ message: 'Department ID must be an integer' })
  departmentId?: number;

  @IsOptional()
  @IsString({ message: 'Designation must be a string' })
  @MaxLength(100, { message: 'Designation cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  designation?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Invalid status' })
  status?: UserStatus;
}
