import { Controller, Get } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  list() {
    return this.auditLogService.list(20000);
  }

  // Return ALL logs (90 days)
  @Get('all')
  getAll() {
    return this.auditLogService.getAllLogs();
  }
}