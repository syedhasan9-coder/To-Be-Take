import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedCustomerUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number | string;
  role: string;
  roleCode: string;
  phone?: string | null;
}

export const CurrentCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedCustomerUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const OptionalCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedCustomerUser | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
