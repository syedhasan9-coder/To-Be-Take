import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, AdminSearchResponse } from '@tobetake/shared-types';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminSearchService } from '../services/admin-search.service';

@Controller('admin/search')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminSearchController {
  constructor(private readonly searchService: AdminSearchService) {}

  @Get()
  async search(
    @Query('q') q?: string,
  ): Promise<ApiResponse<AdminSearchResponse>> {
    const data = await this.searchService.search(q);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
