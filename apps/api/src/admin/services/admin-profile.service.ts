import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { AdminUserResponse } from '@tobetake/shared-types';
import { PasswordService } from '../../common/services/password.service';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminProfileService {
  private readonly logger = new Logger(AdminProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Retrieves profile details for the authenticated administrator.
   */
  async getProfile(userId: string): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('Administrator profile not found.');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleCode: user.role.code,
      departmentId: user.departmentId,
      department: user.department?.name ?? null,
      designation: user.designation,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Updates administrator personal details.
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('Administrator profile not found.');
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException(`Department with ID ${dto.departmentId} not found.`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        designation: dto.designation,
        departmentId: dto.departmentId,
      },
      include: {
        role: true,
        department: true,
      },
    });

    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'ADMIN_PROFILE_UPDATED',
      targetType: 'User',
      targetId: updated.id,
      status: 'SUCCESS',
      details: {
        updatedFields: dto,
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role.name,
      roleCode: updated.role.code,
      departmentId: updated.departmentId,
      department: updated.department?.name ?? null,
      designation: updated.designation,
      status: updated.status,
      isEmailVerified: updated.isEmailVerified,
      isMobileVerified: updated.isMobileVerified,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Changes administrator password securely with old password validation.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<{ success: boolean; message: string }> {
    if (dto.confirmPassword && dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('Administrator account not found.');
    }

    const isCurrentPasswordValid = await this.passwordService.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password provided is incorrect.');
    }

    const hashedNewPassword = await this.passwordService.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'ADMIN_PASSWORD_CHANGED',
      targetType: 'User',
      targetId: user.id,
      status: 'SUCCESS',
    });

    return { success: true, message: 'Password updated successfully.' };
  }
}
