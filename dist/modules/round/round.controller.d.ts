import type { Request } from 'express';
import { RoundLookupDto } from '../../common/dto/lookup.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RoundService } from './round.service';
export declare class RoundController {
    private readonly roundService;
    private readonly auditLogService;
    constructor(roundService: RoundService, auditLogService: AuditLogService);
    getBetTable(dto: RoundLookupDto, request: Request): Promise<any>;
    getTptTable(dto: RoundLookupDto, request: Request): Promise<any>;
    getCardDetails(dto: RoundLookupDto, request: Request): Promise<any>;
    getGameDetails(dto: RoundLookupDto, request: Request): Promise<any>;
}
