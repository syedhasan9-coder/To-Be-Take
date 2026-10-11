import { BadRequestException, Injectable } from '@nestjs/common';
import { CourierProviderInfo } from '@tobetake/shared-types';
import {
  CourierBookingParams,
  CourierBookingResult,
  CourierTrackingResult,
  ICourierProvider,
} from '../interfaces/courier-provider.interface';
import { LeopardsCourierProvider } from '../providers/leopards-courier.provider';
import { ManualCourierProvider } from '../providers/manual-courier.provider';
import { TcsCourierProvider } from '../providers/tcs-courier.provider';

@Injectable()
export class CourierRegistryService {
  private readonly providers = new Map<string, ICourierProvider>();

  constructor(
    private readonly manualProvider: ManualCourierProvider,
    private readonly tcsProvider: TcsCourierProvider,
    private readonly leopardsProvider: LeopardsCourierProvider,
  ) {
    this.registerProvider(manualProvider);
    this.registerProvider(tcsProvider);
    this.registerProvider(leopardsProvider);
  }

  private registerProvider(provider: ICourierProvider) {
    this.providers.set(provider.code.toUpperCase(), provider);
  }

  getAvailableProviders(): CourierProviderInfo[] {
    return [
      {
        code: 'TCS',
        name: this.tcsProvider.name,
        isConfigured: this.tcsProvider.isConfigured(),
        requiresManualAwb: !this.tcsProvider.isConfigured(),
        description: this.tcsProvider.isConfigured()
          ? 'Automated TCS COD API booking'
          : 'Manual TCS booking (enter real consignment AWB)',
      },
      {
        code: 'LEOPARDS',
        name: this.leopardsProvider.name,
        isConfigured: this.leopardsProvider.isConfigured(),
        requiresManualAwb: !this.leopardsProvider.isConfigured(),
        description: this.leopardsProvider.isConfigured()
          ? 'Automated Leopards COD API booking'
          : 'Manual Leopards booking (enter real CN number)',
      },
      {
        code: 'MANUAL',
        name: this.manualProvider.name,
        isConfigured: true,
        requiresManualAwb: true,
        description: 'Standard manual courier booking (Trax, Daewoo, PostEx, etc.)',
      },
    ];
  }

  getProvider(codeOrName: string): ICourierProvider {
    const key = (codeOrName || 'MANUAL').trim().toUpperCase();
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    if (key.includes('TCS')) return this.tcsProvider;
    if (key.includes('LEOPARD')) return this.leopardsProvider;

    return this.manualProvider;
  }

  async bookShipment(
    carrierInput: string,
    params: CourierBookingParams,
  ): Promise<CourierBookingResult> {
    const provider = this.getProvider(carrierInput);
    const result = await provider.bookShipment(params);

    // If carrierInput was a specific custom courier name (e.g., 'Trax Express'), preserve it
    if (provider.code === 'MANUAL' && carrierInput && carrierInput.toUpperCase() !== 'MANUAL') {
      result.carrier = carrierInput.trim();
    }

    return result;
  }

  async trackShipment(
    carrierInput: string,
    trackingNumber: string,
  ): Promise<CourierTrackingResult> {
    const provider = this.getProvider(carrierInput);
    return provider.trackShipment(trackingNumber);
  }
}
