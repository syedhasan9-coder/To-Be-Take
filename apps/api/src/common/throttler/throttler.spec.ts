import { ExecutionContext } from '@nestjs/common';
import { AuthThrottle, AdminMutationThrottle } from './throttler.decorators';
import configuration, { ThrottlerConfig } from '../../config/configuration';

describe('Throttler and Rate Limiting Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration Parsing', () => {
    it('should parse default rate limit settings when environment variables are unset', () => {
      delete process.env.RATE_LIMIT_TTL;
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.AUTH_RATE_LIMIT_TTL;
      delete process.env.AUTH_RATE_LIMIT_MAX;
      delete process.env.ADMIN_RATE_LIMIT_TTL;
      delete process.env.ADMIN_RATE_LIMIT_MAX;

      const config = configuration();
      expect(config.throttler).toEqual<ThrottlerConfig>({
        ttl: 60000,
        limit: 120,
        authTtl: 60000,
        authLimit: 10,
        adminTtl: 60000,
        adminLimit: 30,
      });
    });

    it('should parse custom rate limit settings from environment variables', () => {
      process.env.RATE_LIMIT_TTL = '120';
      process.env.RATE_LIMIT_MAX = '300';
      process.env.AUTH_RATE_LIMIT_TTL = '30';
      process.env.AUTH_RATE_LIMIT_MAX = '5';
      process.env.ADMIN_RATE_LIMIT_TTL = '45';
      process.env.ADMIN_RATE_LIMIT_MAX = '15';

      const config = configuration();
      expect(config.throttler).toEqual<ThrottlerConfig>({
        ttl: 120000,
        limit: 300,
        authTtl: 30000,
        authLimit: 5,
        adminTtl: 45000,
        adminLimit: 15,
      });
    });
  });

  describe('AuthThrottle Decorator Resolvers', () => {
    it('should dynamically read default values when env vars are unset', () => {
      delete process.env.AUTH_RATE_LIMIT_MAX;
      delete process.env.AUTH_RATE_LIMIT_TTL;

      // Create a dummy class to check decorator metadata
      class TestController {
        @AuthThrottle()
        testMethod() {}
      }

      const meta = Reflect.getMetadata('THROTTLER:LIMITdefault', TestController.prototype.testMethod);
      expect(meta).toBeDefined();
      if (typeof meta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(meta(mockContext)).toBe(10);
      }

      const ttlMeta = Reflect.getMetadata('THROTTLER:TTLdefault', TestController.prototype.testMethod);
      expect(ttlMeta).toBeDefined();
      if (typeof ttlMeta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(ttlMeta(mockContext)).toBe(60000);
      }
    });

    it('should dynamically read overridden env vars when configured', () => {
      process.env.AUTH_RATE_LIMIT_MAX = '3';
      process.env.AUTH_RATE_LIMIT_TTL = '15';

      class TestController {
        @AuthThrottle()
        testMethod() {}
      }

      const meta = Reflect.getMetadata('THROTTLER:LIMITdefault', TestController.prototype.testMethod);
      if (typeof meta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(meta(mockContext)).toBe(3);
      }

      const ttlMeta = Reflect.getMetadata('THROTTLER:TTLdefault', TestController.prototype.testMethod);
      if (typeof ttlMeta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(ttlMeta(mockContext)).toBe(15000);
      }
    });
  });

  describe('AdminMutationThrottle Decorator Resolvers', () => {
    it('should dynamically read default values when env vars are unset', () => {
      delete process.env.ADMIN_RATE_LIMIT_MAX;
      delete process.env.ADMIN_RATE_LIMIT_TTL;

      class TestController {
        @AdminMutationThrottle()
        testMethod() {}
      }

      const meta = Reflect.getMetadata('THROTTLER:LIMITdefault', TestController.prototype.testMethod);
      if (typeof meta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(meta(mockContext)).toBe(30);
      }

      const ttlMeta = Reflect.getMetadata('THROTTLER:TTLdefault', TestController.prototype.testMethod);
      if (typeof ttlMeta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(ttlMeta(mockContext)).toBe(60000);
      }
    });

    it('should dynamically read overridden env vars when configured', () => {
      process.env.ADMIN_RATE_LIMIT_MAX = '8';
      process.env.ADMIN_RATE_LIMIT_TTL = '20';

      class TestController {
        @AdminMutationThrottle()
        testMethod() {}
      }

      const meta = Reflect.getMetadata('THROTTLER:LIMITdefault', TestController.prototype.testMethod);
      if (typeof meta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(meta(mockContext)).toBe(8);
      }

      const ttlMeta = Reflect.getMetadata('THROTTLER:TTLdefault', TestController.prototype.testMethod);
      if (typeof ttlMeta === 'function') {
        const mockContext = {} as ExecutionContext;
        expect(ttlMeta(mockContext)).toBe(20000);
      }
    });
  });
});
