import { AuditLogService } from './audit-log.service';
export declare class AuditLogController {
    private readonly auditLogService;
    constructor(auditLogService: AuditLogService);
    list(): import("./audit-log.types").AuditLogEntry[];
    getAll(): import("./audit-log.types").AuditLogEntry[];
}
