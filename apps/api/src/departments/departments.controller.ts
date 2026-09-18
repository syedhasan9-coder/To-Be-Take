import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@tobetake/shared-types';
import { DepartmentsService } from './departments.service';
import { DepartmentResponseDto } from './dto/department-response.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getDepartments(): Promise<ApiResponse<DepartmentResponseDto[]>> {
    const departments = await this.departmentsService.findAll();

    return {
      success: true,
      message: 'Departments retrieved successfully',
      data: departments,
      timestamp: new Date().toISOString(),
    };
  }
}
