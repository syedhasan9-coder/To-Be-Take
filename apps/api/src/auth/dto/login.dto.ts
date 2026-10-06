import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { LoginInput } from '@tobetake/shared-types';

export class LoginDto implements LoginInput {
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  username?: string;

  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsString({ message: 'Username or email must be a string' })
  @MaxLength(255, { message: 'Username or email cannot exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  usernameOrEmail?: string;

  @IsOptional()
  @IsString({ message: 'Identifier must be a string' })
  @MaxLength(255, { message: 'Identifier cannot exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  identifier?: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Portal must be a string' })
  @MaxLength(50, { message: 'Portal cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  portal?: string;

  @IsOptional()
  @IsString({ message: 'Required role must be a string' })
  @MaxLength(50, { message: 'Required role cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  requiredRole?: string;
}
