import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService, UserStatus } from '@tobetake/database';
import { AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  private readonly logger = new Logger(CustomerAuthGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extract identifier/token from headers
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
      throw new UnauthorizedException(
        'Authentication required. Please log in to your customer account.',
      );
    }

    // 2. Lookup customer in database
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
      },
      include: {
        role: true,
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      this.logger.warn(`Customer authentication failed: User '${resolvedIdentifier}' not found`);
      throw new UnauthorizedException('Invalid or expired authentication credentials.');
    }

    // 3. Validate user status and lockout
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked due to security policy.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        `Account access denied. Current account status is ${user.status}.`,
      );
    }

    // 4. Populate request.user with customer details
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
    return true;
  }
}
