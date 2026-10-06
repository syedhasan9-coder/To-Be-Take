import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedAdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  role: string;
  roleCode: string;
  departmentId?: number | null;
  department?: string | null;
  designation?: string | null;
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedAdminUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedAdminUser;

    return data && user ? user[data] : user;
  },
);
