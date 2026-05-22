"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
let AuditLogService = class AuditLogService {
    constructor(config) {
        this.config = config;
        const runtimeDir = path.resolve(process.cwd(), 'runtime');
        fs.mkdirSync(runtimeDir, { recursive: true });
        this.filePath = path.join(runtimeDir, 'audit-log.jsonl');
        this.cookieName = this.config.get('COOKIE_NAME', 'JSESSIONID');
    }
    decodeUserFromRequest(request) {
        const enrichedUser = request?.authUser;
        if (enrichedUser?.email) {
            return {
                email: String(enrichedUser.email),
                name: String(enrichedUser.name ?? enrichedUser.email),
            };
        }
        return null;
    }
    getIp(request) {
        return (request?.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim() ||
            request?.ip ||
            request?.socket?.remoteAddress ||
            '');
    }
    rotateIfNeeded() {
        const maxSize = 5 * 1024 * 1024;
        if (!fs.existsSync(this.filePath))
            return;
        const stats = fs.statSync(this.filePath);
        if (stats.size < maxSize)
            return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotated = `${this.filePath}.${timestamp}`;
        fs.renameSync(this.filePath, rotated);
        const dir = path.dirname(this.filePath);
        const rotatedFiles = fs
            .readdirSync(dir)
            .filter((f) => f.startsWith('audit-log.jsonl.') && !f.endsWith('.jsonl'));
        if (rotatedFiles.length > 100) {
            const toDelete = rotatedFiles.sort().slice(0, rotatedFiles.length - 100);
            for (const file of toDelete) {
                fs.unlinkSync(path.join(dir, file));
            }
        }
    }
    cleanAnonymousLogs() {
        if (!fs.existsSync(this.filePath))
            return 0;
        const lines = fs
            .readFileSync(this.filePath, 'utf8')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        const filtered = lines.filter((line) => {
            try {
                const entry = JSON.parse(line);
                return entry.actorEmail !== 'anonymous';
            }
            catch {
                return false;
            }
        });
        fs.writeFileSync(this.filePath, filtered.join('\n') + '\n', 'utf8');
        return lines.length - filtered.length;
    }
    record(action) {
        this.rotateIfNeeded();
        const entry = {
            timestamp: new Date().toISOString(),
            actorEmail: action.actorEmail ?? 'system',
            actorName: action.actorName ?? action.actorEmail ?? 'system',
            action: action.action,
            entityType: action.entityType,
            entityValue: action.entityValue,
            status: action.status,
            sourceIp: '',
            metadata: action.metadata,
        };
        fs.appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, 'utf8');
        return entry;
    }
    capture(request, action) {
        this.rotateIfNeeded();
        const user = this.decodeUserFromRequest(request);
        const entry = {
            timestamp: new Date().toISOString(),
            actorEmail: user?.email ?? action.entityValue ?? 'anonymous',
            actorName: user?.name ?? action.entityValue ?? 'Anonymous User',
            action: action.action,
            entityType: action.entityType,
            entityValue: action.entityValue,
            status: action.status,
            sourceIp: this.getIp(request),
            metadata: {
                ...action.metadata,
                userAgent: request?.headers['user-agent'] || 'unknown',
            },
        };
        fs.appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, 'utf8');
        return entry;
    }
    list(limit = 100) {
        if (!fs.existsSync(this.filePath))
            return [];
        const lines = fs
            .readFileSync(this.filePath, 'utf8')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        return lines
            .map((line) => {
            try {
                return JSON.parse(line);
            }
            catch {
                return null;
            }
        })
            .filter((entry) => Boolean(entry))
            .slice(-Math.max(1, limit))
            .reverse();
    }
    getAllLogs() {
        const dir = path.dirname(this.filePath);
        const files = fs
            .readdirSync(dir)
            .filter((f) => f.startsWith('audit-log.jsonl'));
        let entries = [];
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const lines = fs
                .readFileSync(fullPath, 'utf8')
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
            for (const line of lines) {
                try {
                    entries.push(JSON.parse(line));
                }
                catch { }
            }
        }
        return entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map