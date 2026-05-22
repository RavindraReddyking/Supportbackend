import type { Request } from 'express';
import { CasinoLookupDto } from '../../common/dto/lookup.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CasinoService } from './casino.service';
export declare class CasinoController {
    private readonly casinoService;
    private readonly auditLogService;
    constructor(casinoService: CasinoService, auditLogService: AuditLogService);
    getDetails(dto: CasinoLookupDto, request: Request): Promise<import("../../common/types/api-response").ApiResponse<any> | {
        success: boolean;
        message: string;
    }>;
    getLCEnabledTables(dto: CasinoLookupDto, request: Request): Promise<import("../../common/types/api-response").ApiListResponse<any> | {
        success: boolean;
        message: string;
    }>;
}
