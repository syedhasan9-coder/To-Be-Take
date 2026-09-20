import { DepartmentItem } from '@tobetake/shared-types';

export class DepartmentResponseDto implements DepartmentItem {
  id!: number;
  name!: string;
  code!: string;
  description!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<DepartmentResponseDto>) {
    Object.assign(this, partial);
  }
}
