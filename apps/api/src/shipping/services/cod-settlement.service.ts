import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentStatus, PrismaService } from '@tobetake/database';
import { CodSettlementInput, CodSettlementResult, CodSummaryInfo } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../../admin/decorators/current-user.decorator';
import { AdminAuditService } from '../../admin/services/admin-audit.service';

@Injectable()
export class CodSettlementService {
  private readonly logger = new Logger(CodSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Calculate COD requirements based on server-verified order totals and already-paid amounts.
   */
  async calculateCodDetails(orderId: string): Promise<CodSummaryInfo> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' was not found`);
    }

    const orderTotal = Number(order.total);
    const paidPayments = order.payments.filter((p) => p.status === PaymentStatus.PAID);
    const alreadyPaidAmount = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    const codPayment = order.payments.find((p) => p.paymentMethod === 'COD');
    const isCodOrder = Boolean(codPayment) || (order.paymentStatus === PaymentStatus.PENDING && alreadyPaidAmount < orderTotal);

    const expectedCodAmount = isCodOrder ? Math.max(0, orderTotal - alreadyPaidAmount) : 0;

    let reconciliationStatus: 'PENDING' | 'SETTLED' | 'DISCREPANCY' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    let remittanceReference: string | undefined;
    let amountReceived: number | undefined;
    let settlementDate: string | undefined;

    if (isCodOrder) {
      reconciliationStatus = 'PENDING';
      if (codPayment?.metadata) {
        try {
          const meta = JSON.parse(codPayment.metadata);
          if (meta.reconciliationStatus) {
            reconciliationStatus = meta.reconciliationStatus;
          }
          remittanceReference = meta.remittanceReference || codPayment.transactionReference;
          amountReceived = meta.amountReceived !== undefined ? Number(meta.amountReceived) : undefined;
          settlementDate = meta.settledAt || (codPayment.paidAt ? codPayment.paidAt.toISOString() : undefined);
        } catch {
          // ignore parsing error
        }
      } else if (codPayment?.status === PaymentStatus.PAID) {
        reconciliationStatus = 'SETTLED';
        remittanceReference = codPayment.transactionReference;
        amountReceived = Number(codPayment.amount);
        settlementDate = codPayment.paidAt ? codPayment.paidAt.toISOString() : undefined;
      }
    }

