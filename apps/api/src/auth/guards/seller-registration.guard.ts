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
 * SellerRegistrationGuard
 *
 * Protects the Seller registration endpoint (`POST /api/auth/register/seller`) against
 * unauthorized account creation in restricted environments.
 *
 * Security Policy:
 * 1. In `development` and `test` environments:
 *    - Open by default to facilitate local onboarding, developer testing, and automated test suites.
 *    - Logs an advisory debug notice when invoked.
 * 2. In `production` environment:
 *    - Validates the incoming header `x-seller-registration-key` against `SELLER_REGISTRATION_SECRET`.
 *    - Alternatively, if `ALLOW_PUBLIC_SELLER_REGISTRATION === 'true'` is explicitly configured, public registration is permitted.
 *    - If unauthorized, rejects with HTTP 403 Forbidden without leaking internal configuration details.
 */
@Injectable()
export class SellerRegistrationGuard implements CanActivate {
  private readonly logger = new Logger(SellerRegistrationGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const nodeEnv =
      this.configService.get<string>('app.nodeEnv') || process.env.NODE_ENV || 'development';

    // In development and test environments, allow registration with advisory logging
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      this.logger.debug(`Seller registration accessed in ${nodeEnv} mode from IP: ${request.ip}`);
      return true;
    }

    // In production environments:
    const allowPublic = process.env.ALLOW_PUBLIC_SELLER_REGISTRATION === 'true';
    if (allowPublic) {
      this.logger.warn(
        'Seller registration executed in production under ALLOW_PUBLIC_SELLER_REGISTRATION flag',
      );
      return true;
    }

    const registrationSecret = process.env.SELLER_REGISTRATION_SECRET;
    const providedKey = request.headers['x-seller-registration-key'];

    if (
      registrationSecret &&
      typeof providedKey === 'string' &&
      providedKey.length > 0 &&
      providedKey === registrationSecret
    ) {
      return true;
    }

    this.logger.warn(
      `Unauthorized Seller registration attempt in ${nodeEnv} environment from IP: ${request.ip}`,
    );
    throw new ForbiddenException(
      'Seller registration is restricted. A valid seller authorization key is required.',
    );
  }
}
