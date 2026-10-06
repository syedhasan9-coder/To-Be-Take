import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService, UserStatus } from '@tobetake/database';
import { AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Injectable()
export class OptionalCustomerAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    const customUserId = request.headers['x-user-id'];
    const customUserEmail = request.headers['x-user-email'];

    let resolvedIdentifier: string | null = null;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      resolvedIdentifier = authHeader.substring(7).trim();
    } else if (typeof customUserId === 'string' && customUserId.trim().length > 0) {
      resolvedIdentifier = customUserId.trim();
    } else if (typeof customUserEmail === 'string' && customUserEmail.trim().length > 0) {
      resolvedIdentifier = customUserEmail.trim();
    }

    if (!resolvedIdentifier) {
      request.user = null;
      return true;
    }

    try {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          resolvedIdentifier,
        );

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(isUUID ? [{ id: resolvedIdentifier }] : []),
            { email: resolvedIdentifier.toLowerCase() },
            { username: resolvedIdentifier },
          ],
          isDeleted: false,
          status: UserStatus.ACTIVE,
        },
        include: {
          role: true,
          addresses: {
            where: { isDefault: true },
            take: 1,
          },
        },
      });

      if (user) {
        const defaultAddress = user.addresses[0];
        const authUser: AuthenticatedCustomerUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
          role: user.role.name,
          roleCode: user.role.code,
          phone: defaultAddress?.phone ?? null,
        };
        request.user = authUser;
      } else {
        request.user = null;
      }
    } catch {
      request.user = null;
    }

    return true;
  }
}
