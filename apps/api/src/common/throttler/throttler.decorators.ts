import { ExecutionContext } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Decorator to apply stricter rate limiting to authentication and sensitive registration endpoints.
 * Configured dynamically via AUTH_RATE_LIMIT_MAX (default 10) and AUTH_RATE_LIMIT_TTL (default 60s).
 */
export const AuthThrottle = () =>
  Throttle({
    default: {
      limit: (_context: ExecutionContext) => {
        const val = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10);
        return isNaN(val) || val <= 0 ? 10 : val;
      },
      ttl: (_context: ExecutionContext) => {
        const val = parseInt(process.env.AUTH_RATE_LIMIT_TTL || '60', 10);
        return (isNaN(val) || val <= 0 ? 60 : val) * 1000;
      },
    },
  });

/**
 * Decorator to apply rate limiting to state-mutating administrative endpoints.
 * Configured dynamically via ADMIN_RATE_LIMIT_MAX (default 30) and ADMIN_RATE_LIMIT_TTL (default 60s).
 */
export const AdminMutationThrottle = () =>
  Throttle({
    default: {
      limit: (_context: ExecutionContext) => {
        const val = parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '30', 10);
        return isNaN(val) || val <= 0 ? 30 : val;
      },
      ttl: (_context: ExecutionContext) => {
        const val = parseInt(process.env.ADMIN_RATE_LIMIT_TTL || '60', 10);
        return (isNaN(val) || val <= 0 ? 60 : val) * 1000;
      },
    },
  });
