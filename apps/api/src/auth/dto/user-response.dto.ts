import { AuthUserResponse } from '@tobetake/shared-types';

export class UserResponseDto implements AuthUserResponse {
  id!: string;
  username!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: string;
  roleCode!: string;
  departmentId?: number | null;
  department?: string | null;
  designation?: string | null;
  storeName?: string | null;
  businessCategory?: string | null;
  status!: string;
  isEmailVerified!: boolean;
  isMobileVerified!: boolean;
  token?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
