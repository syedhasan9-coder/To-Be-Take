import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService, UserStatus } from '@tobetake/database';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);

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

    // 2. In unauthenticated requests, enforce strict 401 Unauthorized
    // The optional development fallback is STRICTLY disabled by default and can ONLY be enabled
    // in local development if ALLOW_DEV_SUPERADMIN_FALLBACK=true is explicitly set.
    if (!resolvedIdentifier) {
      const isExplicitDevFallbackAllowed =
        process.env.NODE_ENV === 'development' &&
        process.env.ALLOW_DEV_SUPERADMIN_FALLBACK === 'true';

      if (isExplicitDevFallbackAllowed) {
        this.logger.warn(
          '⚠️ [SECURITY WARNING] Dev fallback active: Authenticating as Super Admin without credentials.',
        );

        // Find default Super Admin in database strictly for opt-in local development
        const defaultAdmin = await this.prisma.user.findFirst({
          where: {
            role: { code: 'SPADMIN' },
            isDeleted: false,
            status: UserStatus.ACTIVE,
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            department: true,
          },
        });

        if (defaultAdmin) {
          const authUser: AuthenticatedAdminUser = {
            id: defaultAdmin.id,
            username: defaultAdmin.username,
            email: defaultAdmin.email,
            firstName: defaultAdmin.firstName,
            lastName: defaultAdmin.lastName,
            roleId: defaultAdmin.roleId,
            role: defaultAdmin.role.name,
            roleCode: defaultAdmin.role.code,
            departmentId: defaultAdmin.departmentId,
            department: defaultAdmin.department?.name ?? null,
            designation: defaultAdmin.designation,
            permissions: ['*'],
          };

          request.user = authUser;
          return true;
        }
      }

      throw new UnauthorizedException(
        'Authentication required. Missing authorization credentials.',
      );
    }

    // 2. Lookup user from database
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
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        department: true,
      },
    });

    if (!user) {
      this.logger.warn(`Authentication failed: User '${resolvedIdentifier}' not found`);
      throw new UnauthorizedException('Invalid or expired authentication credentials.');
    }

    // 3. Validate user status and lock
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked due to security policy.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        `Account access denied. Current account status is ${user.status}.`,
      );
    }

    // 4. Validate Admin or Super Admin role
    if (user.role.code !== 'SPADMIN' && user.role.code !== 'ADMIN') {
      this.logger.warn(`Non-admin user '${user.username}' attempted to access admin resource`);
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }

    // 5. Build permissions list (SPADMIN has universal '*' permission)
    const permissions: string[] =
      user.role.code === 'SPADMIN'
        ? ['*']
        : user.role.rolePermissions.map((rp) => rp.permission.code);

    const authUser: AuthenticatedAdminUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role.name,
      roleCode: user.role.code,
      departmentId: user.departmentId,
      department: user.department?.name ?? null,
      designation: user.designation,
      permissions,
    };

    request.user = authUser;
    return true;
  }
}
