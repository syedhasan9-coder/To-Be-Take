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
export class LeopardsCourierProvider implements ICourierProvider {
  readonly code = 'LEOPARDS';
  readonly name = 'Leopards Courier';
  private readonly logger = new Logger(LeopardsCourierProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('LEOPARDS_API_KEY');
    const apiPassword = this.configService.get<string>('LEOPARDS_API_PASSWORD');
    return Boolean(apiKey && apiPassword);
  }

  async bookShipment(params: CourierBookingParams): Promise<CourierBookingResult> {
    if (this.isConfigured()) {
      const baseUrl = this.configService.get<string>(
        'LEOPARDS_BASE_URL',
        'https://merchantapi.leopardscourier.com/api',
      );
      const apiKey = this.configService.get<string>('LEOPARDS_API_KEY');
      const apiPassword = this.configService.get<string>('LEOPARDS_API_PASSWORD');

      try {
        const payload = {
          api_key: apiKey,
          api_password: apiPassword,
          booked_packet_weight: params.weightKg || 500, // in grams
          booked_packet_no_piece: params.pieces || 1,
          booked_packet_collect_amount: params.codAmount,
          booked_packet_order_id: params.orderNumber,
          origin_city: this.configService.get<string>('LEOPARDS_ORIGIN_CITY', 'Lahore'),
          destination_city: params.destinationCity,
          shipment_name_eng: params.recipientName,
          shipment_email: '',
          shipment_phone: params.recipientPhone,
          shipment_address: params.destinationAddress,
          special_instructions: params.notes || `Order ${params.orderNumber}`,
        };

        const res = await fetch(`${baseUrl}/bookPacket/format/json/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          this.logger.error(`Leopards API error: ${res.status} - ${errText}`);
          throw new BadRequestException(`Leopards Booking failed: HTTP ${res.status}`);
        }

        const data = (await res.json()) as Record<string, any>;
        const trackNumber = data?.track_number;
        if (!trackNumber || data?.status === 0) {
          throw new BadRequestException(
            data?.error || 'Leopards API did not return a valid tracking number',
          );
        }

        return {
          carrier: this.name,
          carrierCode: this.code,
          trackingNumber: String(trackNumber),
          trackingUrl: `https://leopardscourier.com/tracking?track=${encodeURIComponent(trackNumber)}`,
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
        this.logger.error(`Leopards API exception: ${err.message}`, err.stack);
        throw new BadRequestException(`Leopards API booking failed: ${err.message}`);
      }
    }

    // Manual mode when API credentials are absent
    const manualAwb = params.trackingNumber?.trim();
    if (!manualAwb) {
      throw new BadRequestException(
        'Leopards Courier API credentials are not configured. To book with Leopards, provide a real manual AWB number.',
      );
    }

    if (manualAwb.length < 4 || manualAwb.length > 60) {
      throw new BadRequestException('Leopards AWB number must be between 4 and 60 characters');
    }

    return {
      carrier: this.name,
      carrierCode: this.code,
      trackingNumber: manualAwb,
      trackingUrl: `https://leopardscourier.com/tracking?track=${encodeURIComponent(manualAwb)}`,
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
