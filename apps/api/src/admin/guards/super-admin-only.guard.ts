import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';

@Injectable()
export class SuperAdminOnlyGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminOnlyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedAdminUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    if (user.roleCode !== 'SPADMIN') {
      this.logger.warn(
        `User '${user.username}' with role '${user.roleCode}' attempted to execute Super Admin only action`,
      );
      throw new ForbiddenException(
        'Super Admin privilege required: This platform action is restricted to Super Administrators.',
      );
    }

    return true;
  }
}
