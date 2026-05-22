import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuditLogEntry } from './audit-log.types';
type PartialAuditLogEntry = Omit<AuditLogEntry, 'timestamp' | 'actorEmail' | 'actorName' | 'sourceIp'> & {
    actorEmail?: string;
    actorName?: string;
};
export declare class AuditLogService {
    private readonly config;
    private readonly filePath;
    private readonly cookieName;
    constructor(config: ConfigService);
    private decodeUserFromRequest;
    private getIp;
    private rotateIfNeeded;
    cleanAnonymousLogs(): number;
    record(action: PartialAuditLogEntry): AuditLogEntry;
    capture(request: Request | undefined, action: Omit<PartialAuditLogEntry, 'actorEmail' | 'actorName'>): AuditLogEntry;
    list(limit?: number): AuditLogEntry[];
    getAllLogs(): AuditLogEntry[];
}
export {};
