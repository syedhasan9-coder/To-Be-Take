import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShippingStatus } from '@tobetake/database';
import {
  CourierBookingParams,
  CourierBookingResult,
  CourierTrackingResult,
  ICourierProvider,
} from '../interfaces/courier-provider.interface';

@Injectable()
export class TcsCourierProvider implements ICourierProvider {
  readonly code = 'TCS';
  readonly name = 'TCS Express Pakistan';
  private readonly logger = new Logger(TcsCourierProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('TCS_API_KEY');
    const costCenterCode = this.configService.get<string>('TCS_COST_CENTER_CODE');
    const accountNo = this.configService.get<string>('TCS_ACCOUNT_NO');
    return Boolean(apiKey && costCenterCode && accountNo);
  }

  async bookShipment(params: CourierBookingParams): Promise<CourierBookingResult> {
    // If real API credentials are configured, execute official TCS COD API booking
    if (this.isConfigured()) {
      const baseUrl = this.configService.get<string>(
        'TCS_BASE_URL',
        'https://apis.tcsexpress.com/cod/v1',
      );
      const apiKey = this.configService.get<string>('TCS_API_KEY');
      const costCenterCode = this.configService.get<string>('TCS_COST_CENTER_CODE');

      try {
        const payload = {
          userName: this.configService.get<string>('TCS_USERNAME'),
          password: this.configService.get<string>('TCS_PASSWORD'),
          costCenterCode,
          consigneeName: params.recipientName,
          consigneeAddress: params.destinationAddress,
          consigneeMobNo: params.recipientPhone,
          consigneeEmail: '',
          destinationCityName: params.destinationCity,
          pieces: params.pieces || 1,
          weight: params.weightKg || 0.5,
          codAmount: params.codAmount,
          customerRefNo: params.orderNumber,
          remarks: params.notes || `Order ${params.orderNumber}`,
        };

        const res = await fetch(`${baseUrl}/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-IBM-Client-Id': apiKey || '',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          this.logger.error(`TCS API error: ${res.status} - ${errText}`);
          throw new BadRequestException(`TCS Booking failed: HTTP ${res.status}`);
        }

        const data = (await res.json()) as Record<string, any>;
        const consignmentNumber = data?.returnStatus?.consignmentNumber || data?.consignmentNumber;
        if (!consignmentNumber) {
          throw new BadRequestException('TCS API did not return a valid consignment number');
        }

        return {
          carrier: this.name,
          carrierCode: this.code,
          trackingNumber: consignmentNumber,
          trackingUrl: `https://www.tcsexpress.com/tracking?consignment=${encodeURIComponent(consignmentNumber)}`,
          bookingMode: 'API',
          rawResponse: data,
          metadata: {
            weightKg: params.weightKg,
            pieces: params.pieces,
            codAmount: params.codAmount,
            bookedAt: new Date().toISOString(),
          },
        };
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`TCS API integration exception: ${err.message}`, err.stack);
        throw new BadRequestException(`TCS API booking failed: ${err.message}`);
      }
    }

    // When API credentials are not configured, allow manual booking mode if AWB is provided
    const manualAwb = params.trackingNumber?.trim();
    if (!manualAwb) {
      throw new BadRequestException(
        'TCS Courier API credentials are not configured. To book with TCS, provide a real manual AWB number.',
      );
    }

    if (manualAwb.length < 4 || manualAwb.length > 60) {
      throw new BadRequestException('TCS AWB number must be between 4 and 60 characters');
    }

    return {
      carrier: this.name,
      carrierCode: this.code,
      trackingNumber: manualAwb,
      trackingUrl: `https://www.tcsexpress.com/tracking?consignment=${encodeURIComponent(manualAwb)}`,
      bookingMode: 'MANUAL',
      metadata: {
        weightKg: params.weightKg,
        pieces: params.pieces,
        shippingCharges: params.shippingCharges || 0,
        codAmount: params.codAmount,
        recipientName: params.recipientName,
        recipientPhone: params.recipientPhone,
        destinationCity: params.destinationCity,
        bookedAt: new Date().toISOString(),
      },
    };
  }

  async trackShipment(trackingNumber: string): Promise<CourierTrackingResult> {
    return {
      trackingNumber,
      carrier: this.name,
      status: ShippingStatus.IN_TRANSIT,
      updatedAt: new Date(),
    };
  }
}
