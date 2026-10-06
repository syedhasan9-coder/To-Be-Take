import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { SellerUserResponse } from '@tobetake/shared-types';
import { UpdateSellerProfileDto } from '../dto/update-seller-profile.dto';

@Injectable()
export class SellerProfileService {
  private readonly logger = new Logger(SellerProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(sellerId: string): Promise<SellerUserResponse & { approvalStatus?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: sellerId, isDeleted: false },
      include: {
        role: true,
        sellerApprovals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Seller profile not found.');
    }

    const latestApproval = user.sellerApprovals[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleCode: user.role.code,
      storeName: user.storeName,
      businessCategory: user.businessCategory,
      status: user.status,
      approvalStatus: latestApproval?.status ?? 'APPROVED',
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    sellerId: string,
    dto: UpdateSellerProfileDto,
  ): Promise<SellerUserResponse & { approvalStatus?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: sellerId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('Seller profile not found.');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.storeName !== undefined) updateData.storeName = dto.storeName;
    if (dto.businessCategory !== undefined)
      updateData.businessCategory = dto.businessCategory;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;

    await this.prisma.user.update({
      where: { id: sellerId },
      data: updateData,
    });

    return this.getProfile(sellerId);
  }
}
