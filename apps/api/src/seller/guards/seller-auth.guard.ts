import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService, UserStatus } from '@tobetake/database';
import { AuthenticatedSellerUser } from '../decorators/current-seller.decorator';

@Injectable()
export class SellerAuthGuard implements CanActivate {
  private readonly logger = new Logger(SellerAuthGuard.name);

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
        'Authentication required. Missing seller credentials.',
      );
    }

    // 2. Lookup seller in database
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
      },
    });

    if (!user) {
      this.logger.warn(`Seller authentication failed: User '${resolvedIdentifier}' not found`);
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

    // 4. Validate Seller / Vendor role
    if (user.role.code !== 'VENDOR') {
      this.logger.warn(
        `Non-seller user '${user.username}' (role: '${user.role.code}') attempted to access seller resource`,
      );
      throw new ForbiddenException('Access denied. Seller / Vendor privileges required.');
    }

    // 5. Populate request.user with authenticated seller context
    const authUser: AuthenticatedSellerUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role.name,
      roleCode: user.role.code,
      storeName: user.storeName,
      businessCategory: user.businessCategory,
    };

    request.user = authUser;
    return true;
  }
}
