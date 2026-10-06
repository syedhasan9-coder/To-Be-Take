import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedSellerUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  role: string;
  roleCode: string;
  storeName: string | null;
  businessCategory: string | null;
}

export const CurrentSeller = createParamDecorator(
  (data: keyof AuthenticatedSellerUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedSellerUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
