import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuditLogEntry } from './audit-log.types';

type PartialAuditLogEntry = Omit<
  AuditLogEntry,
  'timestamp' | 'actorEmail' | 'actorName' | 'sourceIp'
> & {
  actorEmail?: string;
  actorName?: string;
};

@Injectable()
export class AuditLogService {
  private readonly filePath: string;
  private readonly cookieName: string;

  constructor(private readonly config: ConfigService) {
    const runtimeDir = path.resolve(process.cwd(), 'runtime');
    fs.mkdirSync(runtimeDir, { recursive: true });

    this.filePath = path.join(runtimeDir, 'audit-log.jsonl');
    this.cookieName = this.config.get<string>('COOKIE_NAME', 'JSESSIONID');
  }

  private decodeUserFromRequest(
    request?: Request,
  ): { email: string; name: string } | null {
    const enrichedUser = (
      request as Request & {
        authUser?: { email?: string; name?: string };
      }
    )?.authUser;

    if (enrichedUser?.email) {
      return {
        email: String(enrichedUser.email),
        name: String(enrichedUser.name ?? enrichedUser.email),
      };
    }

    return null;
  }

  private getIp(request?: Request): string {
    return (
      (request?.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ||
      request?.ip ||
      request?.socket?.remoteAddress ||
      ''
    );
  }

  // ⭐ Rotate at 5MB, keep last 100 files (≈90 days)
  private rotateIfNeeded() {
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!fs.existsSync(this.filePath)) return;

    const stats = fs.statSync(this.filePath);
    if (stats.size < maxSize) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotated = `${this.filePath}.${timestamp}`;

    fs.renameSync(this.filePath, rotated);

    const dir = path.dirname(this.filePath);
    const rotatedFiles = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('audit-log.jsonl.') && !f.endsWith('.jsonl'));

    // ⭐ Keep last 100 rotated logs (≈500MB → 90 days)
    if (rotatedFiles.length > 100) {
      const toDelete = rotatedFiles.sort().slice(0, rotatedFiles.length - 100);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }

  cleanAnonymousLogs(): number {
    if (!fs.existsSync(this.filePath)) return 0;

    const lines = fs
      .readFileSync(this.filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const filtered = lines.filter((line) => {
      try {
        const entry = JSON.parse(line);
        return entry.actorEmail !== 'anonymous';
      } catch {
        return false;
      }
    });

    fs.writeFileSync(this.filePath, filtered.join('\n') + '\n', 'utf8');

    return lines.length - filtered.length;
  }

  record(action: PartialAuditLogEntry): AuditLogEntry {
    this.rotateIfNeeded();

    const entry: AuditLogEntry = {
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

  capture(
    request: Request | undefined,
    action: Omit<PartialAuditLogEntry, 'actorEmail' | 'actorName'>,
  ): AuditLogEntry {
    this.rotateIfNeeded();

    const user = this.decodeUserFromRequest(request);

    const entry: AuditLogEntry = {
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

  list(limit = 100): AuditLogEntry[] {
    if (!fs.existsSync(this.filePath)) return [];

    const lines = fs
      .readFileSync(this.filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as AuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is AuditLogEntry => Boolean(entry))
      .slice(-Math.max(1, limit))
      .reverse();
  }

  // ⭐ Return ALL logs from ALL rotated files (for frontend)
  getAllLogs(): AuditLogEntry[] {
    const dir = path.dirname(this.filePath);

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('audit-log.jsonl'));

    let entries: AuditLogEntry[] = [];

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
        } catch {}
      }
    }

    return entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }
}
