import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { DepartmentResponseDto } from './dto/department-response.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve all departments ordered by ID.
   */
  async findAll(): Promise<DepartmentResponseDto[]> {
    this.logger.debug('Fetching all departments');
    const departments = await this.prisma.department.findMany({
      orderBy: { id: 'asc' },
    });

    return departments.map((dept) => new DepartmentResponseDto(dept));
  }

  /**
   * Find a single department by ID.
   */
  async findById(id: number): Promise<DepartmentResponseDto | null> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    return department ? new DepartmentResponseDto(department) : null;
  }
}
