export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  corsOrigins: string[];
  allowDevSuperAdminFallback: boolean;
}

export interface ThrottlerConfig {
  ttl: number; // in milliseconds
  limit: number;
  authTtl: number; // in milliseconds
  authLimit: number;
  adminTtl: number; // in milliseconds
  adminLimit: number;
}

const parseSecondsToMs = (val: string | undefined, defaultSeconds: number): number => {
  const parsed = parseInt(val || '', 10);
  return (isNaN(parsed) || parsed <= 0 ? defaultSeconds : parsed) * 1000;
};

const parseNumber = (val: string | undefined, defaultNum: number): number => {
  const parsed = parseInt(val || '', 10);
  return isNaN(parsed) || parsed <= 0 ? defaultNum : parsed;
};

export default (): { app: AppConfig; throttler: ThrottlerConfig } => {
  return {
    app: {
      port: parseInt(process.env.PORT || process.env.API_PORT || '4000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL || '',
      corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4000'],
      allowDevSuperAdminFallback: process.env.ALLOW_DEV_SUPERADMIN_FALLBACK === 'true',
    },
    throttler: {
      ttl: parseSecondsToMs(process.env.RATE_LIMIT_TTL, 60),
      limit: parseNumber(process.env.RATE_LIMIT_MAX, 120),
      authTtl: parseSecondsToMs(process.env.AUTH_RATE_LIMIT_TTL, 60),
      authLimit: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
      adminTtl: parseSecondsToMs(process.env.ADMIN_RATE_LIMIT_TTL, 60),
      adminLimit: parseNumber(process.env.ADMIN_RATE_LIMIT_MAX, 30),
    },
  };
};

