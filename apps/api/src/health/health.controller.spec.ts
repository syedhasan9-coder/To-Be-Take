import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@tobetake/database';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const mockPrismaService = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(healthController).toBeDefined();
  });

  it('should return health status', async () => {
    const result = await healthController.getHealth();
    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
    expect(result).toHaveProperty('environment', 'test');
    expect(result.services.database).toEqual('connected');
  });
});
