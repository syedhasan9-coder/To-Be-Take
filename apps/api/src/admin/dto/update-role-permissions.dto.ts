import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { UpdateRolePermissionsInput } from '@tobetake/shared-types';

export class UpdateRolePermissionsDto implements UpdateRolePermissionsInput {
  @IsNotEmpty({ message: 'Role ID is required' })
  @IsInt({ message: 'Role ID must be an integer' })
  roleId!: number;

  @IsArray({ message: 'Permission IDs must be an array' })
  @ArrayNotEmpty({ message: 'Permission IDs cannot be empty' })
  @IsInt({ each: true, message: 'Each permission ID must be an integer' })
  permissionIds!: number[];
}
