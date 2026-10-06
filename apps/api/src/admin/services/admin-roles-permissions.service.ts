import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import {
  PermissionItem,
  RolePermissionsResponse,
  UpdateRolePermissionsInput,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminRolesPermissionsService {
  private readonly logger = new Logger(AdminRolesPermissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Retrieves all user roles in the platform.
   */
  async getRoles() {
    return this.prisma.userRole.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * Retrieves all permissions defined in the platform.
   */
  async getAllPermissions(): Promise<PermissionItem[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
    });

    return permissions.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      category: p.category,
    }));
  }

  /**
   * Retrieves permissions granted to a specific role along with full permissions directory.
   */
  async getRolePermissions(roleId: number): Promise<RolePermissionsResponse> {
    const role = await this.prisma.userRole.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} does not exist.`);
    }

    const allPermissions = await this.getAllPermissions();

    const grantedPermissions: PermissionItem[] =
      role.code === 'SPADMIN'
        ? allPermissions
        : role.rolePermissions.map((rp) => ({
            id: rp.permission.id,
            code: rp.permission.code,
            name: rp.permission.name,
            description: rp.permission.description,
            category: rp.permission.category,
          }));

    return {
      roleId: role.id,
      roleName: role.name,
      roleCode: role.code,
      permissions: grantedPermissions,
      allPermissions,
    };
  }

  /**
   * Updates permissions assigned to a role.
   * Backend protection: ONLY Super Admin can modify role permissions.
   */
  async updateRolePermissions(
    dto: UpdateRolePermissionsInput,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<RolePermissionsResponse> {
    if (currentAdmin.roleCode !== 'SPADMIN') {
      this.logger.warn(
        `Security: Admin '${currentAdmin.username}' attempted to modify role permissions`,
      );
      throw new ForbiddenException(
        'Super Admin privilege required: Only Super Administrators can configure role permissions.',
      );
    }

    const role = await this.prisma.userRole.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} does not exist.`);
    }

    // SPADMIN role must retain all permissions
    if (role.code === 'SPADMIN') {
      throw new BadRequestException('The Super Admin role cannot have its permissions revoked.');
    }

    // Remove old mappings and insert new
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: dto.roleId },
      });

      if (dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: dto.roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Record audit log
    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'ROLE_PERMISSIONS_UPDATED',
      targetType: 'Role',
      targetId: String(role.id),
      status: 'SUCCESS',
      details: {
        roleName: role.name,
        roleCode: role.code,
        assignedPermissionIds: dto.permissionIds,
      },
    });

    return this.getRolePermissions(dto.roleId);
  }
}
