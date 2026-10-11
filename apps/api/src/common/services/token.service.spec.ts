import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test_jwt_secret_key_12345'),
    } as any;
    service = new TokenService(mockConfigService);
  });

  it('should generate a valid 3-part signed JWT token', () => {
    const token = service.generateToken({
      id: 'usr-1',
      username: 'aliraza',
      email: 'ali@example.com',
      roleCode: 'CUST',
    });

    expect(token).toBeDefined();
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  it('should verify genuine token and return decoded payload', () => {
    const token = service.generateToken({
      id: 'usr-1',
      username: 'aliraza',
      email: 'ali@example.com',
      roleCode: 'CUST',
    });

    const payload = service.verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('usr-1');
    expect(payload?.username).toBe('aliraza');
    expect(payload?.email).toBe('ali@example.com');
    expect(payload?.roleCode).toBe('CUST');
  });

  it('should reject a tampered token signature', () => {
    const token = service.generateToken({
      id: 'usr-1',
      username: 'aliraza',
      email: 'ali@example.com',
      roleCode: 'CUST',
    });

    const parts = token.split('.');
    // Tamper with payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin-id', roleCode: 'ADMIN' }),
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const result = service.verifyToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('should reject a token with incorrect signature', () => {
    const token = service.generateToken({
      id: 'usr-1',
      username: 'aliraza',
      email: 'ali@example.com',
      roleCode: 'CUST',
    });

    const parts = token.split('.');
    const forgedToken = `${parts[0]}.${parts[1]}.invalid_signature_hex`;

    const result = service.verifyToken(forgedToken);
    expect(result).toBeNull();
  });

  it('should reject an expired token', () => {
    // Generate token with negative expiration
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'usr-1',
        roleCode: 'CUST',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      }),
    ).toString('base64url');

    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', 'test_jwt_secret_key_12345')
      .update(`${header}.${payload}`)
      .digest('base64url');

    const expiredToken = `${header}.${payload}.${signature}`;
    const result = service.verifyToken(expiredToken);
    expect(result).toBeNull();
  });

  it('should return null for malformed or non-token strings', () => {
    expect(service.verifyToken('')).toBeNull();
    expect(service.verifyToken('usr-uuid-only')).toBeNull();
    expect(service.verifyToken('not.a.valid.jwt.four.dots')).toBeNull();
  });

  describe('Production secret validation', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should throw an error on token generation in production if secret is missing or weak (< 32 chars)', () => {
      process.env.NODE_ENV = 'production';
      const weakConfig = { get: jest.fn().mockReturnValue('short-weak-key') } as any;
      const prodService = new TokenService(weakConfig);

      expect(() => {
        prodService.generateToken({
          id: 'usr-1',
          username: 'admin',
          email: 'admin@tobetake.dev',
          roleCode: 'ADMIN',
        });
      }).toThrow('Production Security Failure');
    });

    it('should fail closed (return null) on token verification in production if secret is missing or weak', () => {
      process.env.NODE_ENV = 'production';
      const weakConfig = { get: jest.fn().mockReturnValue('') } as any;
      const prodService = new TokenService(weakConfig);

      const result = prodService.verifyToken('header.payload.signature');
      expect(result).toBeNull();
    });

    it('should throw an error in production if default dev secret is used', () => {
      process.env.NODE_ENV = 'production';
      const devKeyConfig = {
        get: jest.fn().mockReturnValue('tobetake_jwt_signing_secret_dev_key_2026_pk_auth'),
      } as any;
      const prodService = new TokenService(devKeyConfig);

      expect(() => {
        prodService.generateToken({
          id: 'usr-1',
          username: 'admin',
          email: 'admin@tobetake.dev',
          roleCode: 'ADMIN',
        });
      }).toThrow('Production Security Failure');
    });

    it('should generate and verify tokens in production when a secure key (>= 32 chars) is provided', () => {
      process.env.NODE_ENV = 'production';
      const secureConfig = {
        get: jest.fn().mockReturnValue('production_super_secure_key_that_is_at_least_32_characters_long!'),
      } as any;
      const prodService = new TokenService(secureConfig);

      const token = prodService.generateToken({
        id: 'usr-prod-1',
        username: 'prod_user',
        email: 'prod@tobetake.pk',
        roleCode: 'CUST',
      });

      expect(token).toBeDefined();
      const payload = prodService.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('usr-prod-1');
    });
  });
});
