import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckResponse } from '@tobetake/shared-types';
import { PrismaService } from '@tobetake/database';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async check(): Promise<HealthCheckResponse> {
    const isDbHealthy = await this.prismaService.isHealthy();
    const uptimeInSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const nodeEnv = this.configService.get<string>('app.nodeEnv', 'development');

    return {
      status: isDbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: uptimeInSeconds,
      environment: nodeEnv,
      version: '0.1.0',
      services: {
        database: isDbHealthy ? 'connected' : 'disconnected',
      },
    };
  }
}