    return {
      isCodOrder,
      orderTotal,
      alreadyPaidAmount,
      expectedCodAmount,
      reconciliationStatus,
      remittanceReference,
      amountReceived,
      settlementDate,
    };
  }

  /**
   * Record courier remittance with discrepancy detection and verification safeguards.
   */
  async recordRemittance(
    orderId: string,
    input: CodSettlementInput,
    admin: AuthenticatedAdminUser,
  ): Promise<CodSettlementResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' was not found`);
    }

    const remittanceRef = input.remittanceReference?.trim();
    if (!remittanceRef) {
      throw new BadRequestException('A valid courier remittance reference is required');
    }

    const amountReceived = Number(input.amountReceived);
    if (isNaN(amountReceived) || amountReceived < 0) {
      throw new BadRequestException('Amount received must be a non-negative number');
    }

    const paidPayments = order.payments.filter((p) => p.status === PaymentStatus.PAID && p.paymentMethod !== 'COD');
    const alreadyPaidAmount = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const expectedCodAmount = Math.max(0, Number(order.total) - alreadyPaidAmount);

    const difference = Number((expectedCodAmount - amountReceived).toFixed(2));
    const isExactMatch = Math.abs(difference) < 0.01;
    const reconciliationStatus = isExactMatch ? 'SETTLED' : 'DISCREPANCY';

    const settlementTimestamp = input.settlementDate ? new Date(input.settlementDate) : new Date();

    const existingCodPayment = order.payments.find((p) => p.paymentMethod === 'COD');

    let updatedPaymentId: string | undefined;
    let finalPaymentStatus = order.paymentStatus;

    await this.prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!currentOrder) {
        throw new NotFoundException(`Order with ID '${orderId}' was not found`);
      }

      const activeCodPayment = currentOrder.payments.find((p) => p.paymentMethod === 'COD');

      // Prevent double-counting if order/payment is already settled
      if (activeCodPayment && activeCodPayment.status === PaymentStatus.PAID) {
        let metaParsed: any = {};
        try {
          metaParsed = activeCodPayment.metadata ? JSON.parse(activeCodPayment.metadata) : {};
        } catch {
          metaParsed = {};
        }

        if (metaParsed.reconciliationStatus === 'SETTLED') {
          // Idempotent retry with same remittance reference
          if (activeCodPayment.transactionReference === remittanceRef) {
            updatedPaymentId = activeCodPayment.id;
            finalPaymentStatus = currentOrder.paymentStatus;
            return;
          }
          throw new BadRequestException(
            `COD payment for order ${currentOrder.orderNumber} is already settled and reconciled with reference '${activeCodPayment.transactionReference}'. Duplicate settlement cannot be processed.`,
          );
        }
      }

      const meta = {
        remittanceReference: remittanceRef,
        amountReceived,
        expectedCodAmount,
        difference,
        reconciliationStatus,
        verifiedBy: admin.id,
        verifiedByName: admin.username,
        settledAt: settlementTimestamp.toISOString(),
        notes: input.notes || null,
      };

      if (isExactMatch) {
        finalPaymentStatus = PaymentStatus.PAID;
        // Exact match: mark Payment and Order as PAID
        if (activeCodPayment) {
          const updatedP = await tx.payment.update({
            where: { id: activeCodPayment.id },
            data: {
              status: PaymentStatus.PAID,
              amount: amountReceived,
              transactionReference: remittanceRef,
              paidAt: settlementTimestamp,
              metadata: JSON.stringify(meta),
            },
          });
          updatedPaymentId = updatedP.id;
        } else {
          const newP = await tx.payment.create({
            data: {
              orderId,
              paymentMethod: 'COD',
              amount: amountReceived,
              currency: currentOrder.currency,
              status: PaymentStatus.PAID,
              transactionReference: remittanceRef,
              paidAt: settlementTimestamp,
              metadata: JSON.stringify(meta),
            },
          });
          updatedPaymentId = newP.id;
        }

        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.PAID },
        });
      } else {
        // Discrepancy: DO NOT mark order as PAID. Flag discrepancy for review.
        if (activeCodPayment) {
          const updatedP = await tx.payment.update({
            where: { id: activeCodPayment.id },
            data: {
              metadata: JSON.stringify({
                ...meta,
                discrepancyFlag: true,
                warning: `Remittance amount PKR ${amountReceived} does not match expected COD collection PKR ${expectedCodAmount}. Difference: PKR ${difference}`,
              }),
            },
          });
          updatedPaymentId = updatedP.id;
        } else {
          const newP = await tx.payment.create({
            data: {
              orderId,
              paymentMethod: 'COD',
              amount: amountReceived,
              currency: currentOrder.currency,
              status: PaymentStatus.PENDING,
              transactionReference: remittanceRef,
              metadata: JSON.stringify({
                ...meta,
                discrepancyFlag: true,
                warning: `Remittance amount PKR ${amountReceived} does not match expected COD collection PKR ${expectedCodAmount}. Difference: PKR ${difference}`,
              }),
            },
          });
          updatedPaymentId = newP.id;
        }
      }
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'COD_REMITTANCE_RECORDED',
      targetType: 'Order',
      targetId: orderId,
      details: {
        orderNumber: order.orderNumber,
        remittanceReference: remittanceRef,
        amountReceived,
        expectedCodAmount,
        difference,
        reconciliationStatus,
        isExactMatch,
      },
    });

    return {
      orderId,
      orderNumber: order.orderNumber,
      expectedCodAmount,
      amountReceived,
      difference,
      reconciliationStatus,
      paymentId: updatedPaymentId,
      paymentStatus: finalPaymentStatus,
      settledAt: settlementTimestamp.toISOString(),
      notes: input.notes,
    };
  }
}
