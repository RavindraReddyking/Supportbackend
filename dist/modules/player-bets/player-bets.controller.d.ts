import type { Request } from 'express';
import { PlayerRangeDto } from '../../common/dto/lookup.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PlayerBetsService } from './player-bets.service';
export declare class PlayerBetsController {
    private readonly playerBetsService;
    private readonly auditLogService;
    constructor(playerBetsService: PlayerBetsService, auditLogService: AuditLogService);
    getInfo(dto: PlayerRangeDto, request: Request): Promise<import("../../common/types/api-response").ApiListResponse<any>>;
}
