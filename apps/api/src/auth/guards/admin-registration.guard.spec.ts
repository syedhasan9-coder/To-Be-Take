import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminRegistrationGuard } from './admin-registration.guard';

describe('AdminRegistrationGuard', () => {
  let guard: AdminRegistrationGuard;
  let configService: ConfigService;

  const mockExecutionContext = (
    headers: Record<string, string> = {},
    ip: string = '127.0.0.1',
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          ip,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRegistrationGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'app.nodeEnv') return process.env.NODE_ENV || defaultValue;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminRegistrationGuard>(AdminRegistrationGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    delete process.env.ALLOW_PUBLIC_ADMIN_REGISTRATION;
    delete process.env.ADMIN_REGISTRATION_SECRET;
  });

  it('should allow registration in development mode without header', () => {
    (configService.get as jest.Mock).mockReturnValue('development');
    const context = mockExecutionContext();

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow registration in test mode without header', () => {
    (configService.get as jest.Mock).mockReturnValue('test');
    const context = mockExecutionContext();

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow registration in production if ALLOW_PUBLIC_ADMIN_REGISTRATION is true', () => {
    (configService.get as jest.Mock).mockReturnValue('production');
    process.env.ALLOW_PUBLIC_ADMIN_REGISTRATION = 'true';
    const context = mockExecutionContext();

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should reject registration in production when no secret/header is provided', () => {
    (configService.get as jest.Mock).mockReturnValue('production');
    process.env.ADMIN_REGISTRATION_SECRET = 'super-secret-key-123';
    const context = mockExecutionContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject registration in production when invalid key is provided in header', () => {
    (configService.get as jest.Mock).mockReturnValue('production');
    process.env.ADMIN_REGISTRATION_SECRET = 'super-secret-key-123';
    const context = mockExecutionContext({
      'x-admin-registration-key': 'wrong-key',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow registration in production when matching key is provided in header', () => {
    (configService.get as jest.Mock).mockReturnValue('production');
    process.env.ADMIN_REGISTRATION_SECRET = 'super-secret-key-123';
    const context = mockExecutionContext({
      'x-admin-registration-key': 'super-secret-key-123',
    });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
});
