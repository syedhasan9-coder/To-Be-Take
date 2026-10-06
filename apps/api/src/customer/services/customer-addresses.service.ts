import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { CustomerAddressItem, CreateAddressInput, UpdateAddressInput } from '@tobetake/shared-types';

@Injectable()
export class CustomerAddressesService {
  private readonly logger = new Logger(CustomerAddressesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAddresses(userId: string): Promise<CustomerAddressItem[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((a) => ({
      id: a.id,
      label: a.label,
      recipientName: a.recipientName,
      phone: a.phone,
      streetAddress: a.streetAddress,
      area: a.area ?? undefined,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  async createAddress(userId: string, input: CreateAddressInput): Promise<CustomerAddressItem> {
    if (input.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      const count = await this.prisma.userAddress.count({ where: { userId } });
      if (count === 0) {
        input.isDefault = true;
      }
    }

    const created = await this.prisma.userAddress.create({
      data: {
        userId,
        label: input.label || 'Home',
        recipientName: input.recipientName,
        phone: input.phone,
        streetAddress: input.streetAddress,
        area: input.area,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode || '54000',
        country: input.country || 'Pakistan',
        isDefault: input.isDefault ?? false,
      },
    });

    return {
      id: created.id,
      label: created.label,
      recipientName: created.recipientName,
      phone: created.phone,
      streetAddress: created.streetAddress,
      area: created.area ?? undefined,
      city: created.city,
      province: created.province,
      postalCode: created.postalCode,
      country: created.country,
      isDefault: created.isDefault,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateAddress(userId: string, id: string, input: UpdateAddressInput): Promise<CustomerAddressItem> {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found.');
    }

    if (input.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.userAddress.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.recipientName !== undefined ? { recipientName: input.recipientName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.streetAddress !== undefined ? { streetAddress: input.streetAddress } : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.province !== undefined ? { province: input.province } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      },
    });

    return {
      id: updated.id,
      label: updated.label,
      recipientName: updated.recipientName,
      phone: updated.phone,
      streetAddress: updated.streetAddress,
      area: updated.area ?? undefined,
      city: updated.city,
      province: updated.province,
      postalCode: updated.postalCode,
      country: updated.country,
      isDefault: updated.isDefault,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async setDefaultAddress(userId: string, id: string): Promise<CustomerAddressItem> {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found.');
    }

    await this.prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const updated = await this.prisma.userAddress.update({
      where: { id },
      data: { isDefault: true },
    });

    return {
      id: updated.id,
      label: updated.label,
      recipientName: updated.recipientName,
      phone: updated.phone,
      streetAddress: updated.streetAddress,
      area: updated.area ?? undefined,
      city: updated.city,
      province: updated.province,
      postalCode: updated.postalCode,
      country: updated.country,
      isDefault: updated.isDefault,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteAddress(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found.');
    }

    await this.prisma.userAddress.delete({ where: { id } });
    return { success: true };
  }
}
