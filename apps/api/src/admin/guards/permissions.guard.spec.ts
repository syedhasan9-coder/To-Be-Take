import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user?: { roleCode: string; permissions: string[] }) => {
    const request = { user };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no permissions required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ roleCode: 'ADMIN', permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SPADMIN unconditionally', () => {
    reflector.getAllAndOverride.mockReturnValue(['SETTINGS_MANAGE']);
    const context = createMockContext({ roleCode: 'SPADMIN', permissions: ['*'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN if permission is present', () => {
    reflector.getAllAndOverride.mockReturnValue(['USERS_VIEW']);
    const context = createMockContext({ roleCode: 'ADMIN', permissions: ['USERS_VIEW'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject ADMIN if required permission is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['SETTINGS_MANAGE']);
    const context = createMockContext({ roleCode: 'ADMIN', permissions: ['USERS_VIEW'] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
