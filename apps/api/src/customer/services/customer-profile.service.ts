import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { PasswordService } from '../../common/services/password.service';
import { CustomerProfileSummary, UpdateCustomerProfileInput } from '@tobetake/shared-types';

@Injectable()
export class CustomerProfileService {
  private readonly logger = new Logger(CustomerProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getProfile(userId: string): Promise<CustomerProfileSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Customer profile not found.');
    }

    const [ordersCount, wishlistCount, reviewsCount, unreadNotifsCount] = await Promise.all([
      this.prisma.order.count({ where: { customerId: userId } }),
      this.prisma.wishlistItem.count({ where: { userId } }),
      this.prisma.productReview.count({ where: { customerId: userId } }),
      this.prisma.customerNotification.count({ where: { userId, isRead: false } }),
    ]);

    const defaultAddress = user.addresses?.[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: defaultAddress?.phone ?? undefined,
      role: user.role.name,
      totalOrders: ordersCount,
      totalWishlist: wishlistCount,
      totalReviews: reviewsCount,
      unreadNotifications: unreadNotifsCount,
      joinedDate: user.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfileSummary> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Customer not found.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName ? { firstName: input.firstName.trim() } : {}),
        ...(input.lastName ? { lastName: input.lastName.trim() } : {}),
      },
    });

    if (input.phone && input.phone.trim().length > 0) {
      const trimmedPhone = input.phone.trim();
      const defaultAddr = await this.prisma.userAddress.findFirst({
        where: { userId, isDefault: true },
      });
      if (defaultAddr) {
        await this.prisma.userAddress.update({
          where: { id: defaultAddr.id },
          data: { phone: trimmedPhone },
        });
      } else {
        const anyAddr = await this.prisma.userAddress.findFirst({
          where: { userId },
        });
        if (anyAddr) {
          await this.prisma.userAddress.update({
            where: { id: anyAddr.id },
            data: { phone: trimmedPhone, isDefault: true },
          });
        } else {
          await this.prisma.userAddress.create({
            data: {
              userId,
              label: 'Primary',
              recipientName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
              phone: trimmedPhone,
              streetAddress: 'Main Delivery Address',
              city: 'Lahore',
              province: 'Punjab',
              postalCode: '54000',
              country: 'Pakistan',
              isDefault: true,
            },
          });
        }
      }
    }

    return this.getProfile(userId);
  }

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Customer not found.');
    }

    const isMatch = await this.passwordService.compare(input.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password.');
    }

    if (input.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long.');
    }

    const hashedPassword = await this.passwordService.hash(input.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    return { success: true };
  }
}
