import { ShippingStatus } from '@tobetake/database';

export interface CourierBookingParams {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  destinationAddress: string;
  destinationCity: string;
  weightKg: number;
  pieces: number;
  codAmount: number;
  shippingCharges?: number;
  trackingNumber?: string; // Supplied in manual mode
  notes?: string;
}

export interface CourierBookingResult {
  carrier: string;
  carrierCode: string;
  trackingNumber: string;
  trackingUrl?: string;
  bookingMode: 'MANUAL' | 'API';
  estimatedDelivery?: Date;
  rawResponse?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CourierTrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  remarks?: string;
}

export interface CourierTrackingResult {
  trackingNumber: string;
  carrier: string;
  status: ShippingStatus;
  events?: CourierTrackingEvent[];
  updatedAt: Date;
}

export interface ICourierProvider {
  readonly code: string;
  readonly name: string;
  isConfigured(): boolean;
  bookShipment(params: CourierBookingParams): Promise<CourierBookingResult>;
  trackShipment(trackingNumber: string): Promise<CourierTrackingResult>;
}
