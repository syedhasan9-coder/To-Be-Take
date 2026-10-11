import { BadRequestException, Injectable } from '@nestjs/common';
import { ShippingStatus } from '@tobetake/database';
import {
  CourierBookingParams,
  CourierBookingResult,
  CourierTrackingResult,
  ICourierProvider,
} from '../interfaces/courier-provider.interface';

@Injectable()
export class ManualCourierProvider implements ICourierProvider {
  readonly code = 'MANUAL';
  readonly name = 'Manual Courier Booking';

  isConfigured(): boolean {
    return true; // Manual entry is always available
  }

  async bookShipment(params: CourierBookingParams): Promise<CourierBookingResult> {
    const awb = params.trackingNumber?.trim();
    if (!awb) {
      throw new BadRequestException('A valid manual tracking/AWB number is required for booking');
    }

    if (awb.length < 4 || awb.length > 60) {
      throw new BadRequestException('Tracking/AWB number must be between 4 and 60 characters');
    }

    // Reject obvious synthetic placeholders
    const lowercaseAwb = awb.toLowerCase();
    if (
      lowercaseAwb.includes('mock') ||
      lowercaseAwb.includes('placeholder') ||
      lowercaseAwb === 'test' ||
      lowercaseAwb === '12345'
    ) {
      throw new BadRequestException('Cannot use a mock or placeholder tracking number');
    }

    let trackingUrl: string | undefined;
    if (lowercaseAwb.startsWith('tcs')) {
      trackingUrl = `https://www.tcsexpress.com/tracking?consignment=${encodeURIComponent(awb)}`;
    } else if (lowercaseAwb.startsWith('leopards') || lowercaseAwb.startsWith('leo')) {
      trackingUrl = `https://leopardscourier.com/tracking?track=${encodeURIComponent(awb)}`;
    } else if (lowercaseAwb.startsWith('trax')) {
      trackingUrl = `https://sonic.pk/tracking?tracking_number=${encodeURIComponent(awb)}`;
    }

    return {
      carrier: this.name,
      carrierCode: this.code,
      trackingNumber: awb,
      trackingUrl,
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
