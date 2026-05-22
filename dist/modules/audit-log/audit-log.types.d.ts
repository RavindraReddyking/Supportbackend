export type AuditLogEntry = {
    timestamp: string;
    actorEmail: string;
    actorName: string;
    action: string;
    entityType: string;
    entityValue: string;
    status: string;
    sourceIp: string;
    metadata?: Record<string, unknown>;
};
