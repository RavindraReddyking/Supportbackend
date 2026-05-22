import { Injectable } from '@nestjs/common';
import type { AuthSession } from '../auth.types';
import type { SessionStore } from './session-store.interface';

@Injectable()
export class MemorySessionStore implements SessionStore {
  readonly kind = 'memory' as const;
  private readonly sessions = new Map<string, AuthSession>();

  async get(token: string): Promise<AuthSession | null> {
    const session = this.sessions.get(token);
    return session ?? null;
  }

  async set(session: AuthSession): Promise<void> {
    this.sessions.set(session.token, session);
  }

  async delete(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async touch(session: AuthSession, ttlMs: number): Promise<AuthSession> {
    const now = Date.now();
    const updated: AuthSession = {
      ...session,
      lastActivityAt: now,
      expiresAt: now + ttlMs,
    };
    this.sessions.set(updated.token, updated);
    return updated;
  }
}
