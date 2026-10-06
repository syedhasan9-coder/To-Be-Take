import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuperAdminOnlyGuard } from './super-admin-only.guard';

describe('SuperAdminOnlyGuard', () => {
  let guard: SuperAdminOnlyGuard;

  beforeEach(() => {
    guard = new SuperAdminOnlyGuard();
  });

  const createMockContext = (user?: { roleCode: string; username: string }) => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access for SPADMIN role', () => {
    const context = createMockContext({ roleCode: 'SPADMIN', username: 'superadmin' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject standard ADMIN role with 403 Forbidden', () => {
    const context = createMockContext({ roleCode: 'ADMIN', username: 'admin_user' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject unauthenticated request with 403 Forbidden', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
