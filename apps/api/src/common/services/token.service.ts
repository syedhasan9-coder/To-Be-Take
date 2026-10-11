import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  roleCode: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly secret: string;

  constructor(private readonly configService?: ConfigService) {
    this.secret =
      this.configService?.get<string>('JWT_SECRET')?.trim() ||
      process.env.JWT_SECRET?.trim() ||
      '';
  }

  /**
   * Resolves the cryptographic signing secret.
   * In production, strictly requires a non-default secret of at least 32 characters.
   */
  private getSigningSecret(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (
        !this.secret ||
        this.secret.length < 32 ||
        this.secret === 'tobetake_jwt_signing_secret_dev_key_2026_pk_auth' ||
        this.secret === 'change-me'
      ) {
        throw new Error(
          'Production Security Failure: A secure, high-entropy JWT_SECRET (minimum 32 characters) must be configured in environment variables. Predictable or missing fallback secrets are strictly forbidden.',
        );
      }
      return this.secret;
    }
    return this.secret || 'tobetake_jwt_signing_secret_dev_key_2026_pk_auth';
  }

  /**
   * Generates a cryptographically signed HMAC-SHA256 JWT bearer token with expiration.
   */
  generateToken(user: { id: string; username: string; email: string; roleCode: string }): string {
    const secret = this.getSigningSecret();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 60 * 60; // 7 days expiration

    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        username: user.username,
        email: user.email,
        roleCode: user.roleCode,
        iat: now,
        exp,
      }),
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Verifies HMAC-SHA256 signature and expiration of an incoming bearer token.
   * Returns decoded payload if genuine, or null if tampered, malformed, or expired.
   */
  verifyToken(token: string): TokenPayload | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let secret: string;
    try {
      secret = this.getSigningSecret();
    } catch (err: any) {
      this.logger.error(`Token verification rejected: ${err.message}`);
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      const expectedBuf = Buffer.from(expectedSignature);
      const providedBuf = Buffer.from(signatureB64);
      if (
        expectedBuf.length !== providedBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      ) as TokenPayload;

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired token
      }

      return payload;
    } catch {
      return null;
    }
  }
}
