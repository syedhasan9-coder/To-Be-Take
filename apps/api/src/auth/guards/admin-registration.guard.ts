import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * AdminRegistrationGuard
 *
 * Protects the Admin registration endpoint (`POST /api/auth/register/admin`) against
 * unauthorized public account creation.
 *
 * Security Policy:
 * 1. In `development` and `test` environments:
 *    - Open by default to facilitate local onboarding and automated testing.
 *    - Logs an advisory notice when invoked.
 * 2. In `production` environment:
 *    - Requires the server-side environment variable `ADMIN_REGISTRATION_SECRET` to be set.
 *    - Validates the incoming header `x-admin-registration-key` against `ADMIN_REGISTRATION_SECRET`.
 *    - Alternatively, if `ALLOW_PUBLIC_ADMIN_REGISTRATION === 'true'` is explicitly set, public creation is permitted.
 *    - If unauthorized, rejects with HTTP 403 Forbidden without leaking internal configuration.
 *
 * Architecture Note:
 * When full JWT/RBAC authentication is introduced in future tasks, this guard can be
 * transitioned to a SuperAdminAuthGuard with zero modification to core registration business logic.
 */
@Injectable()
export class AdminRegistrationGuard implements CanActivate {
  private readonly logger = new Logger(AdminRegistrationGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const nodeEnv =
      this.configService.get<string>('app.nodeEnv') || process.env.NODE_ENV || 'development';

    // In development and test environments, allow registration with advisory logging
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      this.logger.debug(`Admin registration accessed in ${nodeEnv} mode from IP: ${request.ip}`);
      return true;
    }

    // In production environments:
    const allowPublic = process.env.ALLOW_PUBLIC_ADMIN_REGISTRATION === 'true';
    if (allowPublic) {
      this.logger.warn(
        'Admin registration executed in production under ALLOW_PUBLIC_ADMIN_REGISTRATION flag',
      );
      return true;
    }

    const registrationSecret = process.env.ADMIN_REGISTRATION_SECRET;
    const providedKey = request.headers['x-admin-registration-key'];

    if (
      registrationSecret &&
      typeof providedKey === 'string' &&
      providedKey.length > 0 &&
      providedKey === registrationSecret
    ) {
      return true;
    }

    this.logger.warn(
      `Unauthorized Admin registration attempt in ${nodeEnv} environment from IP: ${request.ip}`,
    );
    throw new ForbiddenException(
      'Admin registration is restricted. A valid administrative authorization key is required.',
    );
  }
}
