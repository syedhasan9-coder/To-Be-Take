import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import {
  PlatformSettingItem,
  PlatformSettingsGrouped,
  UpdatePlatformSettingsInput,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Retrieves all platform settings categorized logically.
   */
  async getSettingsGrouped(): Promise<PlatformSettingsGrouped> {
    const allSettings = await this.prisma.platformSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const formatSetting = (s: (typeof allSettings)[0]): PlatformSettingItem => ({
      id: s.id,
      key: s.key,
      value: s.value,
      description: s.description,
      category: s.category as PlatformSettingItem['category'],
      isPublic: s.isPublic,
      updatedBy: s.updatedBy,
      updatedAt: s.updatedAt,
    });

    const grouped: PlatformSettingsGrouped = {
      general: allSettings.filter((s) => s.category === 'GENERAL').map(formatSetting),
      registration: allSettings.filter((s) => s.category === 'REGISTRATION').map(formatSetting),
      maintenance: allSettings.filter((s) => s.category === 'MAINTENANCE').map(formatSetting),
      security: allSettings.filter((s) => s.category === 'SECURITY').map(formatSetting),
      notifications: allSettings.filter((s) => s.category === 'NOTIFICATIONS').map(formatSetting),
    };

    return grouped;
  }

  /**
   * Updates multiple platform settings and logs audit changes.
   */
  async updateSettings(
    dto: UpdatePlatformSettingsInput,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<PlatformSettingsGrouped> {
    // Only Super Admin or Admins with SETTINGS_MANAGE permission
    if (
      currentAdmin.roleCode !== 'SPADMIN' &&
      !currentAdmin.permissions.includes('SETTINGS_MANAGE')
    ) {
      throw new ForbiddenException('You do not have permission to modify platform settings.');
    }

    const updatedKeys: string[] = [];

    for (const setting of dto.settings) {
      await this.prisma.platformSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          updatedBy: currentAdmin.id,
        },
        create: {
          key: setting.key,
          value: setting.value,
          category: 'GENERAL',
          isPublic: false,
          updatedBy: currentAdmin.id,
        },
      });
      updatedKeys.push(setting.key);
    }

    // Record audit log
    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'PLATFORM_SETTINGS_UPDATED',
      targetType: 'PlatformSetting',
      targetId: null,
      status: 'SUCCESS',
      details: {
        updatedSettings: dto.settings,
      },
    });

    return this.getSettingsGrouped();
  }

  /**
   * Public settings for application client bootstrapping (e.g. registration toggles).
   */
  async getPublicSettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.platformSetting.findMany({
      where: { isPublic: true },
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return result;
  }
}
