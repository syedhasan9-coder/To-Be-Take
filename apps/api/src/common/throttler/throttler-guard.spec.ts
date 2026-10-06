import { Controller, Get, INestApplication, Post, UseGuards } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthThrottle, AdminMutationThrottle } from './throttler.decorators';

@Controller('test')
class TestApiController {
  @Get('default')
  getDefault() {
    return { ok: true, type: 'default' };
  }

  @Post('auth')
  @AuthThrottle()
  postAuth() {
    return { ok: true, type: 'auth' };
  }

  @Post('admin/mutate')
  @AdminMutationThrottle()
  postAdminMutate() {
    return { ok: true, type: 'admin' };
  }

  @Get('health')
  @SkipThrottle()
  getHealth() {
    return { ok: true, type: 'health' };
  }
}

describe('ThrottlerGuard Integration', () => {
  let app: INestApplication;
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      RATE_LIMIT_TTL: '60',
      RATE_LIMIT_MAX: '5',
      AUTH_RATE_LIMIT_TTL: '60',
      AUTH_RATE_LIMIT_MAX: '2',
      ADMIN_RATE_LIMIT_TTL: '60',
      ADMIN_RATE_LIMIT_MAX: '3',
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          errorMessage: 'Too many requests, please try again later.',
          throttlers: [
            {
              name: 'default',
              ttl: 60000,
              limit: 5,
            },
          ],
        }),
      ],
      controllers: [TestApiController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  it('should allow requests under the limit for default endpoints', async () => {
    for (let i = 0; i < 4; i++) {
      const res = await request(app.getHttpServer()).get('/test/default');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }
  });

  it('should enforce stricter limit on AuthThrottle endpoints (max 2)', async () => {
    // 1st request -> 201 Created
    const res1 = await request(app.getHttpServer()).post('/test/auth');
    expect(res1.status).toBe(201);

    // 2nd request -> 201 Created
    const res2 = await request(app.getHttpServer()).post('/test/auth');
    expect(res2.status).toBe(201);

    // 3rd request -> 429 Too Many Requests
    const res3 = await request(app.getHttpServer()).post('/test/auth');
    expect(res3.status).toBe(429);
    expect(res3.body.message).toContain('Too many requests');
  });

  it('should enforce AdminMutationThrottle limit (max 3)', async () => {
    // 1st request -> 201 Created
    const res1 = await request(app.getHttpServer()).post('/test/admin/mutate');
    expect(res1.status).toBe(201);

    // 2nd request -> 201 Created
    const res2 = await request(app.getHttpServer()).post('/test/admin/mutate');
    expect(res2.status).toBe(201);

    // 3rd request -> 201 Created
    const res3 = await request(app.getHttpServer()).post('/test/admin/mutate');
    expect(res3.status).toBe(201);

    // 4th request -> 429 Too Many Requests
    const res4 = await request(app.getHttpServer()).post('/test/admin/mutate');
    expect(res4.status).toBe(429);
    expect(res4.body.message).toContain('Too many requests');
  });

  it('should never throttle SkipThrottle endpoints even after many requests', async () => {
    for (let i = 0; i < 15; i++) {
      const res = await request(app.getHttpServer()).get('/test/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }
  });
});
