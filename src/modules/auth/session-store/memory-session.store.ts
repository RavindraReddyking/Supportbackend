import { Injectable } from '@nestjs/common';
import type { AuthSession } from '../auth.types';
import type { SessionStore } from './session-store.interface';

@Injectable()
export class MemorySessionStore
  implements SessionStore
{
  readonly kind = 'memory' as const;

  private readonly sessions =
    new Map<string, AuthSession>();

  async get(
    token: string,
  ): Promise<AuthSession | null> {
    console.log(
      'SESSION MAP SIZE =>',
      this.sessions.size,
    );

    console.log(
      'TOKEN LOOKUP =>',
      token,
    );

    const session =
      this.sessions.get(token);

    console.log(
      'SESSION FOUND =>',
      !!session,
    );

    return session ?? null;
  }

  async set(
    session: AuthSession,
  ): Promise<void> {
    console.log(
      'SESSION CREATED =>',
      session.token,
    );

    this.sessions.set(
      session.token,
      session,
    );
  }

  async delete(
    token: string,
  ): Promise<void> {
    console.log(
      'SESSION DELETED =>',
      token,
    );

    this.sessions.delete(token);
  }

  async touch(
    session: AuthSession,
    ttlMs: number,
  ): Promise<AuthSession> {
    const now = Date.now();

    const updated: AuthSession = {
      ...session,
      lastActivityAt: now,
      expiresAt: now + ttlMs,
    };

    console.log(
      'SESSION TOUCHED =>',
      updated.token,
    );

    this.sessions.set(
      updated.token,
      updated,
    );

    return updated;
  }
}